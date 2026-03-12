# Reminder System - Visual Guide

## 🎨 UI Components Overview

### 1. Navbar with Badge
```
┌─────────────────────────────────────────────────────────┐
│  Logo  Dashboard  Sales Dashboard  [Reminders (🔴3)]   │
└─────────────────────────────────────────────────────────┘
                                        ↑
                                Red badge shows count
```

### 2. Reminders Page - Desktop View
```
┌──────────────────────────────────────────────────────────────────────┐
│  🔔 Reminders                                      🔄 Refresh         │
│  Follow-up required for 3 entries                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Firm Name │ City  │ Contact │ Visits │ Calls │ Overdue │ Delays│ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ ABC Corp  │ Delhi │ 9876... │  (5)   │  (3)  │  3d ⚠️  │ 1x 👤│ │
│  │                                    [📞 Call] [👁️ Visit] [⏰ Delay]│ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ XYZ Ltd   │ Mumbai│ 9123... │  (2)   │  (7)  │  1d ⚠️  │  -   │ │
│  │                                    [📞 Call] [👁️ Visit] [⏰ Delay]│ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 3. Reminders Page - Mobile View
```
┌─────────────────────────────────┐
│  🔔 Reminders                   │
│  Follow-up required for 3       │
│                                 │
│  ┌───────────────────────────┐ │
│  │ ABC Corp          3d ⚠️   │ │
│  │ Delhi                     │ │
│  │ 📞 9876543210             │ │
│  │ 👁️ Visits: 5              │ │
│  │ 📞 Calls: 3               │ │
│  │                           │ │
│  │ ⚠️ Delayed 1x             │ │
│  │ By: john_doe              │ │
│  │                           │ │
│  │ [📞 Call] [👁️ Visit] [⏰] │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ XYZ Ltd           1d ⚠️   │ │
│  │ Mumbai                    │ │
│  │ 📞 9123456789             │ │
│  │ 👁️ Visits: 2              │ │
│  │ 📞 Calls: 7               │ │
│  │                           │ │
│  │ [📞 Call] [👁️ Visit] [⏰] │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

### 4. Delay Modal
```
┌─────────────────────────────────┐
│  ⏰ Delay Reminder - ABC Corp   │
│                                 │
│  Select New Reminder Date *     │
│  ┌───────────────────────────┐ │
│  │ [📅 Date Picker]          │ │
│  └───────────────────────────┘ │
│                                 │
│  Current delay count: 1x        │
│                                 │
│  [Confirm Delay]  [Cancel]      │
└─────────────────────────────────┘
```

## 🎯 Color Coding

### Badges
- 🔴 **Red Badge** (Navbar): Pending reminders count
- 🔴 **Red Badge** (Overdue): Days overdue
- 🟡 **Yellow Badge** (Delays): Delay count (1x, 2x, 3x)
- 🔵 **Blue Badge** (Visits): Visit count
- 🟢 **Green Badge** (Calls): Call count

### Buttons
- 🟢 **Green** (Call): Log a call action
- 🔵 **Blue** (Visit): Log a visit action
- 🟠 **Orange** (Delay): Delay reminder

## 📊 Data Flow

```
┌─────────────────┐
│ Sales Dashboard │
│                 │
│ User logs       │
│ Call/Visit      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Backend Updates:        │
│ - lastActivityDate = NOW│
│ - reminderDate = +15d   │
└────────┬────────────────┘
         │
         ▼ (After 15 days)
┌─────────────────────────┐
│ Reminders Page          │
│ Shows overdue entries   │
│                         │
│ User clicks action:     │
│ ┌─────────────────────┐ │
│ │ Call/Visit → Reset  │ │
│ │ Delay → Custom Date │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## 🔄 Timer Reset Logic

### Call/Visit Action
```
Before:
reminderDate: 2024-01-01 (overdue)
delayCount: 0

After:
lastActivityDate: 2024-01-16 (NOW)
reminderDate: 2024-01-31 (+15 days)
delayCount: 0 (unchanged)
```

### Delay Action
```
Before:
reminderDate: 2024-01-01 (overdue)
delayCount: 1
delayedBy: ["john_doe"]

After (user selects 2024-02-15):
reminderDate: 2024-02-15 (custom date)
delayCount: 2 (+1)
delayedBy: ["john_doe", "jane_smith"]
```

## 📱 Responsive Breakpoints

- **sm** (< 640px): Single column cards
- **md** (640px - 1024px): Two column cards
- **lg** (> 1024px): Full table view

## 🎨 Design Highlights

✨ **Smooth Transitions**: All buttons have hover effects
✨ **Loading States**: Spinner while fetching data
✨ **Empty States**: Friendly message when no reminders
✨ **Toast Notifications**: Success/error feedback
✨ **Auto-refresh**: Badge updates every 60 seconds
✨ **Accessibility**: Proper labels and ARIA attributes

## 🔐 Access Control

- **HOST**: Full access to all features
- **SALES_EXECUTIVE**: Full access to all features
- **ADMIN/ENGINEER**: No access to reminders
- **Unauthenticated**: Redirected to login

## 📈 Performance Optimizations

- ✅ Database indexes on `reminderDate`
- ✅ Efficient SQL queries with joins
- ✅ Client-side caching (60s refresh)
- ✅ Lazy loading of modals
- ✅ Optimized re-renders with React hooks
