# Cookie-Based City/Area Dropdowns Implementation

## What This Adds:

### For Sales Share Links:
- ✅ **1-hour cookie** created when share link is opened
- ✅ **City dropdown** populated from your existing sales data
- ✅ **Area dropdown** populated from your existing sales data
- ✅ **Auto-cleanup** of expired cookies
- ✅ **Cookie deleted** after form submission or 1 hour

## Installation Steps:

### Step 1: Install Required Package
```bash
# Run this script:
double-click install-cookie-parser.bat
```

### Step 2: Apply Database Migration
```bash
cd E:\DEEPINFOTECH\backend
npx prisma db push
```

### Step 3: Restart Backend
```bash
# Stop backend (Ctrl+C)
npm run dev
```

### Step 4: Restart Frontend
```bash
# Stop frontend (Ctrl+C)
cd E:\DEEPINFOTECH\frontend
npm run dev
```

## How It Works:

### 1. User Opens Share Link:
- Backend creates `PublicAccessToken` in database
- Sets 1-hour cookie in browser
- Frontend loads cities and areas from API

### 2. Dropdowns Populate:
- **Cities**: All unique cities from `SalesEntry` table
- **Areas**: All unique areas from `SalesEntry` table
- Both are independent (user can pick any combination)

### 3. Form Submission:
- Cookie is marked as "used" in database
- Cookie is deleted from browser
- Link becomes unusable

### 4. Auto-Cleanup:
- Expired tokens cleaned every 10 minutes
- Used tokens cleaned immediately

## New API Endpoints:

### Public Endpoints (Cookie Protected):
```
GET /api/public/cities    - Returns ["Mumbai", "Delhi", ...]
GET /api/public/areas     - Returns ["Andheri", "Bandra", ...]
```

### Internal Endpoints:
```
POST /api/public/create-access-token  - Creates cookie token
```

## Database Changes:

### New Table: `PublicAccessToken`
```sql
- id (Int, Primary Key)
- token (String, Unique)
- expiresAt (DateTime)
- used (Boolean, default false)
- createdAt (DateTime)
```

## Security Features:

✅ **Time-limited** - 1 hour maximum access
✅ **One-time use** - Deleted after submission
✅ **Token-based** - Random 32-byte tokens
✅ **No sensitive data** - Only city/area names exposed
✅ **Auto-cleanup** - Expired tokens removed automatically

## Testing:

### 1. Create Sales Share Link:
- Go to Sales Dashboard
- Click "Share" button
- Copy the share link

### 2. Open Share Link:
- Open link in browser
- Should see form with city/area dropdowns
- Dropdowns should populate with your existing data

### 3. Test Cookie Expiry:
- Wait 1 hour OR submit form
- Try to access `/api/public/cities` directly
- Should get "Access token required" error

## Troubleshooting:

### Issue: Dropdowns Empty
**Check:**
- Backend logs for API errors
- Browser Network tab for failed requests
- Database has cities/areas in `SalesEntry` table

### Issue: "Access token required"
**Solutions:**
- Open fresh share link (creates new cookie)
- Check if cookie expired (1 hour limit)
- Ensure `credentials: 'include'` in fetch requests

### Issue: Cookie Not Set
**Check:**
- Backend has `cookie-parser` middleware
- CORS allows credentials
- Frontend uses `credentials: 'include'`

## File Changes Made:

### Backend:
- `schema.prisma` - Added `PublicAccessToken` table
- `index.ts` - Added public API endpoints and cookie logic

### Frontend:
- `PublicSalesForm.jsx` - Updated to use API dropdowns

### New Files:
- `install-cookie-parser.bat` - Package installation script

## Benefits:

1. **Better UX** - Real data instead of manual typing
2. **Data Consistency** - Same cities/areas as main system
3. **Secure** - Limited access, no sensitive data
4. **Maintenance-free** - Auto-cleanup, no manual work needed

## Notes:

- Cookie works across all browsers
- Mobile-friendly implementation
- Fallback to manual entry if API fails
- Compatible with existing share link system