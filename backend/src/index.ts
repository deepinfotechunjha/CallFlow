import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import type { Request, Response, NextFunction } from "express";


dotenv.config();


// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                username: string;
                role: string;
            };
        }
    }
}

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
    };
}

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}


// Enhanced Prisma configuration for Neon free tier
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!
    }
  },
  log: ['error', 'warn'],
  errorFormat: 'pretty'
});

// Connection retry wrapper
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      
      // Check if it's a connection error
      if (error.code === 'P1001' || error.message.includes('timeout') || error.message.includes('connection')) {
        console.log(`Database connection attempt ${i + 1} failed, retrying in ${2000 * (i + 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Keep database alive system
let keepAliveInterval: NodeJS.Timeout;

async function startKeepAlive() {
  const interval = parseInt(process.env.KEEP_ALIVE_INTERVAL || '240000'); // 4 minutes default
  
  keepAliveInterval = setInterval(async () => {
    try {
      await withRetry(() => prisma.$queryRaw`SELECT 1`);
      console.log('Database keep-alive ping successful');
    } catch (error) {
      console.error('Keep-alive ping failed:', error);
    }
  }, interval);
  
  console.log(`Database keep-alive started (${interval/1000}s interval)`);
}
const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    'https://call-manage.netlify.app',
    'https://deploy-call.netlify.app',
    'https://deploycall.netlify.app',
    'https://deepcallflow.netlify.app', // Add your actual Netlify URL
    'http://localhost:5174',
    'http://localhost:5175'
];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.json());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) return callback(null, true);
        
        // Allow localhost in development with proper validation
        if (process.env.NODE_ENV !== 'production') {
            const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
            if (localhostPattern.test(origin)) {
                return callback(null, true);
            }
        }
        
        console.warn('CORS blocked origin: [REDACTED]');
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200
}));

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

// In-memory OTP cache
const otpCache = new Map();

// In-memory used share tokens cache (for one-time use)
const usedShareTokens = new Set();

// Helper function to clean expired OTPs
function cleanExpiredOTPs() {
  const now = Date.now();
  for (const [key, data] of otpCache.entries()) {
    if (data.expiresAt < now) {
      otpCache.delete(key);
    }
  }
}

// Helper function to clean expired used tokens
function cleanExpiredUsedTokens() {
  // Clear all used tokens older than 24 hours (they would be expired anyway)
  // Since we can't track individual token expiry in Set, we clear all periodically
  if (usedShareTokens.size > 1000) {
    usedShareTokens.clear();
  }
}

// Clean expired OTPs every minute
setInterval(cleanExpiredOTPs, 60 * 1000);

// Clean expired used tokens every hour
setInterval(cleanExpiredUsedTokens, 60 * 60 * 1000);

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Helper function to generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to send OTP email
async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'CallFlow - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">CallFlow Secret Password Reset</h2>
          <p>You have requested to reset your secret password for accessing User Management. Please use the following OTP to proceed:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this secret password reset, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">CallFlow Call Management System</p>
        </div>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

// Helper function to send deletion notification email
async function sendDeletionNotificationEmail(
  hostEmails: string[], 
  deletedByName: string, 
  deletedAt: Date, 
  callCount: number
): Promise<void> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: hostEmails.join(','),
      subject: 'CallFlow - Completed Calls Deleted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🗑️ Completed Calls Deletion Notice</h2>
          <p>A HOST user has deleted completed calls from the system.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Deleted By:</strong> ${deletedByName}<br>
            <strong>Date:</strong> ${deletedAt.toLocaleDateString()}<br>
            <strong>Time:</strong> ${deletedAt.toLocaleTimeString()}<br>
            <strong>Number of Calls Deleted:</strong> ${callCount}
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification. The deleted data has been exported to the HOST's device.
          </p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">CallFlow Call Management System</p>
        </div>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send deletion notification email:', error);
  }
}

// Helper function to send service deletion notification email
async function sendServiceDeletionNotificationEmail(
  hostEmails: string[], 
  deletedByName: string, 
  deletedAt: Date, 
  serviceCount: number
): Promise<void> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: hostEmails.join(','),
      subject: 'CallFlow - Delivered Services Deleted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🗑️ Delivered Services Deletion Notice</h2>
          <p>A HOST user has deleted delivered services from the system.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Deleted By:</strong> ${deletedByName}<br>
            <strong>Date:</strong> ${deletedAt.toLocaleDateString()}<br>
            <strong>Time:</strong> ${deletedAt.toLocaleTimeString()}<br>
            <strong>Number of Services Deleted:</strong> ${serviceCount}
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification. The deleted data has been exported to the HOST's device.
          </p>
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">CallFlow Call Management System</p>
        </div>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send service deletion notification email:', error);
  }
}

function signToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
        return null;
    }
}

// Helper function to clean up old notifications
const cleanupOldNotifications = async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: { lt: twentyFourHoursAgo }
            }
        });
        if (result.count > 0) {
            console.log(`Cleaned up ${result.count} old notifications`);
        }
    } catch (error) {
        console.error('Failed to cleanup old notifications:', error);
    }
};

// Database health monitoring
setInterval(async () => {
  try {
    const start = Date.now();
    await withRetry(() => prisma.$queryRaw`SELECT 1`);
    const latency = Date.now() - start;
    
    if (latency > 5000) {
      console.warn(`High database latency detected: ${latency}ms`);
    }
  } catch (error) {
    console.error('Database health check failed:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Run cleanup every hour
setInterval(() => {
    cleanupOldNotifications();
    cleanExpiredOTPs();
    cleanExpiredUsedTokens();
}, 60 * 60 * 1000);

// WebSocket connection handling
const userSockets = new Map<number, string>();

// Helper function to emit to all connected clients
const emitToAll = (event: string, data: any) => {
    io.emit(event, data);
};

// Simple auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const auth = req.headers['authorization'] as string | undefined;
        if (!auth) {
            console.log('Missing Authorization header');
            return res.status(401).json({ error: 'Missing Authorization header' });
        }
        const parts = auth.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.log('Invalid Authorization format:', auth.substring(0, 20) + '...');
            return res.status(401).json({ error: 'Invalid Authorization format' });
        }
        const token = parts[1];
        if (!token) {
            console.log('Missing token');
            return res.status(401).json({ error: 'Missing token' });
        }
        const payload = verifyToken(token as string);
        if (!payload) {
            console.log('Invalid token:', token.substring(0, 20) + '...');
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = payload;
        next();
    } catch (err: any) {
        console.error('Authentication error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

// Role-based authorization middleware
function requireRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            next();
        } catch (err: any) {
            console.error('Authorization error:', err);
            res.status(500).json({ error: 'Authorization failed' });
        }
    };
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Initialize database connection with retry logic
async function initializeDatabase() {
    try {
        await withRetry(() => prisma.$connect());
        console.log('Database connected successfully');
        
        // Check if tables exist by trying to count users
        const userCount = await withRetry(() => prisma.user.count());
        console.log(`Database initialized. User count: ${userCount}`);
        
        // Initial cleanup of old notifications
        await cleanupOldNotifications();
        
        // Start keep-alive system
        await startKeepAlive();
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

// Enhanced health check endpoint
app.get("/health", async (_req: Request, res: Response) => {
    try {
        const start = Date.now();
        await withRetry(() => prisma.$queryRaw`SELECT 1`);
        const latency = Date.now() - start;
        
        const userCount = await withRetry(() => prisma.user.count());
        
        res.json({ 
            status: "ok", 
            message: "Server and database are running",
            userCount,
            latency: `${latency}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (err: any) {
        console.error('Health check failed:', err);
        res.status(500).json({ 
            status: "error", 
            error: 'Database connection failed', 
            details: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Auth endpoints
app.post('/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await withRetry(() => prisma.user.findUnique({ where: { username } }));
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        let ok = false;
        try {
            ok = await bcrypt.compare(password, user.password);
        } catch (e) {
            console.error('Password comparison error:', e);
            ok = false;
        }

        if (!ok && user.password === password) {
            ok = true;
        }

        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const token = signToken({ 
            id: user.id, 
            username: user.username, 
            role: user.role 
        });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                phone: user.phone,
                role: user.role, 
                createdAt: user.createdAt 
            } 
        });
    } catch (err: any) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/auth/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const user = await withRetry(() => prisma.user.findUnique({ 
            where: { id: req.user!.id },
            select: { id: true, username: true, email: true, phone: true, role: true, createdAt: true }
        }));
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (err: any) {
        console.error('Auth me error:', err);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

app.post("/auth/verify-secret", authMiddleware, async (req: Request, res: Response) => {
    const { secretPassword } = req.body as { secretPassword: string };
    const user = req.user;
    
    if (!secretPassword) {
        return res.status(400).json({ error: 'Secret password is required' });
    }
    
    if (!user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user.id },
            select: { secretPassword: true, role: true }
        });
        
        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isValidSecret = await bcrypt.compare(secretPassword, dbUser.secretPassword);
        if (!isValidSecret) {
            return res.status(401).json({ error: 'Invalid secret password' });
        }
        
        res.json({ success: true, hasAccess: dbUser.role === 'HOST' });
    } catch (err: any) {
        console.error('Verify secret error:', err);
        res.status(500).json({ error: 'Failed to verify secret password' });
    }
});

// Special Admin Authentication
app.post('/auth/special-admin-login', async (req: Request, res: Response) => {
    const { username, password } = req.body as { username: string; password: string };
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const adminUsername = process.env.SPECIAL_ADMIN_USERNAME || 'specialadmin';
    const adminPassword = process.env.SPECIAL_ADMIN_PASSWORD || 'SecureAdmin@2024';
    
    if (username === adminUsername && password === adminPassword) {
        const token = signToken({ 
            id: -1, 
            username: adminUsername, 
            role: 'SPECIAL_ADMIN' 
        });
        
        res.json({ 
            success: true,
            token,
            user: { 
                id: -1, 
                username: adminUsername, 
                role: 'SPECIAL_ADMIN' 
            } 
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/auth/special-admin-verify-secret', async (req: Request, res: Response) => {
    const { secret } = req.body as { secret: string };
    
    if (!secret) {
        return res.status(400).json({ error: 'Secret is required' });
    }
    
    const adminSecret = process.env.SPECIAL_ADMIN_SECRET || 'MySecretKey@2024';
    
    if (secret === adminSecret) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid secret' });
    }
});

app.post('/auth/special-admin-request-otp', async (req: Request, res: Response) => {
    const { email, secret } = req.body as { email: string; secret: string };
    
    if (!email || !secret) {
        return res.status(400).json({ error: 'Email and secret are required' });
    }
    
    const adminSecret = process.env.SPECIAL_ADMIN_SECRET || 'MySecretKey@2024';
    const adminEmail = process.env.SPECIAL_ADMIN_EMAIL || 'deepinfotechunjha@gmail.com';
    
    if (secret !== adminSecret) {
        return res.status(401).json({ error: 'Invalid secret' });
    }
    
    if (email !== adminEmail) {
        return res.status(400).json({ error: 'Email does not match admin email' });
    }
    
    try {
        const otp = generateOTP();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes
        
        otpCache.set(token, {
            email,
            otp,
            expiresAt,
            used: false,
            type: 'special_admin'
        });
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: email,
            subject: 'CallFlow - Special Admin Recovery OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">CallFlow Special Admin Recovery</h2>
                    <p>You have requested to recover your special admin credentials. Please use the following OTP to proceed:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p>This OTP will expire in 2 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 12px;">CallFlow Call Management System</p>
                </div>
            `
        };
        
        await emailTransporter.sendMail(mailOptions);
        
        res.json({ success: true, token, message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Failed to send OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

app.post('/auth/special-admin-verify-otp', async (req: Request, res: Response) => {
    const { email, otp, token } = req.body as { email: string; otp: string; token: string };
    
    if (!email || !otp || !token) {
        return res.status(400).json({ error: 'Email, OTP, and token are required' });
    }
    
    const otpData = otpCache.get(token);
    
    if (!otpData || otpData.type !== 'special_admin') {
        return res.status(400).json({ error: 'Invalid or expired OTP token' });
    }
    
    if (otpData.expiresAt < Date.now()) {
        otpCache.delete(token);
        return res.status(400).json({ error: 'OTP has expired' });
    }
    
    if (otpData.used) {
        return res.status(400).json({ error: 'OTP already used' });
    }
    
    if (otpData.email !== email || otpData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    otpData.verified = true;
    otpCache.set(token, otpData);
    
    res.json({ success: true, message: 'OTP verified successfully' });
});

app.post('/auth/special-admin-update-credentials', async (req: Request, res: Response) => {
    const { email, otp, token, newUsername, newPassword } = req.body as { 
        email: string; 
        otp: string; 
        token: string; 
        newUsername?: string;
        newPassword?: string;
    };
    
    if (!email || !otp || !token) {
        return res.status(400).json({ error: 'Email, OTP, and token are required' });
    }
    
    if (!newUsername && !newPassword) {
        return res.status(400).json({ error: 'At least one of username or password must be provided' });
    }
    
    const otpData = otpCache.get(token);
    
    if (!otpData || otpData.type !== 'special_admin') {
        return res.status(400).json({ error: 'Invalid or expired OTP token' });
    }
    
    if (otpData.expiresAt < Date.now()) {
        otpCache.delete(token);
        return res.status(400).json({ error: 'OTP has expired' });
    }
    
    if (otpData.used) {
        return res.status(400).json({ error: 'OTP already used' });
    }
    
    if (!otpData.verified) {
        return res.status(400).json({ error: 'OTP not verified' });
    }
    
    if (otpData.email !== email || otpData.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // In a real scenario, you would update the .env file or database
    // For now, we'll just mark as successful
    otpCache.delete(token);
    
    res.json({ 
        success: true, 
        message: 'Credentials updated successfully. Please contact system administrator to update environment variables.',
        newUsername: newUsername || process.env.SPECIAL_ADMIN_USERNAME,
        newPassword: newPassword ? '********' : undefined
    });
});

// Forgot Password endpoints
app.post('/auth/forgot-password', authMiddleware, async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    const user = req.user;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        // Check if user exists and email matches logged-in user
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user.id },
            select: { email: true, role: true, username: true }
        });
        
        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('User email in DB:', dbUser.email);
        console.log('Email entered:', email);
        console.log('User role:', dbUser.role);
        
        if (dbUser.email !== email) {
            return res.status(400).json({ error: `Email does not match your account. Your registered email is: ${dbUser.email}` });
        }
        
        if (dbUser.role !== 'HOST') {
            return res.status(403).json({ error: 'Only HOST users can reset secret password' });
        }
        
        // Generate OTP and token
        const otp = generateOTP();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes
        
        // Store in memory cache
        otpCache.set(token, {
            email,
            otp,
            expiresAt,
            used: false
        });
        
        console.log('Generated OTP:', otp);
        
        // Try to send OTP email with timeout handling
        try {
            const emailSent = await Promise.race([
                sendOTPEmail(email, otp),
                new Promise<boolean>((_, reject) => 
                    setTimeout(() => reject(new Error('Email timeout')), 20000)
                )
            ]);
            
            if (!emailSent) {
                throw new Error('Email sending failed');
            }
            
            res.json({ success: true, token, message: 'OTP sent to your email address' });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the request, return success with fallback message
            res.json({ 
                success: true, 
                token, 
                message: `OTP generated: ${otp}. Email delivery failed, please use this OTP directly.`,
                fallback: true,
                otp: otp // Temporary fallback - remove in production
            });
        }
    } catch (err: any) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Failed to process forgot password request' });
    }
});

app.post('/auth/verify-otp', authMiddleware, async (req: Request, res: Response) => {
    const { email, otp, token } = req.body as { email: string; otp: string; token: string };
    const user = req.user;
    
    console.log('OTP Verification - Received:', { email, otp, token: token?.substring(0, 10) + '...' });
    
    if (!email || !otp || !token) {
        return res.status(400).json({ error: 'Email, OTP, and token are required' });
    }
    
    if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        // Verify user email matches
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user.id },
            select: { email: true }
        });
        
        console.log('User DB email:', dbUser?.email, 'Provided email:', email);
        
        if (!dbUser || dbUser.email !== email) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        
        // Check cache for OTP
        const otpData = otpCache.get(token);
        
        console.log('OTP Data found:', !!otpData);
        if (otpData) {
            console.log('Stored OTP:', otpData.otp, 'Provided OTP:', otp);
            console.log('Expires at:', new Date(otpData.expiresAt), 'Current time:', new Date());
        }
        
        if (!otpData) {
            return res.status(400).json({ error: 'Invalid or expired OTP token' });
        }
        
        if (otpData.expiresAt < Date.now()) {
            otpCache.delete(token);
            return res.status(400).json({ error: 'OTP has expired' });
        }
        
        if (otpData.used) {
            return res.status(400).json({ error: 'OTP already used' });
        }
        
        if (otpData.email !== email || otpData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP code' });
        }
        
        // Mark OTP as verified (not used yet) after successful verification
        otpData.verified = true;
        otpCache.set(token, otpData);
        
        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err: any) {
        console.error('OTP verification error:', err);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

app.post('/auth/reset-password', authMiddleware, async (req: Request, res: Response) => {
    const { email, otp, token, newPassword } = req.body as { 
        email: string; 
        otp: string; 
        token: string; 
        newPassword: string; 
    };
    const user = req.user;
    
    if (!email || !otp || !token || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Secret password must be at least 6 characters long' });
    }
    
    if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        // Verify user email matches
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user.id },
            select: { email: true, role: true }
        });
        
        if (!dbUser || dbUser.email !== email) {
            return res.status(400).json({ error: 'Invalid email' });
        }
        
        if (dbUser.role !== 'HOST') {
            return res.status(403).json({ error: 'Only HOST users can reset secret password' });
        }
        
        // Verify OTP from cache
        const otpData = otpCache.get(token);
        
        if (!otpData) {
            return res.status(400).json({ error: 'Invalid or expired OTP token' });
        }
        
        if (otpData.expiresAt < Date.now()) {
            otpCache.delete(token);
            return res.status(400).json({ error: 'OTP has expired' });
        }
        
        if (otpData.used) {
            return res.status(400).json({ error: 'OTP already used' });
        }
        
        if (!otpData.verified) {
            return res.status(400).json({ error: 'OTP not verified. Please verify OTP first.' });
        }
        
        if (otpData.email !== email || otpData.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }
        
        // Update user secret password
        await prisma.user.update({
            where: { id: user.id },
            data: { secretPassword: await bcrypt.hash(newPassword, 10) }
        });
        
        // Mark OTP as used and delete from cache
        otpCache.delete(token);
        
        res.json({ success: true, message: 'Secret password reset successfully' });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to reset secret password' });
    }
});

// User endpoints - display purpose anywhere 
app.get("/users", authMiddleware, requireRole(['HOST', 'ADMIN', 'SPECIAL_ADMIN']), async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({ 
            select: { id: true, username: true, email: true, phone: true, role: true, createdAt: true } 
        });
        res.json(users);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// to create user
app.post("/users", authMiddleware, requireRole(['HOST', 'SPECIAL_ADMIN']), async (req: Request, res: Response) => {
    const { username, password, email, phone, role, secretPassword } = req.body as { username: string; password: string; email: string; phone: string; role: string; secretPassword?: string };
    
    if (!username || !password || !email || !phone || !role) {
        return res.status(400).json({ error: "username, password, email, phone, and role are required" });
    }
    
    if (!['HOST', 'ADMIN', 'ENGINEER'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be HOST, ADMIN, or ENGINEER" });
    }
    
    try {
        const hashed = await bcrypt.hash(password, 10);
        const hashedSecretPassword = await bcrypt.hash(secretPassword || 'DEFAULTSECRET', 10);
        
        const user = await prisma.user.create({ 
            data: { username, password: hashed, email, phone, role, secretPassword: hashedSecretPassword } 
        });
        
        const userResponse = { 
            id: user.id, 
            username: user.username, 
            email: user.email,
            phone: user.phone,
            role: user.role, 
            createdAt: user.createdAt 
        };
        
        emitToAll('user_created', userResponse);    //(eventname , Response)
        res.status(201).json(userResponse);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Username, email, or phone already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.put("/users/:id", authMiddleware, requireRole(['HOST', 'SPECIAL_ADMIN']), async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id || '');
    const { username, password, email, phone, role, secretPassword } = req.body as {
        username?: string;
        password?: string;
        email?: string;
        phone?: string;
        role?: string;
        secretPassword?: string;
    };
    
    try {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const updateData: any = {};
        
        if (username && username !== currentUser.username) {
            updateData.username = username;
        }
        
        if (email && email !== currentUser.email) {
            updateData.email = email;
        }
        
        if (phone && phone !== currentUser.phone) {
            updateData.phone = phone;
        }
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        if (role && ['HOST', 'ADMIN', 'ENGINEER'].includes(role)) {
            updateData.role = role;
            
            if (role === 'HOST' && currentUser.role !== 'HOST') {
                updateData.secretPassword = await bcrypt.hash(secretPassword || 'DEFAULTSECRET', 10);
            } else if (role !== 'HOST' && currentUser.role === 'HOST') {
                updateData.secretPassword = await bcrypt.hash('DEFAULTSECRET', 10);
            }
        }
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, username: true, email: true, phone: true, role: true, createdAt: true }
        });
        
        // Force logout the updated user via WebSocket
        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(socketId).emit('force_logout', { message: 'Your account has been updated. Please log in again.' });
        }
        
        emitToAll('user_updated', user);
        res.json(user);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Username, email, or phone already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.delete("/users/:id", authMiddleware, requireRole(['HOST', 'SPECIAL_ADMIN']), async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id || '');
    
    try {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Unassign all calls assigned to this user
        const callsToUnassign = await prisma.call.findMany({
            where: { assignedTo: currentUser.username }
        });
        
        await prisma.call.updateMany({
            where: { assignedTo: currentUser.username },
            data: { 
                assignedTo: null, 
                status: 'PENDING',
                assignedAt: null,
                assignedBy: null,
                engineerRemark: null
            }
        });
        
        // Emit individual call updates for each unassigned call
        for (const call of callsToUnassign) {
            const updatedCall = {
                ...call,
                assignedTo: null,
                status: 'PENDING',
                assignedAt: null,
                assignedBy: null,
                engineerRemark: null
            };
            emitToAll('call_updated', updatedCall);
        }
        
        // Force logout the user before deletion via WebSocket
        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(socketId).emit('force_logout', { message: 'Your account has been removed by an administrator.' });
        }
        
        await prisma.user.delete({ where: { id: userId } });
        emitToAll('user_deleted_broadcast', { id: userId, username: currentUser.username });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Call endpoints
app.get('/calls', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userRole = req.user?.role;
        const username = req.user?.username;
        
        let whereClause = {};
        if (userRole === 'ENGINEER') {
            whereClause = {
                OR: [
                    { createdBy: username },
                    { assignedTo: username }
                ]
            };
        }
        
        const findArgs: any = {};
        if (Object.keys(whereClause).length > 0) findArgs.where = whereClause;
        const calls = await prisma.call.findMany(findArgs);
        res.json(calls);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch calls', details: String(err) });
    }
});

// create call 
app.post('/calls', authMiddleware, async (req: Request, res: Response) => {
    const { customerName, phone, email, address, problem, category, assignedTo, engineerRemark, createdBy } = req.body as {
        customerName: string;
        phone: string;
        email?: string;
        address: string;
        problem: string;
        category: string;
        assignedTo?: string;
        engineerRemark?: string;
        createdBy?: string;
    };

    if (!customerName || !phone || !address || !problem || !category) {
        return res.status(400).json({ error: 'Customer name, phone, address, problem, and category are required' });
    }

    try {
        let customer = null;
        if (phone) {
            customer = await prisma.customer.findUnique({ where: { phone } });
            
            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        name: customerName,
                        phone,
                        email: email || null,
                        address: address || null,
                        outsideCalls: 0,
                        carryInServices: 0,
                        totalInteractions: 0
                    }
                });
            }
        }

        const [call] = await prisma.$transaction([
            prisma.call.create({
                data: {
                    customerName,
                    phone,
                    email: email || null,
                    address: address,
                    problem,
                    category,
                    status: assignedTo ? 'ASSIGNED' : 'PENDING',
                    assignedTo: assignedTo || null,
                    assignedAt: assignedTo ? new Date() : null,
                    assignedBy: assignedTo ? (req.user?.username || 'system') : null,
                    engineerRemark: engineerRemark || null,
                    createdBy: req.user?.username || createdBy || 'system',
                    customerId: customer?.id || null,
                }
            }),
            customer ? prisma.customer.update({
                where: { id: customer.id },
                data: {
                    outsideCalls: { increment: 1 },
                    totalInteractions: { increment: 1 },
                    lastCallDate: new Date(),
                    lastActivityDate: new Date()
                }
            }) : prisma.$queryRaw`SELECT 1`
        ]);
        
        emitToAll('call_created', call);
        res.status(201).json(call);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to create call' });
    }
});


app.put('/calls/:id', authMiddleware, requireRole(['HOST', 'ADMIN']), async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    if (isNaN(callId)) {
        return res.status(400).json({ error: 'Invalid call ID' });
    }

    try {
        const existingCall = await prisma.call.findUnique({ where: { id: callId } });
        if (!existingCall) {
            return res.status(404).json({ error: 'Call not found' });
        }
        if (existingCall.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot edit completed calls' });
        }

        const { problem, category, status, assignedTo, customerName, phone, email, address } = req.body as {
            problem: string;
            category: string;
            status?: string;
            assignedTo?: string;
            customerName: string;
            phone: string;
            email?: string;
            address?: string;
        };

        const updateData: any = {
            customerName,
            phone,
            email: email || null,
            address: address || null,
            problem,
            category,
            status: assignedTo !== undefined && assignedTo ? 'ASSIGNED' : (assignedTo === null || assignedTo === '' ? 'PENDING' : status),
        };
        
        if (assignedTo !== undefined) {
            updateData.assignedTo = assignedTo || null;
        }

        const call = await prisma.call.update({
            where: { id: callId },
            data: updateData
        });
        
        emitToAll('call_updated', call);
        res.json(call);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update call' });
    }
});

app.post('/calls/:id/assign', authMiddleware, requireRole(['HOST', 'ADMIN']), async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    const { assignee, engineerRemark } = req.body as { assignee: string; engineerRemark?: string };
    
    if (!assignee) {
        return res.status(400).json({ error: 'Assignee is required' });
    }
    
    try {
        const existingCall = await prisma.call.findUnique({ where: { id: callId } });
        
        if (!existingCall) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        if (existingCall.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot assign a completed call' });
        }

        const updateData = {
            assignedTo: assignee,
            assignedAt: new Date(),
            assignedBy: req.user?.username || 'system',
            status: 'ASSIGNED',
            engineerRemark: engineerRemark || null
        };

        const call = await prisma.call.update({
            where: { id: callId },
            data: updateData,
            include: { customer: true }
        });
        
        emitToAll('call_assigned', call);
        res.json(call);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to assign call' });
    }
});

app.post('/calls/:id/complete', authMiddleware, async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    const { remark, engineerRemark } = req.body as { remark?: string; engineerRemark?: string };
    const user = req.user;
    
    try {
        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        const canComplete = call.assignedTo === user?.username || ['HOST', 'ADMIN'].includes(user?.role || '');
        if (!canComplete) {
            return res.status(403).json({ error: 'Cannot complete this call' });
        }
        
        const updatedCall = await prisma.call.update({
            where: { id: callId },
            data: {
                status: 'COMPLETED',
                completedBy: user?.username || 'system',
                completedAt: new Date(),
                remark: remark || null,
                engineerRemark: engineerRemark !== undefined ? engineerRemark : call.engineerRemark
            },
            include: { customer: true }
        });
        
        emitToAll('call_completed', updatedCall);
        res.json(updatedCall);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to complete call' });
    }
});

// Check for duplicate calls
app.post('/calls/check-duplicate', authMiddleware, async (req: Request, res: Response) => {
    const { phone, category } = req.body as { phone: string; category: string };
    
    if (!phone || !category) {
        return res.status(400).json({ error: 'Phone and category are required' });
    }
    
    try {
        const existingCall = await prisma.call.findFirst({
            where: {
                phone,
                category,
                status: { in: ['PENDING', 'ASSIGNED'] }
            },
            select: {
                id: true,
                customerName: true,
                phone: true,
                category: true,
                problem: true,
                status: true,
                assignedTo: true,
                createdAt: true,
                createdBy: true,
                callCount: true
            }
        });
        
        res.json({ duplicate: !!existingCall, existingCall });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Update existing call (increment call count)
app.put('/calls/:id/increment', authMiddleware, async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    const user = req.user;
    
    try {
        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        const updatedCall = await prisma.call.update({
            where: { id: callId },
            data: {
                callCount: call.callCount + 1,
                lastCalledAt: new Date()
            }
        });
        
        emitToAll('call_updated', updatedCall);
        
        // Create notifications only if the call is assigned or has a creator
        try {
            const notificationUsers = new Set();
            
            // Notify original creator if different from current user
            if (call.createdBy && call.createdBy !== user?.username) {
                notificationUsers.add(call.createdBy);
            }
            
            // Notify assigned engineer if different from current user and call is assigned
            if (call.assignedTo && call.assignedTo !== user?.username) {
                notificationUsers.add(call.assignedTo);
            }
            
            // Notify all HOSTs and ADMINs
            const admins = await prisma.user.findMany({
                where: { role: { in: ['HOST', 'ADMIN'] } },
                select: { username: true }
            });
            
            admins.forEach(admin => {
                if (admin.username !== user?.username) {
                    notificationUsers.add(admin.username);
                }
            });
            
            // Create notifications for unique users
            if (notificationUsers.size > 0) {
                const notifications = Array.from(notificationUsers).map(userId => ({
                    userId: userId as string,
                    message: `${call.customerName} (${call.phone}) - Repeat call (${call.category})`,
                    type: 'DUPLICATE_CALL',
                    callId: call.id
                }));
                
                await prisma.notification.createMany({ data: notifications });
                
                // Emit notification events
                notifications.forEach(notification => {
                    emitToAll('notification_created', notification);
                });
            }
        } catch (notificationError) {
            console.error('Failed to create notifications:', notificationError);
        }
        
        res.json(updatedCall);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Customers endpoints
app.get('/customers', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(customers);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/customers/phone/:phone', authMiddleware, async (req: Request, res: Response) => {
    const phone = req.params.phone;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    try {
        const customer = await prisma.customer.findUnique({ where: { phone: phone as string } });
        if (!customer) return res.status(404).json({ error: 'Not found' });
        res.json(customer);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/carry-in-customers/phone/:phone', authMiddleware, async (req: Request, res: Response) => {
    const phone = req.params.phone;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    try {
        const customer = await prisma.customer.findUnique({ where: { phone: phone as string } });
        if (!customer) return res.status(404).json({ error: 'Not found' });
        res.json(customer);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/customers/analytics', authMiddleware, requireRole(['HOST']), async (_req: Request, res: Response) => {
    try {
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
                outsideCalls: true,
                carryInServices: true,
                totalInteractions: true,
                lastCallDate: true,
                lastServiceDate: true,
                lastActivityDate: true,
                createdAt: true
            },
            orderBy: { lastActivityDate: 'desc' }
        });
        res.json(customers);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/customers/directory', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
                outsideCalls: true,
                carryInServices: true,
                totalInteractions: true,
                lastActivityDate: true,
                createdAt: true
            },
            orderBy: { lastActivityDate: 'desc' }
        });
        res.json(customers);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.put('/customers/:id', authMiddleware, requireRole(['HOST', 'ADMIN']), async (req: Request, res: Response) => {
    const customerId = parseInt(req.params.id || '');
    const { name, phone, email, address } = req.body as {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
    };
    
    if (isNaN(customerId)) {
        return res.status(400).json({ error: 'Invalid customer ID' });
    }
    
    try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email || null;
        if (address !== undefined) updateData.address = address || null;
        
        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: updateData
        });
        
        emitToAll('customer_updated', customer);
        res.json(customer);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Phone number already exists' });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(500).json({ error: String(err) });
    }
});

// Analytics endpoints
app.get('/analytics/engineers', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const days = req.query.days as string;
    
    try {
        let dateFilter = {};
        if (days && days !== 'all') {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));
            dateFilter = { createdAt: { gte: daysAgo } };
        }
        
        const users = await prisma.user.findMany({
            where: { role: { in: ['ENGINEER', 'ADMIN'] } },
            select: { username: true }
        });
        
        const analytics = await Promise.all(users.map(async (user) => {
            const totalAssigned = await prisma.call.count({
                where: { 
                    assignedTo: user.username,
                    ...dateFilter
                }
            });
            
            const completed = await prisma.call.count({
                where: { 
                    assignedTo: user.username,
                    status: 'COMPLETED',
                    ...dateFilter
                }
            });
            
            const pending = totalAssigned - completed;
            const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
            
            const completedCalls = await prisma.call.findMany({
                where: {
                    assignedTo: user.username,
                    status: 'COMPLETED',
                    assignedAt: { not: null },
                    completedAt: { not: null },
                    ...dateFilter
                },
                select: { assignedAt: true, completedAt: true }
            });
            
            let avgResolutionTime = 0;
            if (completedCalls.length > 0) {
                const totalTime = completedCalls.reduce((sum, call) => {
                    if (call.assignedAt && call.completedAt) {
                        return sum + (new Date(call.completedAt).getTime() - new Date(call.assignedAt).getTime());
                    }
                    return sum;
                }, 0);
                avgResolutionTime = totalTime / completedCalls.length / (1000 * 60 * 60); // Convert to hours
            }
            
            return {
                name: user.username,
                totalAssigned,
                completed,
                pending,
                completionRate,
                avgResolutionTime
            };
        }));
        
        res.json(analytics);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Deletion History endpoint
app.get('/analytics/deletion-history', authMiddleware, requireRole(['HOST']), async (_req: Request, res: Response) => {
    try {
        const history = await prisma.deletionHistory.findMany({
            orderBy: { deletedAt: 'desc' },
            take: 30
        });
        res.json(history);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Service Deletion History endpoint
app.get('/analytics/service-deletion-history', authMiddleware, requireRole(['HOST']), async (_req: Request, res: Response) => {
    try {
        const history = await prisma.serviceDeletionHistory.findMany({
            orderBy: { deletedAt: 'desc' },
            take: 30
        });
        res.json(history);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Bulk Delete Calls endpoint
app.post('/calls/bulk-delete', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const { callIds, secretPassword } = req.body as { callIds: number[]; secretPassword: string };
    const user = req.user;
    
    if (!callIds || !Array.isArray(callIds) || callIds.length === 0) {
        return res.status(400).json({ error: 'Call IDs are required' });
    }
    
    if (!secretPassword) {
        return res.status(400).json({ error: 'Secret password is required' });
    }
    
    try {
        // Verify secret password
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user!.id },
            select: { secretPassword: true, username: true, email: true }
        });
        
        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isValidSecret = await bcrypt.compare(secretPassword, dbUser.secretPassword);
        if (!isValidSecret) {
            return res.status(401).json({ error: 'Invalid secret password' });
        }
        
        // Fetch calls to delete (only COMPLETED)
        const callsToDelete = await prisma.call.findMany({
            where: { 
                id: { in: callIds },
                status: 'COMPLETED'
            }
        });
        
        if (callsToDelete.length === 0) {
            return res.status(400).json({ error: 'No completed calls found to delete' });
        }
        
        // Delete calls and create history record in transaction
        await prisma.$transaction([
            prisma.call.deleteMany({
                where: { id: { in: callsToDelete.map(c => c.id) } }
            }),
            prisma.deletionHistory.create({
                data: {
                    deletedBy: user!.id,
                    deletedByName: user!.username,
                    callCount: callsToDelete.length
                }
            })
        ]);
        
        // Auto-cleanup: Keep only latest 30 entries
        const totalHistoryCount = await prisma.deletionHistory.count();
        if (totalHistoryCount > 30) {
            const excessCount = totalHistoryCount - 30;
            const oldestEntries = await prisma.deletionHistory.findMany({
                orderBy: { deletedAt: 'asc' },
                take: excessCount,
                select: { id: true }
            });
            
            await prisma.deletionHistory.deleteMany({
                where: { id: { in: oldestEntries.map(e => e.id) } }
            });
            
            console.log(`Cleaned up ${excessCount} old deletion history entries`);
        }
        
        // Get all other HOSTs
        const otherHosts = await prisma.user.findMany({
            where: { 
                role: 'HOST',
                id: { not: user!.id }
            },
            select: { username: true, email: true }
        });
        
        // Create notifications and send emails to other HOSTs
        if (otherHosts.length > 0) {
            await prisma.notification.createMany({
                data: otherHosts.map(host => ({
                    userId: host.username,
                    message: `${user!.username} deleted ${callsToDelete.length} completed calls`,
                    type: 'BULK_DELETION',
                    isRead: false
                }))
            });
            
            // Send Socket.io notification
            emitToAll('calls_bulk_deleted', {
                deletedBy: user!.username,
                deletedAt: new Date(),
                count: callsToDelete.length,
                callIds: callsToDelete.map(c => c.id)
            });
            
            // Send emails
            const hostEmails = otherHosts.map(h => h.email);
            await sendDeletionNotificationEmail(
                hostEmails, 
                user!.username, 
                new Date(), 
                callsToDelete.length
            );
        }
        
        res.json({ 
            success: true, 
            deletedCount: callsToDelete.length,
            callsData: callsToDelete
        });
    } catch (err: any) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ error: 'Failed to delete calls' });
    }
});

// Notifications endpoints
app.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.username },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (err: any) {
        console.error('Failed to fetch notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.get('/notifications/unread-count', authMiddleware, async (req: Request, res: Response) => {
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        const count = await prisma.notification.count({
            where: { 
                userId: req.user.username,
                isRead: false
            }
        });
        res.json({ count });
    } catch (err: any) {
        console.error('Failed to fetch unread count:', err);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

app.put('/notifications/:id/read', authMiddleware, async (req: Request, res: Response) => {
    const notificationId = parseInt(req.params.id || '');
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
    }
    
    try {
        await prisma.notification.update({
            where: { 
                id: notificationId,
                userId: req.user.username
            },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (err: any) {
        console.error('Failed to mark notification as read:', err);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

app.delete('/notifications/:id', authMiddleware, async (req: Request, res: Response) => {
    const notificationId = parseInt(req.params.id || '');
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
    }
    
    try {
        await prisma.notification.delete({
            where: { 
                id: notificationId,
                userId: req.user.username
            }
        });
        res.json({ success: true });
    } catch (err: any) {
        console.error('Failed to delete notification:', err);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// Bulk delete notifications (POST)
app.post('/notifications/bulk-delete', authMiddleware, async (req: Request, res: Response) => {
    const { notificationIds } = req.body as { notificationIds: number[] };
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty notification IDs array' });
    }
    
    if (notificationIds.length > 100) {
        return res.status(400).json({ error: 'Cannot delete more than 100 notifications at once' });
    }
    
    try {
        const result = await prisma.notification.deleteMany({
            where: { 
                id: { in: notificationIds },
                userId: req.user.username
            }
        });
        res.json({ success: true, deletedCount: result.count });
    } catch (err: any) {
        console.error('Bulk delete error:', err);
        res.status(500).json({ error: 'Failed to delete notifications' });
    }
});

// Categories endpoints
app.get('/categories', async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/categories/protected', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/categories', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const { name } = req.body as { name: string };
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    try {
        // Check if a category with this name already exists (including inactive ones)
        const existingCategory = await prisma.category.findUnique({
            where: { name: name.trim() }
        });
        
        if (existingCategory) {
            if (existingCategory.isActive) {
                return res.status(400).json({ error: 'Category already exists' });
            } else {
                // Reactivate the existing category
                const category = await prisma.category.update({
                    where: { id: existingCategory.id },
                    data: { isActive: true }
                });
                emitToAll('category_created', category);
                return res.status(201).json(category);
            }
        }
        
        // Create new category if none exists
        const category = await prisma.category.create({
            data: { name: name.trim() }
        });
        
        emitToAll('category_created', category);
        res.status(201).json(category);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.put('/categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    const { name } = req.body as { name: string };
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    try {
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { name: name.trim() }
        });
        
        emitToAll('category_updated', category);
        res.json(category);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Category already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.delete('/categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    
    // CSRF protection: require X-Requested-With header
    if (!req.headers['x-requested-with']) {
        return res.status(403).json({ error: 'CSRF protection: X-Requested-With header required' });
    }
    
    try {
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { isActive: false }
        });
        
        emitToAll('category_deleted', { id: categoryId });
        res.json({ success: true, category });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Service Categories endpoints
app.get('/service-categories', async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/service-categories/protected', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/service-categories', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const { name } = req.body as { name: string };
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Service category name is required' });
    }
    
    try {
        const category = await prisma.serviceCategory.create({
            data: { name: name.trim() }
        });
        
        emitToAll('service_category_created', category);
        res.status(201).json(category);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Service category already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.put('/service-categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    const { name } = req.body as { name: string };
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Service category name is required' });
    }
    
    try {
        const category = await prisma.serviceCategory.update({
            where: { id: categoryId },
            data: { name: name.trim() }
        });
        
        emitToAll('service_category_updated', category);
        res.json(category);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Service category already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.delete('/service-categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    
    try {
        const category = await prisma.serviceCategory.update({
            where: { id: categoryId },
            data: { isActive: false }
        });
        
        emitToAll('service_category_deleted', { id: categoryId });
        res.json({ success: true, category });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// CarryInService endpoints
app.get('/carry-in-services', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const services = await prisma.carryInService.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(services);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/carry-in-services', authMiddleware, async (req: Request, res: Response) => {
    const { customerName, phone, email, address, category, serviceDescription } = req.body as {
        customerName: string;
        phone: string;
        email?: string;
        address: string;
        category: string;
        serviceDescription?: string;
    };
    
    if (!customerName || !phone || !address || !category) {
        return res.status(400).json({ error: 'Customer name, phone, address, and category are required' });
    }
    
    try {
        let customer = await prisma.customer.findUnique({ where: { phone } });
        if (!customer) {
            customer = await prisma.customer.create({
                data: { 
                    name: customerName, 
                    phone, 
                    email: email || null, 
                    address: address || null,
                    outsideCalls: 0,
                    carryInServices: 0,
                    totalInteractions: 0
                }
            });
        }
        
        const [service] = await prisma.$transaction([
            prisma.carryInService.create({
                data: {
                    customerName,
                    phone,
                    email: email || null,
                    address: address,
                    category,
                    serviceDescription: serviceDescription || null,
                    customerId: customer.id,
                    createdBy: req.user?.username || 'system'
                }
            }),
            prisma.customer.update({
                where: { id: customer.id },
                data: {
                    carryInServices: { increment: 1 },
                    totalInteractions: { increment: 1 },
                    lastServiceDate: new Date(),
                    lastActivityDate: new Date()
                }
            })
        ]);
        
        emitToAll('service_created', service);
        res.status(201).json(service);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.put('/carry-in-services/:id', authMiddleware, requireRole(['HOST', 'ADMIN']), async (req: Request, res: Response) => {
    const serviceId = parseInt(req.params.id || '');
    if (isNaN(serviceId)) {
        return res.status(400).json({ error: 'Invalid service ID' });
    }

    try {
        const existingService = await prisma.carryInService.findUnique({ where: { id: serviceId } });
        if (!existingService) {
            return res.status(404).json({ error: 'Service not found' });
        }
        if (existingService.status !== 'PENDING') {
            return res.status(400).json({ error: 'Cannot edit completed services' });
        }

        const { customerName, phone, email, address, category, serviceDescription } = req.body as {
            customerName: string;
            phone: string;
            email?: string;
            address?: string;
            category: string;
            serviceDescription?: string;
        };

        if (!customerName || !phone || !address || !category) {
            return res.status(400).json({ error: 'Customer name, phone, address, and category are required' });
        }

        const service = await prisma.carryInService.update({
            where: { id: serviceId },
            data: {
                customerName,
                phone,
                email: email || null,
                address: address || null,
                category,
                serviceDescription: serviceDescription || null
            }
        });
        
        emitToAll('service_updated', service);
        res.json(service);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update service' });
    }
});

app.post('/carry-in-services/:id/complete', authMiddleware, async (req: Request, res: Response) => {
    const serviceId = parseInt(req.params.id || '');
    const { completeRemark } = req.body as { completeRemark?: string };
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        // Check if service exists and is in PENDING status
        const existingService = await prisma.carryInService.findUnique({ where: { id: serviceId } });
        if (!existingService) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        if (existingService.status !== 'PENDING') {
            return res.status(400).json({ error: 'Service must be in PENDING status to complete' });
        }
        
        const service = await prisma.carryInService.update({
            where: { id: serviceId },
            data: {
                status: 'COMPLETED_NOT_COLLECTED',
                completedBy: req.user.username,
                completedAt: new Date(),
                completeRemark: completeRemark || null
            }
        });
        
        emitToAll('service_updated', service);
        res.json(service);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/carry-in-services/:id/deliver', authMiddleware, async (req: Request, res: Response) => {
    const serviceId = parseInt(req.params.id || '');
    const { deliverRemark } = req.body as { deliverRemark?: string };
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        // Check if service exists and is in COMPLETED_NOT_COLLECTED status
        const existingService = await prisma.carryInService.findUnique({ where: { id: serviceId } });
        if (!existingService) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        if (existingService.status !== 'COMPLETED_NOT_COLLECTED') {
            return res.status(400).json({ error: 'Service must be completed before delivery' });
        }
        
        const service = await prisma.carryInService.update({
            where: { id: serviceId },
            data: {
                status: 'COMPLETED_AND_COLLECTED',
                deliveredBy: req.user.username,
                deliveredAt: new Date(),
                deliverRemark: deliverRemark || null
            }
        });
        
        emitToAll('service_updated', service);
        res.json(service);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Bulk Delete Carry-In Services endpoint
app.post('/carry-in-services/bulk-delete', authMiddleware, async (req: Request, res: Response) => {
    const { serviceIds, secretPassword } = req.body as { serviceIds: number[]; secretPassword: string };
    const user = req.user;
    
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({ error: 'Service IDs are required' });
    }
    
    if (!secretPassword) {
        return res.status(400).json({ error: 'Secret password is required' });
    }
    
    // Check if user is HOST
    if (user?.role !== 'HOST') {
        return res.status(403).json({ error: 'Only HOST users can delete services' });
    }
    
    try {
        // Verify secret password
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user!.id },
            select: { secretPassword: true, username: true, email: true }
        });
        
        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isValidSecret = await bcrypt.compare(secretPassword, dbUser.secretPassword);
        if (!isValidSecret) {
            return res.status(401).json({ error: 'Invalid secret password' });
        }
        
        // Fetch services to delete (only COMPLETED_AND_COLLECTED)
        const servicesToDelete = await prisma.carryInService.findMany({
            where: { 
                id: { in: serviceIds },
                status: 'COMPLETED_AND_COLLECTED'
            }
        });
        
        if (servicesToDelete.length === 0) {
            return res.status(400).json({ error: 'No delivered services found to delete' });
        }
        
        // Delete services and create history record in transaction
        await prisma.$transaction([
            prisma.carryInService.deleteMany({
                where: { id: { in: servicesToDelete.map(s => s.id) } }
            }),
            prisma.serviceDeletionHistory.create({
                data: {
                    deletedBy: user!.id,
                    deletedByName: user!.username,
                    serviceCount: servicesToDelete.length
                }
            })
        ]);
        
        // Auto-cleanup: Keep only latest 30 entries
        const totalHistoryCount = await prisma.serviceDeletionHistory.count();
        if (totalHistoryCount > 30) {
            const excessCount = totalHistoryCount - 30;
            const oldestEntries = await prisma.serviceDeletionHistory.findMany({
                orderBy: { deletedAt: 'asc' },
                take: excessCount,
                select: { id: true }
            });
            
            await prisma.serviceDeletionHistory.deleteMany({
                where: { id: { in: oldestEntries.map(e => e.id) } }
            });
        }
        
        // Get all other HOSTs
        const otherHosts = await prisma.user.findMany({
            where: { 
                role: 'HOST',
                id: { not: user!.id }
            },
            select: { username: true, email: true }
        });
        
        // Create notifications and send emails to other HOSTs
        if (otherHosts.length > 0) {
            await prisma.notification.createMany({
                data: otherHosts.map(host => ({
                    userId: host.username,
                    message: `${user!.username} deleted ${servicesToDelete.length} delivered services`,
                    type: 'SERVICE_BULK_DELETION',
                    isRead: false
                }))
            });
            
            // Send Socket.io notification
            emitToAll('services_bulk_deleted', {
                deletedBy: user!.username,
                deletedAt: new Date(),
                count: servicesToDelete.length,
                serviceIds: servicesToDelete.map(s => s.id)
            });
            
            // Send emails
            const hostEmails = otherHosts.map(h => h.email);
            await sendServiceDeletionNotificationEmail(
                hostEmails, 
                user!.username, 
                new Date(), 
                servicesToDelete.length
            );
        }
        
        res.json({ 
            success: true, 
            deletedCount: servicesToDelete.length,
            servicesData: servicesToDelete
        });
    } catch (err: any) {
        console.error('Service bulk delete error:', err);
        res.status(500).json({ error: 'Failed to delete services' });
    }
});

// Share link endpoints
app.post('/share/create-link', authMiddleware, async (req: Request, res: Response) => {
    try {
        // Create JWT token with 24 hour expiry and unique ID
        const token = jwt.sign(
            { 
                type: 'share-link',
                id: crypto.randomUUID(), // Unique ID ensures no duplicates
                createdAt: Date.now(),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            }, 
            JWT_SECRET
        );
        
        const shareUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/share/${token}`;
        
        res.json({ 
            success: true, 
            shareUrl,
            linkId: token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
    } catch (err: any) {
        console.error('Create share link error:', err);
        res.status(500).json({ error: 'Failed to create share link' });
    }
});

app.get('/share/:linkId', async (req: Request, res: Response) => {
    const { linkId } = req.params;
    
    if (!linkId) {
        return res.status(400).json({ error: 'Link ID is required' });
    }
    
    try {
        // Check if token was already used
        if (usedShareTokens.has(linkId)) {
            return res.status(404).json({ error: 'Share link has already been used' });
        }
        
        // Verify JWT token
        const decoded = jwt.verify(linkId, JWT_SECRET) as any;
        
        if (decoded.type !== 'share-link') {
            return res.status(404).json({ error: 'Invalid share link' });
        }
        
        res.json({ 
            success: true, 
            valid: true,
            createdAt: new Date(decoded.createdAt).toISOString(),
            expiresAt: new Date(decoded.exp * 1000).toISOString()
        });
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(404).json({ error: 'Share link has expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(404).json({ error: 'Invalid share link' });
        }
        console.error('Validate share link error:', err);
        res.status(500).json({ error: 'Failed to validate share link' });
    }
});

app.post('/share/:linkId/submit', async (req: Request, res: Response) => {
    const { linkId } = req.params;
    const { customerName, phone, email, address, problem, category } = req.body as {
        customerName: string;
        phone: string;
        email?: string;
        address: string;
        problem: string;
        category: string;
    };
    
    if (!linkId) {
        return res.status(400).json({ error: 'Link ID is required' });
    }
    
    if (!customerName || !phone || !address || !problem || !category) {
        return res.status(400).json({ error: 'Customer name, phone, address, problem, and category are required' });
    }
    
    try {
        // Check if token was already used
        if (usedShareTokens.has(linkId)) {
            return res.status(404).json({ error: 'Share link has already been used' });
        }
        
        // Verify JWT token
        const decoded = jwt.verify(linkId, JWT_SECRET) as any;
        
        if (decoded.type !== 'share-link') {
            return res.status(404).json({ error: 'Invalid share link' });
        }
        
        // Mark token as used
        usedShareTokens.add(linkId);
        
        // Create customer if doesn't exist
        let customer = null;
        if (phone) {
            customer = await prisma.customer.findUnique({ where: { phone } });
            
            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        name: customerName,
                        phone,
                        email: email || null,
                        address: address || null,
                        outsideCalls: 0,
                        carryInServices: 0,
                        totalInteractions: 0
                    }
                });
            }
        }
        
        // Create the call
        const [call] = await prisma.$transaction([
            prisma.call.create({
                data: {
                    customerName,
                    phone,
                    email: email || null,
                    address: address,
                    problem,
                    category,
                    status: 'PENDING',
                    createdBy: 'Share Link',
                    customerId: customer?.id || null,
                }
            }),
            customer ? prisma.customer.update({
                where: { id: customer.id },
                data: {
                    outsideCalls: { increment: 1 },
                    totalInteractions: { increment: 1 },
                    lastCallDate: new Date(),
                    lastActivityDate: new Date()
                }
            }) : prisma.$queryRaw`SELECT 1`
        ]);
        
        // Emit real-time update
        emitToAll('call_created', call);
        
        res.status(201).json({ 
            success: true, 
            call,
            message: 'Call submitted successfully' 
        });
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(404).json({ error: 'Share link has expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(404).json({ error: 'Invalid share link' });
        }
        console.error('Submit share link call error:', err);
        res.status(500).json({ error: 'Failed to submit call' });
    }
});

app.post('/share/:linkId/submit-service', async (req: Request, res: Response) => {
    const { linkId } = req.params;
    const { customerName, phone, email, address, category, serviceDescription } = req.body as {
        customerName: string;
        phone: string;
        email?: string;
        address: string;
        category: string;
        serviceDescription?: string;
    };
    
    if (!linkId) {
        return res.status(400).json({ error: 'Link ID is required' });
    }
    
    if (!customerName || !phone || !address || !category) {
        return res.status(400).json({ error: 'Customer name, phone, address, and category are required' });
    }
    
    try {
        // Check if token was already used
        if (usedShareTokens.has(linkId)) {
            return res.status(404).json({ error: 'Share link has already been used' });
        }
        
        // Verify JWT token
        const decoded = jwt.verify(linkId, JWT_SECRET) as any;
        
        if (decoded.type !== 'share-link') {
            return res.status(404).json({ error: 'Invalid share link' });
        }
        
        // Mark token as used
        usedShareTokens.add(linkId);
        
        // Create customer if doesn't exist
        let customer = await prisma.customer.findUnique({ where: { phone } });
        if (!customer) {
            customer = await prisma.customer.create({
                data: { 
                    name: customerName, 
                    phone, 
                    email: email || null, 
                    address: address || null,
                    outsideCalls: 0,
                    carryInServices: 0,
                    totalInteractions: 0
                }
            });
        }
        
        // Create the service
        const [service] = await prisma.$transaction([
            prisma.carryInService.create({
                data: {
                    customerName,
                    phone,
                    email: email || null,
                    address: address,
                    category,
                    serviceDescription: serviceDescription || null,
                    customerId: customer.id,
                    createdBy: 'Share Link'
                }
            }),
            prisma.customer.update({
                where: { id: customer.id },
                data: {
                    carryInServices: { increment: 1 },
                    totalInteractions: { increment: 1 },
                    lastServiceDate: new Date(),
                    lastActivityDate: new Date()
                }
            })
        ]);
        
        // Emit real-time update
        emitToAll('service_created', service);
        
        res.status(201).json({ 
            success: true, 
            service,
            message: 'Service submitted successfully' 
        });
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            return res.status(404).json({ error: 'Share link has expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(404).json({ error: 'Invalid share link' });
        }
        console.error('Submit share link service error:', err);
        res.status(500).json({ error: 'Failed to submit service' });
    }
});
io.on('connection', (socket) => {
    socket.on('register', (userId: number) => {
        userSockets.set(userId, socket.id);
    });
    
    socket.on('disconnect', () => {
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
        res.status(500).json({ error: 'Internal server error' });
    } else {
        res.status(500).json({ error: err.message, stack: err.stack });
    }
});

// Handle 404 routes
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server with proper error handling
async function startServer() {
    try {
        await initializeDatabase();
        
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Health check: https://deploy-call-1.onrender.com/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
// Handle graceful shutdown
process.on("SIGINT", async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    try {
        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            console.log('Keep-alive interval cleared');
        }
        await prisma.$disconnect();
        console.log('Database disconnected');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});

process.on("SIGTERM", async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    try {
        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            console.log('Keep-alive interval cleared');
        }
        await prisma.$disconnect();
        console.log('Database disconnected');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
