Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reminder System - Database Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "IMPORTANT: Please STOP your backend server first!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C in the terminal running 'npm run dev'" -ForegroundColor Yellow
Write-Host ""
$confirmation = Read-Host "Have you stopped the backend server? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Please stop the backend server and run this script again." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Green
Set-Location backend
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Prisma generate failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Pushing schema to database..." -ForegroundColor Green
npx prisma db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database push failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your backend server: npm run dev" -ForegroundColor White
Write-Host "2. Test the reminders feature" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
