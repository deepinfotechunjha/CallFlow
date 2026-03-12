# Reminder System Database Migration

## Steps to Apply Changes

### 1. Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### 2. Push Schema Changes to Database
```bash
npx prisma db push
```

This will add the following fields to the `SalesEntry` table:
- `lastActivityDate` (DateTime, nullable)
- `reminderDate` (DateTime, nullable)
- `delayCount` (Int, default 0)
- `delayedBy` (String array, default [])

### 3. Restart Backend Server
```bash
npm run dev
```

### 4. Install Frontend Dependencies (if needed)
```bash
cd ../frontend
npm install
```

### 5. Start Frontend
```bash
npm run dev
```

## Testing the Feature

1. Log in as HOST or SALES_EXECUTIVE
2. Go to Sales Dashboard
3. Create a call or visit log for any entry
4. The entry will now have a `reminderDate` set to 15 days from now
5. To test immediately, manually update the database:
   ```sql
   UPDATE "SalesEntry" 
   SET "reminderDate" = NOW() - INTERVAL '1 day'
   WHERE id = <entry_id>;
   ```
6. Navigate to "Reminders" page (new link in navbar with red badge)
7. You should see the entry with overdue status
8. Test the three actions:
   - **Call**: Logs a call and resets timer to 15 days
   - **Visit**: Logs a visit and resets timer to 15 days
   - **Delay**: Opens date picker, increments delay count, adds username to delayedBy array

## Features Implemented

✅ 15-day auto timer on call/visit creation
✅ Reminders page showing overdue entries
✅ Red badge on navbar showing reminder count
✅ Call/Visit buttons to reset timer
✅ Delay button with date picker
✅ Delay count tracking (1x, 2x, 3x...)
✅ Delayed by username tracking
✅ Responsive design (mobile cards, desktop table)
✅ Real-time count updates every minute
✅ Days overdue calculation and display
