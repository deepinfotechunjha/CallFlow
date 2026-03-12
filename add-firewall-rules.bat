@echo off
echo ========================================
echo Adding Windows Firewall Rules for Node.js
echo ========================================
echo.
echo This script needs to run as Administrator
echo Right-click and select "Run as administrator"
echo.
pause

echo Adding inbound rule for port 5173 (Frontend)...
netsh advfirewall firewall add rule name="Node.js Frontend Port 5173" dir=in action=allow protocol=TCP localport=5173

echo Adding inbound rule for port 4000 (Backend)...
netsh advfirewall firewall add rule name="Node.js Backend Port 4000" dir=in action=allow protocol=TCP localport=4000

echo.
echo ========================================
echo Firewall rules added successfully!
echo ========================================
echo.
echo Now try accessing from your phone:
echo 1. Find your IP using: ipconfig
echo 2. On phone browser: http://YOUR_IP:5173
echo.
pause
