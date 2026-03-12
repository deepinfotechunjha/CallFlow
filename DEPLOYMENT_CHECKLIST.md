# Deployment Checklist - Reminder System

## ✅ Pre-Deployment Checklist

### Backend Changes
- [x] Updated `schema.prisma` with new fields
- [x] Modified `/sales-entries/:id/visit` endpoint
- [x] Modified `/sales-entries/:id/call` endpoint
- [x] Added `GET /sales-reminders` endpoint
- [x] Added `POST /sales-entries/:id/reminder-action` endpoint
- [x] Added `POST /sales-entries/:id/delay` endpoint

### Frontend Changes
- [x] Fixed search to use `startsWith()` instead of `includes()`
- [x] Created `RemindersPage.jsx`
- [x] Created `ReminderCard.jsx`
- [x] Created `ReminderTable.jsx`
- [x] Created `DelayModal.jsx`
- [x] Updated `Navbar.jsx` with badge
- [x] Updated `App.jsx` with route

### Documentation
- [x] Created `REMINDER_SYSTEM_SUMMARY.md`
- [x] Created `REMINDER_MIGRATION.md`
- [x] Created `REMINDER_QUICK_START.md`
- [x] Created `REMINDER_VISUAL_GUIDE.md`
- [x] Created `DEPLOYMENT_CHECKLIST.md`

## 🚀 Deployment Steps

### Step 1: Database Migration
```bash
cd backend
npx prisma generate
npx prisma db push
```
**Expected Output:**
```
✔ Generated Prisma Client
✔ The database is now in sync with the Prisma schema
```

### Step 2: Verify Backend
```bash
npm run dev
```
**Check:**
- [ ] Server starts without errors
- [ ] No TypeScript compilation errors
- [ ] Prisma client loads successfully

### Step 3: Test Backend Endpoints
```bash
# Test reminders endpoint (requires auth token)
curl -H "Authorization: Bearer <token>" http://localhost:4000/sales-reminders
```
**Expected:** JSON array of reminders (may be empty)

### Step 4: Start Frontend
```bash
cd ../frontend
npm run dev
```
**Check:**
- [ ] No compilation errors
- [ ] App loads at http://localhost:5173

### Step 5: Manual Testing

#### Test 1: Search Fix
- [ ] Go to Sales Dashboard
- [ ] Search "ab" in firm name
- [ ] Verify only firms starting with "ab" appear
- [ ] Search "bc" should NOT show "abc"

#### Test 2: Reminder Creation
- [ ] Log a call on any entry
- [ ] Check database: `SELECT "reminderDate" FROM "SalesEntry" WHERE id = X;`
- [ ] Verify `reminderDate` is approximately NOW + 15 days

#### Test 3: Reminders Page
- [ ] Manually set an entry to overdue:
  ```sql
  UPDATE "SalesEntry" 
  SET "reminderDate" = NOW() - INTERVAL '1 day'
  WHERE id = 1;
  ```
- [ ] Navigate to Reminders page
- [ ] Verify entry appears with "1d overdue" badge
- [ ] Verify navbar shows red badge with count

#### Test 4: Call Action
- [ ] Click "Call" button on reminder
- [ ] Verify success toast appears
- [ ] Verify entry disappears from reminders
- [ ] Check database: `reminderDate` should be NOW + 15 days

#### Test 5: Visit Action
- [ ] Make another entry overdue
- [ ] Click "Visit" button
- [ ] Verify same behavior as Call

#### Test 6: Delay Action
- [ ] Make another entry overdue
- [ ] Click "Delay" button
- [ ] Select a future date (e.g., 7 days from now)
- [ ] Click "Confirm Delay"
- [ ] Verify entry disappears
- [ ] Check database:
  ```sql
  SELECT "delayCount", "delayedBy", "reminderDate" 
  FROM "SalesEntry" WHERE id = X;
  ```
- [ ] Verify `delayCount` = 1
- [ ] Verify `delayedBy` contains your username
- [ ] Verify `reminderDate` matches selected date

#### Test 7: Multiple Delays
- [ ] Make the same entry overdue again
- [ ] Click "Delay" again
- [ ] Select another date
- [ ] Verify `delayCount` = 2
- [ ] Verify `delayedBy` has 2 usernames

#### Test 8: Mobile Responsiveness
- [ ] Open browser dev tools
- [ ] Switch to mobile view (375px width)
- [ ] Verify cards display correctly
- [ ] Verify buttons are touchable
- [ ] Test tablet view (768px width)
- [ ] Verify 2-column layout

#### Test 9: Badge Auto-Refresh
- [ ] Note current badge count
- [ ] Make an entry overdue in database
- [ ] Wait 60 seconds
- [ ] Verify badge count increases

#### Test 10: Role-Based Access
- [ ] Log in as ENGINEER or ADMIN
- [ ] Verify "Reminders" link is NOT visible
- [ ] Try accessing `/reminders` directly
- [ ] Verify redirect or access denied

## 🐛 Common Issues & Fixes

### Issue: "Prisma Client did not initialize"
**Fix:**
```bash
cd backend
npx prisma generate
```

### Issue: Badge not showing
**Fix:**
- Check browser console for errors
- Verify user role is HOST or SALES_EXECUTIVE
- Check network tab for `/sales-reminders` request

### Issue: Reminders page empty
**Fix:**
- No entries are overdue yet
- Create test data:
  ```sql
  UPDATE "SalesEntry" 
  SET "reminderDate" = NOW() - INTERVAL '1 day'
  LIMIT 3;
  ```

### Issue: Search still using substring
**Fix:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Verify `SalesDashboard.jsx` has `startsWith()`

### Issue: Delay count not incrementing
**Fix:**
- Check backend logs for errors
- Verify `/sales-entries/:id/delay` endpoint exists
- Check database column type for `delayCount` (should be Int)

## 📊 Production Deployment

### Backend (Render)
1. Push code to GitHub
2. Render will auto-deploy
3. Run migration in Render shell:
   ```bash
   npx prisma db push
   ```
4. Restart service

### Frontend (Netlify)
1. Push code to GitHub
2. Netlify will auto-deploy
3. Clear cache if needed

### Database (Neon/PostgreSQL)
- Migration runs automatically via `npx prisma db push`
- Verify new columns exist:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'SalesEntry' 
  AND column_name IN ('lastActivityDate', 'reminderDate', 'delayCount', 'delayedBy');
  ```

## ✅ Post-Deployment Verification

- [ ] Production site loads without errors
- [ ] Login works
- [ ] Sales Dashboard search uses prefix matching
- [ ] Reminders page accessible
- [ ] Badge shows on navbar
- [ ] Can log call/visit from reminders
- [ ] Can delay reminders
- [ ] Mobile view works correctly
- [ ] No console errors
- [ ] No 500 errors in backend logs

## 🎉 Success Criteria

✅ All 10 manual tests pass
✅ No errors in browser console
✅ No errors in backend logs
✅ Mobile and desktop views work
✅ Badge updates automatically
✅ Delay tracking works correctly
✅ Search uses prefix matching

## 📞 Support

If issues persist:
1. Check `REMINDER_SYSTEM_SUMMARY.md` for detailed docs
2. Review `REMINDER_VISUAL_GUIDE.md` for UI reference
3. Check backend logs for API errors
4. Verify database schema matches `schema.prisma`

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Status:** ⬜ Success  ⬜ Issues Found  ⬜ Rolled Back
