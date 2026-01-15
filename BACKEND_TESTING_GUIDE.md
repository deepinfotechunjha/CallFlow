# 🧪 BACKEND TESTING GUIDE

## Prerequisites
- Backend server running on port 4000
- At least one HOST user in database
- Some COMPLETED calls in database
- Postman or Thunder Client installed

---

## TEST 1: Verify DeletionHistory Table

### Using Database Client:
```sql
SELECT * FROM "DeletionHistory";
```

**Expected:** Table exists (may be empty)

---

## TEST 2: GET /analytics/deletion-history

### Request:
```
GET http://localhost:4000/analytics/deletion-history
Headers:
  Authorization: Bearer {HOST_USER_TOKEN}
```

### Expected Response:
```json
[]
```
or
```json
[
  {
    "id": 1,
    "deletedBy": 1,
    "deletedByName": "host_user",
    "deletedAt": "2025-01-15T10:30:00.000Z",
    "callCount": 5
  }
]
```

**Status Code:** 200 OK

---

## TEST 3: POST /calls/bulk-delete (Valid Password)

### Step 1: Get HOST user token
```
POST http://localhost:4000/auth/login
Body:
{
  "username": "your_host_username",
  "password": "your_host_password"
}
```

### Step 2: Get completed call IDs
```
GET http://localhost:4000/calls
Headers:
  Authorization: Bearer {TOKEN}
```

Filter for COMPLETED calls and note their IDs.

### Step 3: Delete calls
```
POST http://localhost:4000/calls/bulk-delete
Headers:
  Authorization: Bearer {HOST_TOKEN}
  Content-Type: application/json
Body:
{
  "callIds": [1, 2, 3],
  "secretPassword": "DEFAULTSECRET"
}
```

### Expected Response:
```json
{
  "success": true,
  "deletedCount": 3,
  "callsData": [
    {
      "id": 1,
      "customerName": "John Doe",
      "phone": "1234567890",
      ...
    }
  ]
}
```

**Status Code:** 200 OK

### Verify:
1. Calls deleted from database
2. DeletionHistory record created
3. Console shows: "Cleaned up X old deletion history entries" (if > 30)

---

## TEST 4: POST /calls/bulk-delete (Invalid Password)

### Request:
```
POST http://localhost:4000/calls/bulk-delete
Headers:
  Authorization: Bearer {HOST_TOKEN}
  Content-Type: application/json
Body:
{
  "callIds": [4, 5],
  "secretPassword": "WRONG_PASSWORD"
}
```

### Expected Response:
```json
{
  "error": "Invalid secret password"
}
```

**Status Code:** 401 Unauthorized

---

## TEST 5: POST /calls/bulk-delete (Non-HOST User)

### Step 1: Get ENGINEER/ADMIN token
```
POST http://localhost:4000/auth/login
Body:
{
  "username": "engineer_username",
  "password": "engineer_password"
}
```

### Step 2: Try to delete
```
POST http://localhost:4000/calls/bulk-delete
Headers:
  Authorization: Bearer {ENGINEER_TOKEN}
Body:
{
  "callIds": [6, 7],
  "secretPassword": "DEFAULTSECRET"
}
```

### Expected Response:
```json
{
  "error": "Insufficient permissions"
}
```

**Status Code:** 403 Forbidden

---

## TEST 6: POST /calls/bulk-delete (Non-COMPLETED Calls)

### Request:
```
POST http://localhost:4000/calls/bulk-delete
Headers:
  Authorization: Bearer {HOST_TOKEN}
Body:
{
  "callIds": [8, 9],  // IDs of PENDING or ASSIGNED calls
  "secretPassword": "DEFAULTSECRET"
}
```

### Expected Response:
```json
{
  "error": "No completed calls found to delete"
}
```

**Status Code:** 400 Bad Request

---

## TEST 7: Auto-Cleanup (> 30 Entries)

### Setup:
Create 31 deletion history entries by deleting calls 31 times.

### Request:
```
POST http://localhost:4000/calls/bulk-delete
Headers:
  Authorization: Bearer {HOST_TOKEN}
Body:
{
  "callIds": [10],
  "secretPassword": "DEFAULTSECRET"
}
```

### Verify:
1. Check console: "Cleaned up 1 old deletion history entries"
2. Query database:
```sql
SELECT COUNT(*) FROM "DeletionHistory";
```
**Expected:** 30 (not 31)

3. Verify oldest entry deleted:
```sql
SELECT * FROM "DeletionHistory" ORDER BY "deletedAt" ASC LIMIT 1;
```
Should NOT be the very first entry created.

---

## TEST 8: Email Notification

### Prerequisites:
- EMAIL_USER and EMAIL_PASS configured in .env
- At least 2 HOST users in database

### Request:
```
POST http://localhost:4000/calls/bulk-delete
Headers:
  Authorization: Bearer {HOST1_TOKEN}
Body:
{
  "callIds": [11, 12],
  "secretPassword": "DEFAULTSECRET"
}
```

### Verify:
1. Check email inbox of HOST2
2. Email subject: "CallFlow - Completed Calls Deleted"
3. Email contains:
   - Deleted by: HOST1 username
   - Date and time
   - Number of calls deleted

---

## TEST 9: Socket.io Event

### Setup:
- Open browser console on frontend
- Connect to Socket.io
- Listen for 'calls_bulk_deleted' event

### Request:
```
POST http://localhost:4000/calls/bulk-delete
Headers:
  Authorization: Bearer {HOST_TOKEN}
Body:
{
  "callIds": [13, 14],
  "secretPassword": "DEFAULTSECRET"
}
```

### Verify:
Browser console shows:
```javascript
{
  deletedBy: "host_username",
  deletedAt: "2025-01-15T10:30:00.000Z",
  count: 2,
  callIds: [13, 14]
}
```

---

## TEST 10: Database Notifications

### Request:
```
POST http://localhost:4000/calls/bulk-delete
Headers:
  Authorization: Bearer {HOST1_TOKEN}
Body:
{
  "callIds": [15],
  "secretPassword": "DEFAULTSECRET"
}
```

### Verify:
```
GET http://localhost:4000/notifications
Headers:
  Authorization: Bearer {HOST2_TOKEN}
```

**Expected:** Notification with:
- type: "BULK_DELETION"
- message: "host1_username deleted 1 completed calls"

---

## 🐛 TROUBLESHOOTING

### Error: "Database connection failed"
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Run: `npx prisma db push`

### Error: "DeletionHistory table not found"
- Run: `npx prisma generate`
- Run: `npx prisma db push`

### Error: "Failed to send email"
- Check EMAIL_USER and EMAIL_PASS in .env
- Verify Gmail app password is correct
- Check internet connection

### Error: "Invalid secret password"
- Check user's secretPassword in database
- Default is "DEFAULTSECRET"
- Update if needed

---

## ✅ SUCCESS CRITERIA

All tests should pass:
- ✅ DeletionHistory table exists
- ✅ GET endpoint returns data
- ✅ POST endpoint deletes calls
- ✅ Invalid password rejected
- ✅ Non-HOST users blocked
- ✅ Non-COMPLETED calls rejected
- ✅ Auto-cleanup works (> 30 entries)
- ✅ Email sent to other HOSTs
- ✅ Socket.io event emitted
- ✅ Database notifications created

---

**Next Step:** Once all backend tests pass, proceed to frontend implementation.
