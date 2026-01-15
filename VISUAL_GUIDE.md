# Visual Guide - Secret Admin Portal

## 🌐 How to Access

```
User manually types in browser:
┌─────────────────────────────────────────────────────┐
│ 🌐 http://localhost:5173/secret-admin-portal-2024  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              🔐 Admin Portal Login                  │
│                                                     │
│  Username: [specialadmin              ]            │
│  Password: [••••••••••••••••••••••••••]            │
│                                                     │
│  [         Sign in         ]                       │
│                                                     │
│  Forgot Username or Password?                      │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│  Admin Portal                        [Logout]       │
│  User Management                                    │
│  ─────────────────────────────────────────────────  │
│  👥 All Users                                       │
│  ┌───────────────────────────────────────────────┐ │
│  │ Username │ Email      │ Phone  │ Role │ Date │ │
│  │ john     │ j@mail.com │ 123... │ HOST │ ... │ │
│  │ alice    │ a@mail.com │ 456... │ ADMIN│ ... │ │
│  │ bob      │ b@mail.com │ 789... │ ENG  │ ... │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Total Users: 3                                     │
│  This is a read-only view for special admins       │
└─────────────────────────────────────────────────────┘
```

## 🔄 Forgot Password Flow

```
Step 1: Secret
┌──────────────────────┐
│ Enter Secret Key:    │
│ [REMOVED]  │
│ [Verify Secret]     │
└──────────────────────┘
         │
         ▼
Step 2: Email
┌──────────────────────┐
│ Enter Email:         │
│ [admin@email.com]   │
│ [Send OTP]          │
└──────────────────────┘
         │
         ▼
Step 3: OTP (2 min)
┌──────────────────────┐
│ ⏱️  1:45             │
│ [1][2][3][4][5][6]  │
│ [Verify OTP]        │
└──────────────────────┘
         │
         ▼
Step 4: Update
┌──────────────────────┐
│ [Recover Username]  │
│ [Recover Password]  │
└──────────────────────┘
```

## 🔒 Key Points

```
✅ NO links to this URL in your app
✅ Users MUST type URL manually
✅ Completely SEPARATE from main site
✅ NO navbar or regular navigation
✅ READ-ONLY user view
✅ OTP expires in 2 minutes
```

## 🎯 Main App vs Admin Portal

```
Main App                    Admin Portal
─────────                   ─────────────
/login                      /secret-admin-portal-2024
/dashboard                  /secret-admin-portal-2024/manage
/users (regular)            (isolated, no navbar)
/profile
/analytics
(with navbar)               (no navbar)
```

## 📧 OTP Email

```
┌────────────────────────────────┐
│ CallFlow - Recovery OTP        │
│                                │
│ Your OTP:                      │
│  ┌──────────────────────────┐ │
│  │       123456             │ │
│  └──────────────────────────┘ │
│                                │
│ Expires in 2 minutes           │
└────────────────────────────────┘
```

## 🚀 Quick Test

```bash
1. Start: npm run dev (backend & frontend)
2. Type: http://localhost:5173/secret-admin-portal-2024
3. Login: specialadmin / REMOVED
4. See: All users list
5. Test: Forgot password flow
```

Done! 🎉
