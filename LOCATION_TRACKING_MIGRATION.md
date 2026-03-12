# Location Tracking Migration

## Steps to Apply Database Changes:

1. **Stop the backend server** (Ctrl+C)

2. **Run Prisma migration:**
   ```bash
   cd E:\DEEPINFOTECH\backend
   npx prisma db push
   ```

3. **Restart the backend:**
   ```bash
   npm run dev
   ```

4. **Restart the frontend** (if running)

## What Changed:

### Database (SalesLog table):
- Added `latitude` (Float, optional)
- Added `longitude` (Float, optional)  
- Added `locationAccuracy` (Float, optional)

### Backend API:
- `/sales-entries/:id/visit` now accepts location data

### Frontend:
- VisitLogModal now captures GPS location
- Shows location capture UI with status
- Allows retry if permission denied
- Visit logs without location if unavailable

### Details View:
- Shows "📍 View Location" button for visits with GPS data
- Opens Google Maps when clicked
- Shows accuracy information

## Features:

✅ Automatic location capture on visit
✅ Permission handling (allow/deny)
✅ Works on mobile and desktop
✅ Graceful fallback if location unavailable
✅ View location on Google Maps
✅ Shows accuracy in meters
✅ Retry option if denied

## Privacy:
- Location only captured when logging visit
- User can deny permission
- Visit still logs without location
- Location data only visible to authorized users
