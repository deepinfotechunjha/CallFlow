/*  */import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from "express";

dotenv.config();

// Pass the adapter option to PrismaClient so it can connect directly
// using the DATABASE_URL at runtime (Prisma 7+ style). Use a cast to
// avoid TypeScript type mismatch if the installed @prisma/client types
// don't yet include the new option.
const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const allowedOrigins = [process.env.FRONTEND_ORIGIN ?? 'https://call-manage.netlify.app', 'http://localhost:5173'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

function signToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch (err) {
        return null;
    }
}

// Simple auth middleware
function authMiddleware(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });
    const token = parts[1];
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const payload = verifyToken(token as string);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload;
    next();
}

// Role-based authorization middleware
function requireRole(roles: string[]) {
    return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Health check endpoint
app.get("/health", async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok" });
    } catch (err) {
        res.status(500).json({ status: "error", error: String(err) });
    }
});

// Secret password verification endpoint
app.post("/auth/verify-secret", authMiddleware, async (req: Request, res: Response) => {
    const { secretPassword } = req.body;
    const user = req.user;
    
    if (!secretPassword) {
        return res.status(400).json({ error: 'Secret password is required' });
    }
    
    try {
        const dbUser = await prisma.user.findUnique({ 
            where: { id: user.id },
            select: { secretPassword: true, role: true }
        });
        
        if (!dbUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (dbUser.secretPassword !== secretPassword) {
            return res.status(401).json({ error: 'Invalid secret password' });
        }
        
        res.json({ success: true, hasAccess: dbUser.role === 'HOST' });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// User endpoints
app.get("/users", authMiddleware, requireRole(['HOST']), async (_req: Request & { user?: any }, res: Response) => {
    try {
        const users = await prisma.user.findMany({ 
            select: { id: true, username: true, role: true, createdAt: true } 
        });
        res.json(users);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.put("/users/:id", authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id || '');
    const { username, password, role, secretPassword } = req.body;
    
    try {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const updateData: any = {};
        
        // Update username if provided
        if (username && username !== currentUser.username) {
            updateData.username = username;
        }
        
        // Update password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        // Update role if provided
        if (role && ['HOST', 'ADMIN', 'USER'].includes(role)) {
            // Check HOST limit if promoting to HOST
            if (role === 'HOST') {
                const hostCount = await prisma.user.count({ where: { role: 'HOST' } });
                if (currentUser.role !== 'HOST' && hostCount >= 3) {
                    return res.status(400).json({ error: 'Maximum 3 HOSTs allowed' });
                }
                // Require secret password when promoting to HOST
                if (currentUser.role !== 'HOST' && !secretPassword) {
                    return res.status(400).json({ error: 'Secret password is required when promoting to HOST' });
                }
            }
            
            updateData.role = role;
            
            // Update secretPassword based on role change
            if (role === 'HOST' && currentUser.role !== 'HOST') {
                // Promoting to HOST - use provided secret password
                updateData.secretPassword = secretPassword;
            } else if (role !== 'HOST' && currentUser.role === 'HOST') {
                // Demoting from HOST - set to default
                updateData.secretPassword = 'DEFAULTSECRET';
            }
        }
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, username: true, role: true, createdAt: true }
        });
        
        res.json(user);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.delete("/users/:id", authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id || '');
    
    try {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Prevent deleting the last HOST
        if (currentUser.role === 'HOST') {
            const hostCount = await prisma.user.count({ where: { role: 'HOST' } });
            if (hostCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last HOST user' });
            }
        }
        
        await prisma.user.delete({ where: { id: userId } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post("/users", authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const { username, password, role, secretPassword } = req.body as { username?: string; password?: string; role?: string; secretPassword?: string };
    
    if (!username || !password || !role) {
        return res.status(400).json({ error: "username, password, and role are required" });
    }
    
    if (!['HOST', 'ADMIN', 'USER'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be HOST, ADMIN, or USER" });
    }
    
    // Require secret password for HOST role
    if (role === 'HOST' && !secretPassword) {
        return res.status(400).json({ error: "Secret password is required for HOST role" });
    }
    
    try {
        // Check HOST limit
        if (role === 'HOST') {
            const hostCount = await prisma.user.count({ where: { role: 'HOST' } });
            if (hostCount >= 3) {
                return res.status(400).json({ error: 'Maximum 3 HOSTs allowed' });
            }
        }
        
        const hashed = await bcrypt.hash(password, 10);
        const finalSecretPassword = role === 'HOST' ? secretPassword : 'DEFAULTSECRET';
        
        const user = await prisma.user.create({ 
            data: { username, password: hashed, role, secretPassword: finalSecretPassword } 
        });
        
        res.status(201).json({ 
            id: user.id, 
            username: user.username, 
            role: user.role, 
            createdAt: user.createdAt 
        });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});



// Call endpoints
app.get('/calls', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
    try {
        const userRole = req.user?.role as string;
        const username = req.user?.username as string;
        
        let whereClause = {};
        if (userRole === 'USER') {
            whereClause = {
                OR: [
                    { createdBy: username },
                    { assignedTo: username }
                ]
            };
        }
        
        // If whereClause is empty, omit `where` so Prisma receives no filter
        const findArgs: any = {};
        if (Object.keys(whereClause).length > 0) findArgs.where = whereClause;
        const calls = await prisma.call.findMany(findArgs);
        res.json(calls);
    } catch (err: any) {
        console.error('GET /calls error:', err);
        res.status(500).json({ error: 'Failed to fetch calls', details: String(err) });
    }
});

// Extend the Request type to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

// Update a call by ID
app.put('/calls/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    if (isNaN(callId)) {
        return res.status(400).json({ error: 'Invalid call ID' });
    }

    try {
        // Check if call is completed
        const existingCall = await prisma.call.findUnique({ where: { id: callId } });
        if (!existingCall) {
            return res.status(404).json({ error: 'Call not found' });
        }
        if (existingCall.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot edit completed calls' });
        }

        const { 
            problem, 
            category, 
            status, 
            assignedTo, 
            customerName, 
            phone, 
            email, 
            address 
        } = req.body;

        // Preserve existing assignment if not provided
        const updateData: any = {
            customerName,
            phone,
            email: email || null,
            address: address || null,
            problem,
            category,
            status: assignedTo !== undefined && assignedTo ? 'ASSIGNED' : (assignedTo === null || assignedTo === '' ? 'PENDING' : status),
        };
        
        // Only update assignedTo if it's explicitly provided
        if (assignedTo !== undefined) {
            updateData.assignedTo = assignedTo || null;
        }

        const call = await prisma.call.update({
            where: { id: callId },
            data: updateData
        });
        
        res.json(call);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update call' });
    }
});

// Assign or reassign call to worker
app.post('/calls/:id/assign', authMiddleware, requireRole(['HOST', 'ADMIN']), async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    const { assignee, engineerRemark } = req.body;
    
    if (!assignee) {
        return res.status(400).json({ error: 'Assignee is required' });
    }
    
    try {
        // First check if call exists and is not completed
        const existingCall = await prisma.call.findUnique({ 
            where: { id: callId } 
        });
        
        if (!existingCall) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        if (existingCall.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot assign a completed call' });
        }
        
        // If this is a reassignment, keep the original assignedAt
       const isReassignment = existingCall.assignedTo && existingCall.assignedTo !== assignee;

const updateData = {
    assignedTo: assignee,
    // Always update assignedAt to current time when assigning/reassigning
    assignedAt: new Date(),
    assignedBy: req.user?.username || 'system',
    // If it's a new assignment or being reassigned from null, set to 'ASSIGNED'
    // Otherwise, keep existing status if it's a reassignment to a different user
    status: (!existingCall.assignedTo || isReassignment) ? 'ASSIGNED' : existingCall.status,
    engineerRemark: engineerRemark || null
};

const call = await prisma.call.update({
    where: { id: callId },
    data: updateData,
    include: {
        customer: true
    }
});
        
        res.json(call);
    } catch (err: any) {
        console.error('Error in /calls/:id/assign:', err);
        res.status(500).json({ 
            error: 'Failed to assign call',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Complete a call
app.post('/calls/:id/complete', authMiddleware, async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    const { remark, engineerRemark } = req.body;
    const user = req.user;
    
    try {
        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        // Check if user can complete this call
        const canComplete = call.assignedTo === user.username || ['HOST', 'ADMIN'].includes(user.role);
        if (!canComplete) {
            return res.status(403).json({ error: 'Cannot complete this call' });
        }
        
        const updatedCall = await prisma.call.update({
            where: { id: callId },
            data: {
                status: 'COMPLETED',
                completedBy: user.username,
                completedAt: new Date(),
                remark: remark || null,
                engineerRemark: engineerRemark !== undefined ? engineerRemark : call.engineerRemark
            },
            include: {
                customer: true
            }
        });
        
        res.json(updatedCall);
    } catch (err: any) {
        console.error('Error in /calls/:id/complete:', err);
        res.status(500).json({ 
            error: 'Failed to complete call',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Check for duplicate calls
app.post('/calls/check-duplicate', authMiddleware, async (req: Request, res: Response) => {
    const { phone, category } = req.body;
    
    if (!phone || !category) {
        return res.status(400).json({ error: 'Phone and category are required' });
    }
    
    try {
        const existingCall = await prisma.call.findFirst({
            where: {
                phone,
                category,
                status: { in: ['PENDING', 'ASSIGNED'] }
            },
            select: {
                id: true,
                customerName: true,
                phone: true,
                category: true,
                problem: true,
                status: true,
                assignedTo: true,
                createdAt: true,
                createdBy: true,
                callCount: true
            }
        });
        
        res.json({ duplicate: !!existingCall, existingCall });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Update existing call (increment call count)
app.put('/calls/:id/increment', authMiddleware, async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    const user = req.user;
    
    try {
        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        const updatedCall = await prisma.call.update({
            where: { id: callId },
            data: {
                callCount: call.callCount + 1,
                lastCalledAt: new Date()
            }
        });
        
        // Create notifications
        const notifications = [];
        
        // Notify original creator
        if (call.createdBy && call.createdBy !== user.username) {
            notifications.push({
                userId: call.createdBy,
                message: `Customer: ${call.customerName} (${call.phone}) called again about: ${call.category}`,
                type: 'DUPLICATE_CALL',
                callId: call.id
            });
        }
        
        // Notify assigned engineer
        if (call.assignedTo && call.assignedTo !== user.username) {
            notifications.push({
                userId: call.assignedTo,
                message: `Customer: ${call.customerName} (${call.phone}) called again about: ${call.category}`,
                type: 'DUPLICATE_CALL',
                callId: call.id
            });
        }
        
        // Notify all HOSTs and ADMINs
        const admins = await prisma.user.findMany({
            where: { role: { in: ['HOST', 'ADMIN'] } },
            select: { username: true }
        });
        
        admins.forEach(admin => {
            if (admin.username !== user.username) {
                notifications.push({
                    userId: admin.username,
                    message: `Repeat call: ${call.customerName} (${call.phone}) - ${call.category}`,
                    type: 'DUPLICATE_CALL',
                    callId: call.id
                });
            }
        });
        
        // Create all notifications
        if (notifications.length > 0) {
            await prisma.notification.createMany({ data: notifications });
        }
        
        res.json(updatedCall);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Create a new call
app.post('/calls', authMiddleware, async (req: Request, res: Response) => {
    const { 
        customerName, 
        phone, 
        email, 
        address, 
        problem, 
        category, 
        assignedTo, 
        createdBy
    } = req.body as any;

    if (!customerName || !phone || !problem || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Find or create customer by phone
        let customer = null;
        if (phone) {
            customer = await prisma.customer.findUnique({ 
                where: { phone } 
            });
            
            // Create customer if not found
            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        name: customerName,
                        phone,
                        email: email || null,
                        address: address || null,
                    }
                });
            }
        }

        const call = await prisma.call.create({
            data: {
                customerName,
                phone,
                email: email || null,
                address: address || null,
                problem,
                category,
                status: assignedTo ? 'ASSIGNED' : 'PENDING',
                assignedTo: assignedTo || null,
                createdBy: req.user?.username || createdBy || 'system',
                customerId: customer?.id || null,
            }
        });
        
        res.status(201).json(call);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to create call' });
    }
});

// Auth endpoints
app.post('/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // Try multiple comparison strategies
        let ok = false;
        let matchedBy = '';

        // 1. Try bcrypt
        try {
            ok = await bcrypt.compare(password, user.password);
            if (ok) matchedBy = 'bcrypt';
        } catch (e) {
            ok = false;
        }

        // 2. Try plaintext
        if (!ok && user.password === password) {
            ok = true;
            matchedBy = 'plaintext';
        }

        // 3. Try common hash formats
        const tryHexHash = (alg: 'sha256' | 'sha1' | 'md5') => {
            try {
                const h = crypto.createHash(alg).update(password, 'utf8').digest('hex');
                return h === user.password;
            } catch (e) {
                return false;
            }
        };

        if (!ok && typeof user.password === 'string') {
            if (user.password.length === 64 && tryHexHash('sha256')) {
                ok = true;
                matchedBy = 'sha256';
            } else if (user.password.length === 40 && tryHexHash('sha1')) {
                ok = true;
                matchedBy = 'sha1';
            } else if (user.password.length === 32 && tryHexHash('md5')) {
                ok = true;
                matchedBy = 'md5';
            }
        }

        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        // Migrate to bcrypt if needed
        if (matchedBy && matchedBy !== 'bcrypt') {
            try {
                const hashed = await bcrypt.hash(password, 10);
                await prisma.user.update({ 
                    where: { id: user.id }, 
                    data: { password: hashed } 
                });
                console.log(`Migrated password for user=${username} (was=${matchedBy}) to bcrypt`);
            } catch (e) {
                console.warn('Failed to migrate password to bcrypt for user=', username, String(e));
            }
        }

        const token = signToken({ 
            id: user.id, 
            username: user.username, 
            role: user.role 
        });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                createdAt: user.createdAt 
            } 
        });
    } catch (err: any) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await prisma.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("Shutting down...");
    await prisma.$disconnect();
    process.exit(0);
});

// Customers endpoints
app.get('/customers', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(customers);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/customers/phone/:phone', authMiddleware, async (req: Request, res: Response) => {
    const phone = req.params.phone;
    if (!phone) return res.status(400).json({ error: 'phone is required' });
    try {
        const customer = await prisma.customer.findUnique({ where: { phone: phone as string } });
        if (!customer) return res.status(404).json({ error: 'Not found' });
        res.json(customer);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Analytics endpoint
app.get('/analytics/engineers', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    try {
        const { days } = req.query;
        let dateFilter = {};
        
        if (days && days !== 'all') {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
            dateFilter = { assignedAt: { gte: daysAgo } };
        }
        
        const calls = await prisma.call.findMany({
            where: {
                assignedTo: { not: null },
                ...dateFilter
            }
        });
        
        // Group by engineer and calculate metrics
        const engineerStats = calls.reduce((acc: any, call) => {
            const engineer = call.assignedTo!;
            if (!acc[engineer]) {
                acc[engineer] = {
                    name: engineer,
                    totalAssigned: 0,
                    completed: 0,
                    pending: 0,
                    totalResolutionTime: 0,
                    completedCalls: []
                };
            }
            
            acc[engineer].totalAssigned++;
            
            if (call.status === 'COMPLETED') {
                acc[engineer].completed++;
                if (call.assignedAt && call.completedAt) {
                    const resolutionTime = new Date(call.completedAt).getTime() - new Date(call.assignedAt).getTime();
                    acc[engineer].totalResolutionTime += resolutionTime;
                    acc[engineer].completedCalls.push(resolutionTime);
                }
            } else {
                acc[engineer].pending++;
            }
            
            return acc;
        }, {});
        
        // Calculate final metrics
        const result = Object.values(engineerStats).map((stats: any) => ({
            name: stats.name,
            totalAssigned: stats.totalAssigned,
            completed: stats.completed,
            pending: stats.pending,
            completionRate: stats.totalAssigned > 0 ? Math.round((stats.completed / stats.totalAssigned) * 100) : 0,
            avgResolutionTime: stats.completedCalls.length > 0 
                ? Math.round(stats.totalResolutionTime / stats.completedCalls.length / (1000 * 60 * 60) * 10) / 10 
                : 0
        }));
        
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Notifications endpoints
app.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user?.username },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        
        res.json(notifications);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.put('/notifications/:id/read', authMiddleware, async (req: Request, res: Response) => {
    const notificationId = parseInt(req.params.id || '');
    
    try {
        await prisma.notification.update({
            where: { 
                id: notificationId,
                userId: req.user?.username
            },
            data: { isRead: true }
        });
        
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/notifications/unread-count', authMiddleware, async (req: Request, res: Response) => {
    try {
        const count = await prisma.notification.count({
            where: { 
                userId: req.user?.username,
                isRead: false
            }
        });
        
        res.json({ count });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Category endpoints
app.get('/categories', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/categories', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    try {
        const category = await prisma.category.create({
            data: { name: name.trim() }
        });
        
        res.status(201).json(category);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Category already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.put('/categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    const { name } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    try {
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { name: name.trim() }
        });
        
        res.json(category);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Category already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.delete('/categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    
    try {
        // Soft delete - deactivate instead of deleting
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { isActive: false }
        });
        
        res.json({ success: true, category });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});