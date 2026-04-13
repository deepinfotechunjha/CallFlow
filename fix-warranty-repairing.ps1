$filePath = 'd:\Projects (dec)\shruti2(28.03.2026)\backend\src\index.ts'
$lines = Get-Content $filePath

$newBlock = @(
"app.post('/carry-in-services/:id/warranty', authMiddleware, async (req: Request, res: Response) => {",
"    const serviceId = parseInt(req.params.id || '');",
"    const { warrantyRemark } = req.body as { warrantyRemark: string };",
"    if (!req.user?.username) return res.status(401).json({ error: 'User not authenticated' });",
"    if (!warrantyRemark || !warrantyRemark.trim()) return res.status(400).json({ error: 'Warranty remark is required' });",
"    try {",
"        const existingService = await prisma.carryInService.findUnique({ where: { id: serviceId } });",
"        if (!existingService) return res.status(404).json({ error: 'Service not found' });",
"        if (existingService.status !== 'PENDING') return res.status(400).json({ error: 'Can only mark PENDING services as warranty' });",
"        const service = await prisma.carryInService.update({",
"            where: { id: serviceId },",
"            data: { warrantyRemark: warrantyRemark.trim(), warrantyBy: req.user.username, warrantyAt: new Date() }",
"        });",
"        emitToAll('service_updated', service);",
"        res.json(service);",
"    } catch (err: any) { res.status(500).json({ error: String(err) }); }",
"});",
"",
"app.post('/carry-in-services/:id/repairing', authMiddleware, async (req: Request, res: Response) => {",
"    const serviceId = parseInt(req.params.id || '');",
"    const { repairingRemark } = req.body as { repairingRemark: string };",
"    if (!req.user?.username) return res.status(401).json({ error: 'User not authenticated' });",
"    if (!repairingRemark || !repairingRemark.trim()) return res.status(400).json({ error: 'Repairing remark is required' });",
"    try {",
"        const existingService = await prisma.carryInService.findUnique({ where: { id: serviceId } });",
"        if (!existingService) return res.status(404).json({ error: 'Service not found' });",
"        if (existingService.status !== 'PENDING') return res.status(400).json({ error: 'Can only mark PENDING services as repairing' });",
"        const service = await prisma.carryInService.update({",
"            where: { id: serviceId },",
"            data: { repairingRemark: repairingRemark.trim(), repairingBy: req.user.username, repairingAt: new Date() }",
"        });",
"        emitToAll('service_updated', service);",
"        res.json(service);",
"    } catch (err: any) { res.status(500).json({ error: String(err) }); }",
"});",
""
)

# Insert before line 2842 (0-indexed), which is "// Bulk Delete Carry-In Services endpoint"
$result = @($lines[0..2841]) + $newBlock + @($lines[2842..($lines.Length - 1)])
Set-Content $filePath -Value $result
Write-Host "Done. Total lines: $($result.Length)"
