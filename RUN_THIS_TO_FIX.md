# 🚨 STOP BACKEND SERVER FIRST! 🚨

Press Ctrl+C in your backend terminal to stop the server.

Then run ONE of these commands:

## Option 1: PowerShell (Recommended)
```powershell
cd e:\DEEPINFOTECH
powershell -ExecutionPolicy Bypass -File migrate-reminder-system.ps1
```

## Option 2: Manual Commands
```bash
cd e:\DEEPINFOTECH\backend
npx prisma generate
npx prisma db push
```

## Option 3: Direct SQL
Connect to your database and run:
```sql
ALTER TABLE "SalesEntry" 
ADD COLUMN IF NOT EXISTS "lastActivityDate" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "reminderDate" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "delayCount" INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS "delayedBy" TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;

CREATE INDEX IF NOT EXISTS "SalesEntry_reminderDate_idx" ON "SalesEntry"("reminderDate");
```

## After Migration
Restart backend:
```bash
cd e:\DEEPINFOTECH\backend
npm run dev
```

The error will be gone! ✅
