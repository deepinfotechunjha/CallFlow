@echo off
echo ========================================
echo Network Configuration Test
echo ========================================
echo.

echo Your Computer's IP Addresses:
echo ========================================
ipconfig | findstr /i "IPv4"
echo.

echo ========================================
echo Testing if ports are listening...
echo ========================================
netstat -an | findstr ":5173"
netstat -an | findstr ":4000"
echo.

echo ========================================
echo Firewall Rules for Node.js:
echo ========================================
netsh advfirewall firewall show rule name=all | findstr /i "node"
echo.

echo ========================================
echo Instructions:
echo ========================================
echo 1. Copy one of the IPv4 addresses above (192.168.x.x)
echo 2. On your phone, open browser and go to: http://YOUR_IP:5173
echo 3. Make sure your phone is on the SAME WiFi network
echo.
echo If it doesn't work, you may need to:
echo - Allow Node.js through Windows Firewall
echo - Temporarily disable Windows Firewall for testing
echo.
pause
