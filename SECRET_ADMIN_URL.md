# Secret Admin Portal - Quick Guide

## 🔐 Secret URL (Type Manually)

**Admin Login:**
```
http://localhost:5173/secret-admin-portal-2024
```

**Production:**
```
https://your-domain.com/secret-admin-portal-2024
```

## 📝 Setup

Add to `backend/.env`:
```env
SPECIAL_ADMIN_USERNAME=specialadmin
SPECIAL_ADMIN_PASSWORD=REMOVED
SPECIAL_ADMIN_SECRET=REMOVED
SPECIAL_ADMIN_EMAIL=REMOVED
```

## 🚀 Usage

1. **Manually type the URL** in browser:
   ```
   http://localhost:5173/secret-admin-portal-2024
   ```

2. **Login:**
   - Username: `specialadmin`
   - Password: `REMOVED`

3. **View Users:**
   - Automatically redirected to user management
   - Read-only view of all users
   - No navbar, completely isolated

4. **Forgot Password/Username:**
   - Click "Forgot Username or Password?"
   - Enter secret: `REMOVED`
   - Enter email: `REMOVED`
   - Receive OTP (expires in 2 minutes)
   - Update credentials

## ⚠️ Important

- **No links** to this URL anywhere in the app
- Users must **manually type** the URL
- Completely **separate** from regular app
- **No navbar** or regular app navigation
- **Change credentials** in production!

## 🔒 Security

- Secret URL not discoverable
- Separate authentication
- OTP-based recovery
- 2-minute OTP expiry
- Environment-based credentials

## 📍 Routes

- `/secret-admin-portal-2024` - Login page
- `/secret-admin-portal-2024/manage` - User management (after login)

That's it! Simple and hidden. 🎯
