$filePath = 'd:\Projects (dec)\shruti2(28.03.2026)\backend\src\index.ts'
$lines = Get-Content $filePath
$lines[3683] = "app.put('/sales-entries/:id', authMiddleware, requireRole(['HOST', 'SALES_ADMIN']), async (req: Request, res: Response) => {"
Set-Content $filePath -Value $lines
Write-Host "Done. Line 3684 is now: $($lines[3683])"
