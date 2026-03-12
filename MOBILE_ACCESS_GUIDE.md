# Mobile Access Guide

## Quick Start - 3 Steps

### Step 1: Find Your Computer's IP Address

**Run the test script:**
1. Double-click `test-network.bat` in the DEEPINFOTECH folder
2. Copy the IPv4 Address (looks like `192.168.1.100`)

**OR manually:**
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your WiFi adapter

### Step 2: Allow Firewall Access

**Run as Administrator:**
1. Right-click `add-firewall-rules.bat`
2. Select "Run as administrator"
3. Click "Yes" when prompted

This will allow ports 5173 and 4000 through Windows Firewall.

### Step 3: Start Servers & Access from Phone

**Start Backend:**
```bash
cd E:\DEEPINFOTECH\backend
npm run dev
```

**Start Frontend (new terminal):**
```bash
cd E:\DEEPINFOTECH\frontend
npm run dev
```

**On Your Phone:**
1. Connect to the SAME WiFi as your computer
2. Open browser (Chrome/Safari)
3. Go to: `http://YOUR_IP:5173`
   - Example: `http://192.168.1.100:5173`

## Troubleshooting

### Problem: Can't access from phone

**Solution 1: Check Same WiFi Network**
- Computer and phone MUST be on the same WiFi
- Not mobile data, not different WiFi

**Solution 2: Temporarily Disable Firewall (for testing)**
1. Open Windows Security
2. Go to Firewall & network protection
3. Turn off for Private network (temporarily)
4. Try accessing from phone
5. Turn firewall back on after testing

**Solution 3: Check if servers are running**
- Backend should show: `Server running on port 4000`
- Frontend should show: `Network: http://192.168.x.x:5173`

**Solution 4: Verify IP Address**
- Run `ipconfig` again
- IP might change after reconnecting WiFi
- Use the IP shown under "Wireless LAN adapter Wi-Fi"

**Solution 5: Check Router Settings**
- Some routers have "AP Isolation" or "Client Isolation"
- This prevents devices from talking to each other
- Check router settings and disable if enabled

### Problem: Backend connection failed

**Update Frontend .env.local:**
```env
VITE_API_URL=http://192.168.1.100:4000
```
Replace with your actual IP address, then restart frontend.

### Problem: WhatsApp/Call not opening app

**This is normal if:**
- WhatsApp app is not installed
- Browser doesn't support deep links
- It will fallback to WhatsApp Web automatically

## Testing Checklist

✅ Both computer and phone on same WiFi?
✅ Firewall rules added?
✅ Both servers running?
✅ Using correct IP address?
✅ Tried accessing: `http://YOUR_IP:5173`?

## Alternative: Use ngrok (if local network doesn't work)

If you can't get local network access working, use ngrok:

1. Install ngrok: https://ngrok.com/download
2. Start your servers
3. Run: `ngrok http 5173`
4. Use the ngrok URL on your phone

## Features Working on Mobile

✅ WhatsApp Button - Opens WhatsApp app
✅ Call Button - Initiates phone call  
✅ All dashboard features
✅ Responsive design for all screen sizes

## Notes

- Keep both terminal windows running
- Computer must stay on and connected to WiFi
- IP address may change if you reconnect to WiFi
- WhatsApp button tries app first, then falls back to web
