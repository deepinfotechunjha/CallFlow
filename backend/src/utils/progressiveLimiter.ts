import type { Request } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;

/**
 * Calculates lockout duration in seconds based on consecutive failed attempts.
 * 5 fails  -> 1 min (60s)
 * 6 fails  -> 2 min (120s)
 * 7 fails  -> 5 min (300s)
 * 8 fails  -> 10 min (600s)
 * 9 fails  -> 15 min (900s)
 * 10 fails -> 30 min (1800s)
 * 11 fails -> 60 min / 1hr (3600s)
 * 12 fails -> 90 min / 1.5hr (5400s)
 * 13 fails -> 120 min / 2hr (7200s)
 * 14+ fails -> +60 min (3600s) per additional fail (3hr, 4hr, etc.)
 */
export function getLockoutDurationSeconds(failedAttempts: number): number {
  if (failedAttempts < MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    return 0;
  }

  const ladder: { [attempts: number]: number } = {
    5: 60, // 1 min
    6: 120, // 2 min
    7: 300, // 5 min
    8: 600, // 10 min
    9: 900, // 15 min
    10: 1800, // 30 min
    11: 3600, // 60 min (1 hr)
    12: 5400, // 90 min (1.5 hr)
    13: 7200, // 120 min (2 hr)
  };

  if (ladder[failedAttempts] !== undefined) {
    return ladder[failedAttempts];
  }

  // 14th and beyond: 2 hours + 1 hour per attempt over 13
  const extraHours = failedAttempts - 13;
  return 7200 + extraHours * 3600;
}

/**
 * Extracts a device hash from the incoming request.
 * Uses x-device-id header if available, otherwise hashes user-agent + IP.
 */
export function getDeviceFingerprint(req: Request): string {
  const customDeviceId = req.headers["x-device-id"] as string | undefined;
  if (customDeviceId && customDeviceId.trim().length > 0) {
    return customDeviceId.trim();
  }

  const forwardedFor = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim();
  const ip = forwardedFor || req.ip || req.socket.remoteAddress || "unknown-ip";
  const userAgent = (req.headers["user-agent"] as string) || "unknown-ua";

  return crypto.createHash("sha256").update(`${ip}:${userAgent}`).digest("hex").substring(0, 32);
}

/**
 * Builds a standardized key purely by action + device fingerprint (Strictly Device-Wise).
 * Any username / email / hostname on the same device contributes to the same attempt counter.
 */
export function buildRateLimitKey(action: string, _identifier: string, req: Request): string {
  const device = getDeviceFingerprint(req);
  return `${action}:${device}`;
}

/**
 * Formats remaining seconds into a human-readable string (e.g. "1 minute 30 seconds" or "2 hours").
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "a few seconds";

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs} hour${hrs > 1 ? "s" : ""}`);
  if (mins > 0) parts.push(`${mins} minute${mins > 1 ? "s" : ""}`);
  if (secs > 0 && hrs === 0) parts.push(`${secs} second${secs > 1 ? "s" : ""}`);

  return parts.join(" ") || "a few seconds";
}

export interface RateLimitCheckResult {
  isLocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number | undefined;
  lockedUntil?: Date | null | undefined;
  message?: string | undefined;
}

/**
 * Checks if a user+device is currently locked out or how many attempts remain.
 */
export async function checkRateLimit(
  prisma: PrismaClient,
  action: string,
  identifier: string,
  req: Request
): Promise<RateLimitCheckResult> {
  const key = buildRateLimitKey(action, identifier, req);

  try {
    const record = await prisma.authAttempt.findUnique({
      where: { key }
    });

    if (!record) {
      return {
        isLocked: false,
        remainingAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT
      };
    }

    const now = Date.now();

    // Check active lockout
    if (record.lockedUntil && record.lockedUntil.getTime() > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil.getTime() - now) / 1000);
      const timeStr = formatTimeRemaining(retryAfterSeconds);
      return {
        isLocked: true,
        remainingAttempts: 0,
        retryAfterSeconds,
        lockedUntil: record.lockedUntil,
        message: `Too many failed attempts. Access is temporarily locked. Please try again in ${timeStr}.`
      };
    }

    // Lockout is not currently active.
    // Determine if 1-hour reset window has passed:
    // If there was a previous lockout, 1 hour must pass AFTER the lockout expired.
    // If there was no lockout (1-4 failed attempts), 1 hour must pass AFTER the first failed attempt.
    const resetBaseTime = record.lockedUntil ? record.lockedUntil.getTime() : record.firstFailedAt.getTime();
    if (now - resetBaseTime > ONE_HOUR_MS) {
      // 1 full hour has passed without activity, reset completely
      await prisma.authAttempt.delete({
        where: { key }
      }).catch(() => {});

      return {
        isLocked: false,
        remainingAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT
      };
    }

    const remaining = Math.max(0, MAX_ATTEMPTS_BEFORE_LOCKOUT - record.failedAttempts);
    console.log(`[RateLimiter] [${action}] '${identifier}' allowed. ${remaining} attempts remaining.`);
    return {
      isLocked: false,
      remainingAttempts: remaining
    };
  } catch (error) {
    console.error("[RateLimiter] Rate limit check error:", error);
    return {
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT
    };
  }
}

/**
 * Records a failed attempt, increments failure count, and applies escalating lockout if threshold reached.
 */
export async function recordFailedAttempt(
  prisma: PrismaClient,
  action: string,
  identifier: string,
  req: Request
): Promise<RateLimitCheckResult> {
  const key = buildRateLimitKey(action, identifier, req);
  const now = new Date();

  try {
    const existing = await prisma.authAttempt.findUnique({
      where: { key }
    });

    let newFailedAttempts = 1;
    let firstFailedAt = now;

    if (existing) {
      const resetBaseTime = existing.lockedUntil ? existing.lockedUntil.getTime() : existing.firstFailedAt.getTime();
      const isPastHour = now.getTime() - resetBaseTime > ONE_HOUR_MS;
      const isCurrentlyLocked = existing.lockedUntil && existing.lockedUntil.getTime() > now.getTime();

      // Only reset 1-hour window if NOT currently locked AND a full hour has passed
      if (isPastHour && !isCurrentlyLocked) {
        newFailedAttempts = 1;
        firstFailedAt = now;
      } else {
        newFailedAttempts = existing.failedAttempts + 1;
        firstFailedAt = existing.firstFailedAt;
      }
    }

    const lockoutSeconds = getLockoutDurationSeconds(newFailedAttempts);
    const lockedUntil = lockoutSeconds > 0 ? new Date(now.getTime() + lockoutSeconds * 1000) : null;

    await prisma.authAttempt.upsert({
      where: { key },
      create: {
        key,
        failedAttempts: newFailedAttempts,
        firstFailedAt,
        lastFailedAt: now,
        lockedUntil
      },
      update: {
        failedAttempts: newFailedAttempts,
        firstFailedAt,
        lastFailedAt: now,
        lockedUntil
      }
    });

    if (lockoutSeconds > 0) {
      const timeStr = formatTimeRemaining(lockoutSeconds);
      console.warn(`[RateLimiter] 🚫 [${action}] '${identifier}' LOCKED OUT for ${timeStr} (attempt #${newFailedAttempts})`);
      return {
        isLocked: true,
        remainingAttempts: 0,
        retryAfterSeconds: lockoutSeconds,
        lockedUntil: lockedUntil || undefined,
        message: `Too many failed attempts. Access is locked for this device. Please try again in ${timeStr}.`
      };
    }

    const remaining = Math.max(0, MAX_ATTEMPTS_BEFORE_LOCKOUT - newFailedAttempts);
    console.log(`[RateLimiter] ⚠️ [${action}] '${identifier}' failed attempt #${newFailedAttempts}. ${remaining} attempts remaining.`);
    return {
      isLocked: false,
      remainingAttempts: remaining,
      message: `Invalid credentials. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining in this 1-hour window.`
    };
  } catch (error) {
    console.error("[RateLimiter] Record failed attempt error:", error);
    return {
      isLocked: false,
      remainingAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT - 1,
      message: "Invalid credentials."
    };
  }
}

/**
 * Resets the attempt counter upon a successful authentication.
 */
export async function resetRateLimit(
  prisma: PrismaClient,
  action: string,
  identifier: string,
  req: Request
): Promise<void> {
  const key = buildRateLimitKey(action, identifier, req);
  try {
    await prisma.authAttempt.deleteMany({
      where: { key }
    });
  } catch (error) {
    console.error("Reset rate limit error:", error);
  }
}
