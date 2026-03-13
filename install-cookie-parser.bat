@echo off
echo Installing cookie-parser package...
cd E:\DEEPINFOTECH\backend
npm install cookie-parser
npm install --save-dev @types/cookie-parser
echo.
echo Cookie parser installed successfully!
echo Now run: npx prisma db push
pause