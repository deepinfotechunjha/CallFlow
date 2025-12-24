import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from "express";

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                username: string;
                role: string;
            };
        }
    }
}

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
    };
}

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [process.env.FRONTEND_ORIGIN ?? 'https://call-manage.netlify.app', 'http://localhost:5173'],
        methods: ["GET", "POST"]
    }
});

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

// Helper function to clean up old notifications
const cleanupOldNotifications = async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: { lt: twentyFourHoursAgo }
            }
        });
        if (result.count > 0) {
            console.log(`Cleaned up ${result.count} old notifications`);
        }
    } catch (error) {
        console.error('Failed to cleanup old notifications:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupOldNotifications, 60 * 60 * 1000);

// WebSocket connection handling
const userSockets = new Map<number, string>();

// Helper function to emit to all connected clients
const emitToAll = (event: string, data: any) => {
    io.emit(event, data);
};

// Simple auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const auth = req.headers['authorization'] as string | undefined;
        if (!auth) {
            console.log('Missing Authorization header');
            return res.status(401).json({ error: 'Missing Authorization header' });
        }
        const parts = auth.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.log('Invalid Authorization format:', auth);
            return res.status(401).json({ error: 'Invalid Authorization format' });
        }
        const token = parts[1];
        if (!token) {
            console.log('Missing token');
            return res.status(401).json({ error: 'Missing token' });
        }
        const payload = verifyToken(token as string);
        if (!payload) {
            console.log('Invalid token:', token.substring(0, 20) + '...');
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = payload;
        next();
    } catch (err: any) {
        console.log('Authentication error:', err.message);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

// Role-based authorization middleware
function requireRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            next();
        } catch (err: any) {
            res.status(403).json({ error: 'Authorization failed' });
        }
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

// Auth endpoints
app.post('/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        let ok = false;
        try {
            ok = await bcrypt.compare(password, user.password);
        } catch (e) {
            ok = false;
        }

        if (!ok && user.password === password) {
            ok = true;
        }

        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

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
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/auth/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({ 
            where: { id: req.user?.id },
            select: { id: true, username: true, role: true, createdAt: true }
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

app.post("/auth/verify-secret", authMiddleware, async (req: Request, res: Response) => {
    const { secretPassword } = req.body as { secretPassword: string };
    const user = req.user;
    
    if (!secretPassword) {
        return res.status(400).json({ error: 'Secret password is required' });
    }
    
    if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
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
app.get("/users", authMiddleware, requireRole(['HOST', 'ADMIN']), async (_req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({ 
            select: { id: true, username: true, role: true, createdAt: true } 
        });
        res.json(users);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post("/users", authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const { username, password, role, secretPassword } = req.body as { username: string; password: string; role: string; secretPassword?: string };
    
    if (!username || !password || !role) {
        return res.status(400).json({ error: "username, password, and role are required" });
    }
    
    if (!['HOST', 'ADMIN', 'ENGINEER'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be HOST, ADMIN, or ENGINEER" });
    }
    
    try {
        const hashed = await bcrypt.hash(password, 10);
        const finalSecretPassword = role === 'HOST' ? (secretPassword || 'DEFAULTSECRET') : 'DEFAULTSECRET';
        
        const user = await prisma.user.create({ 
            data: { username, password: hashed, role, secretPassword: finalSecretPassword } 
        });
        
        const userResponse = { 
            id: user.id, 
            username: user.username, 
            role: user.role, 
            createdAt: user.createdAt 
        };
        
        emitToAll('user_created', userResponse);
        res.status(201).json(userResponse);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.put("/users/:id", authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id || '');
    const { username, password, role, secretPassword } = req.body as {
        username?: string;
        password?: string;
        role?: string;
        secretPassword?: string;
    };
    
    try {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const updateData: any = {};
        
        if (username && username !== currentUser.username) {
            updateData.username = username;
        }
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        if (role && ['HOST', 'ADMIN', 'ENGINEER'].includes(role)) {
            updateData.role = role;
            
            if (role === 'HOST' && currentUser.role !== 'HOST') {
                updateData.secretPassword = secretPassword;
            } else if (role !== 'HOST' && currentUser.role === 'HOST') {
                updateData.secretPassword = 'DEFAULTSECRET';
            }
        }
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, username: true, role: true, createdAt: true }
        });
        
        // Force logout the updated user via WebSocket
        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(socketId).emit('force_logout', { message: 'Your account has been updated. Please log in again.' });
        }
        
        emitToAll('user_updated', user);
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
        
        // Unassign all calls assigned to this user
        const callsToUnassign = await prisma.call.findMany({
            where: { assignedTo: currentUser.username }
        });
        
        await prisma.call.updateMany({
            where: { assignedTo: currentUser.username },
            data: { 
                assignedTo: null, 
                status: 'PENDING',
                assignedAt: null,
                assignedBy: null,
                engineerRemark: null
            }
        });
        
        // Emit individual call updates for each unassigned call
        for (const call of callsToUnassign) {
            const updatedCall = {
                ...call,
                assignedTo: null,
                status: 'PENDING',
                assignedAt: null,
                assignedBy: null,
                engineerRemark: null
            };
            emitToAll('call_updated', updatedCall);
        }
        
        // Force logout the user before deletion via WebSocket
        const socketId = userSockets.get(userId);
        if (socketId) {
            io.to(socketId).emit('force_logout', { message: 'Your account has been removed by an administrator.' });
        }
        
        await prisma.user.delete({ where: { id: userId } });
        emitToAll('user_deleted_broadcast', { id: userId, username: currentUser.username });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Call endpoints
app.get('/calls', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userRole = req.user?.role;
        const username = req.user?.username;
        
        let whereClause = {};
        if (userRole === 'ENGINEER') {
            whereClause = {
                OR: [
                    { createdBy: username },
                    { assignedTo: username }
                ]
            };
        }
        
        const findArgs: any = {};
        if (Object.keys(whereClause).length > 0) findArgs.where = whereClause;
        const calls = await prisma.call.findMany(findArgs);
        res.json(calls);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch calls', details: String(err) });
    }
});

app.post('/calls', authMiddleware, async (req: Request, res: Response) => {
    const { customerName, phone, email, address, problem, category, assignedTo, engineerRemark, createdBy } = req.body as {
        customerName: string;
        phone: string;
        email?: string;
        address?: string;
        problem: string;
        category: string;
        assignedTo?: string;
        engineerRemark?: string;
        createdBy?: string;
    };

    if (!customerName || !phone || !problem || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        let customer = null;
        if (phone) {
            customer = await prisma.customer.findUnique({ where: { phone } });
            
            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        name: customerName,
                        phone,
                        email: email || null,
                        address: address || null,
                        outsideCalls: 0,
                        carryInServices: 0,
                        totalInteractions: 0
                    }
                });
            }
        }

        const [call] = await prisma.$transaction([
            prisma.call.create({
                data: {
                    customerName,
                    phone,
                    email: email || null,
                    address: address || null,
                    problem,
                    category,
                    status: assignedTo ? 'ASSIGNED' : 'PENDING',
                    assignedTo: assignedTo || null,
                    assignedAt: assignedTo ? new Date() : null,
                    assignedBy: assignedTo ? (req.user?.username || 'system') : null,
                    engineerRemark: engineerRemark || null,
                    createdBy: req.user?.username || createdBy || 'system',
                    customerId: customer?.id || null,
                }
            }),
            customer ? prisma.customer.update({
                where: { id: customer.id },
                data: {
                    outsideCalls: { increment: 1 },
                    totalInteractions: { increment: 1 },
                    lastCallDate: new Date(),
                    lastActivityDate: new Date()
                }
            }) : prisma.$queryRaw`SELECT 1`
        ]);
        
        emitToAll('call_created', call);
        res.status(201).json(call);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to create call' });
    }
});

app.put('/calls/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    if (isNaN(callId)) {
        return res.status(400).json({ error: 'Invalid call ID' });
    }

    try {
        const existingCall = await prisma.call.findUnique({ where: { id: callId } });
        if (!existingCall) {
            return res.status(404).json({ error: 'Call not found' });
        }
        if (existingCall.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot edit completed calls' });
        }

        const { problem, category, status, assignedTo, customerName, phone, email, address } = req.body as {
            problem: string;
            category: string;
            status?: string;
            assignedTo?: string;
            customerName: string;
            phone: string;
            email?: string;
            address?: string;
        };

        const updateData: any = {
            customerName,
            phone,
            email: email || null,
            address: address || null,
            problem,
            category,
            status: assignedTo !== undefined && assignedTo ? 'ASSIGNED' : (assignedTo === null || assignedTo === '' ? 'PENDING' : status),
        };
        
        if (assignedTo !== undefined) {
            updateData.assignedTo = assignedTo || null;
        }

        const call = await prisma.call.update({
            where: { id: callId },
            data: updateData
        });
        
        emitToAll('call_updated', call);
        res.json(call);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update call' });
    }
});

app.post('/calls/:id/assign', authMiddleware, requireRole(['HOST', 'ADMIN']), async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    const { assignee, engineerRemark } = req.body as { assignee: string; engineerRemark?: string };
    
    if (!assignee) {
        return res.status(400).json({ error: 'Assignee is required' });
    }
    
    try {
        const existingCall = await prisma.call.findUnique({ where: { id: callId } });
        
        if (!existingCall) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        if (existingCall.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Cannot assign a completed call' });
        }

        const updateData = {
            assignedTo: assignee,
            assignedAt: new Date(),
            assignedBy: req.user?.username || 'system',
            status: 'ASSIGNED',
            engineerRemark: engineerRemark || null
        };

        const call = await prisma.call.update({
            where: { id: callId },
            data: updateData,
            include: { customer: true }
        });
        
        emitToAll('call_assigned', call);
        res.json(call);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to assign call' });
    }
});

app.post('/calls/:id/complete', authMiddleware, async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id || '');
    const { remark, engineerRemark } = req.body as { remark?: string; engineerRemark?: string };
    const user = req.user;
    
    try {
        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }
        
        const canComplete = call.assignedTo === user?.username || ['HOST', 'ADMIN'].includes(user?.role || '');
        if (!canComplete) {
            return res.status(403).json({ error: 'Cannot complete this call' });
        }
        
        const updatedCall = await prisma.call.update({
            where: { id: callId },
            data: {
                status: 'COMPLETED',
                completedBy: user?.username || 'system',
                completedAt: new Date(),
                remark: remark || null,
                engineerRemark: engineerRemark !== undefined ? engineerRemark : call.engineerRemark
            },
            include: { customer: true }
        });
        
        emitToAll('call_completed', updatedCall);
        res.json(updatedCall);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to complete call' });
    }
});

// Check for duplicate calls
app.post('/calls/check-duplicate', authMiddleware, async (req: Request, res: Response) => {
    const { phone, category } = req.body as { phone: string; category: string };
    
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
        
        emitToAll('call_updated', updatedCall);
        
        // Create notifications only if the call is assigned or has a creator
        const notifications = [];
        
        // Notify original creator if different from current user
        if (call.createdBy && call.createdBy !== user?.username) {
            notifications.push({
                userId: call.createdBy,
                message: `Customer: ${call.customerName} (${call.phone}) called again about: ${call.category}`,
                type: 'DUPLICATE_CALL',
                callId: call.id
            });
        }
        
        // Notify assigned engineer if different from current user and call is assigned
        if (call.assignedTo && call.assignedTo !== user?.username) {
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
            if (admin.username !== user?.username) {
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
            const createdNotifications = await prisma.notification.createMany({ data: notifications });
            // Emit notification events to specific users
            notifications.forEach(notification => {
                emitToAll('notification_created', notification);
            });
        }
        
        res.json(updatedCall);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
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

app.get('/carry-in-customers/phone/:phone', authMiddleware, async (req: Request, res: Response) => {
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

app.get('/customers/analytics', authMiddleware, requireRole(['HOST']), async (_req: Request, res: Response) => {
    try {
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
                outsideCalls: true,
                carryInServices: true,
                totalInteractions: true,
                lastCallDate: true,
                lastServiceDate: true,
                lastActivityDate: true,
                createdAt: true
            },
            orderBy: { lastActivityDate: 'desc' }
        });
        res.json(customers);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/customers/directory', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
                outsideCalls: true,
                carryInServices: true,
                totalInteractions: true,
                lastActivityDate: true,
                createdAt: true
            },
            orderBy: { lastActivityDate: 'desc' }
        });
        res.json(customers);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Analytics endpoints
app.get('/analytics/engineers', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const days = req.query.days as string;
    
    try {
        let dateFilter = {};
        if (days && days !== 'all') {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - parseInt(days));
            dateFilter = { createdAt: { gte: daysAgo } };
        }
        
        const users = await prisma.user.findMany({
            where: { role: { in: ['ENGINEER', 'ADMIN'] } },
            select: { username: true }
        });
        
        const analytics = await Promise.all(users.map(async (user) => {
            const totalAssigned = await prisma.call.count({
                where: { 
                    assignedTo: user.username,
                    ...dateFilter
                }
            });
            
            const completed = await prisma.call.count({
                where: { 
                    assignedTo: user.username,
                    status: 'COMPLETED',
                    ...dateFilter
                }
            });
            
            const pending = totalAssigned - completed;
            const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
            
            const completedCalls = await prisma.call.findMany({
                where: {
                    assignedTo: user.username,
                    status: 'COMPLETED',
                    assignedAt: { not: null },
                    completedAt: { not: null },
                    ...dateFilter
                },
                select: { assignedAt: true, completedAt: true }
            });
            
            let avgResolutionTime = 0;
            if (completedCalls.length > 0) {
                const totalTime = completedCalls.reduce((sum, call) => {
                    if (call.assignedAt && call.completedAt) {
                        return sum + (new Date(call.completedAt).getTime() - new Date(call.assignedAt).getTime());
                    }
                    return sum;
                }, 0);
                avgResolutionTime = totalTime / completedCalls.length / (1000 * 60 * 60); // Convert to hours
            }
            
            return {
                name: user.username,
                totalAssigned,
                completed,
                pending,
                completionRate,
                avgResolutionTime
            };
        }));
        
        res.json(analytics);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Notifications endpoints
app.get('/notifications', authMiddleware, async (req: Request, res: Response) => {
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        // Auto-delete notifications older than 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await prisma.notification.deleteMany({
            where: {
                createdAt: { lt: twentyFourHoursAgo }
            }
        });
        
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.username },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.get('/notifications/unread-count', authMiddleware, async (req: Request, res: Response) => {
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        // Auto-delete notifications older than 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await prisma.notification.deleteMany({
            where: {
                createdAt: { lt: twentyFourHoursAgo }
            }
        });
        
        const count = await prisma.notification.count({
            where: { 
                userId: req.user.username,
                isRead: false
            }
        });
        res.json({ count });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.put('/notifications/:id/read', authMiddleware, async (req: Request, res: Response) => {
    const notificationId = parseInt(req.params.id || '');
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        await prisma.notification.update({
            where: { 
                id: notificationId,
                userId: req.user.username
            },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.delete('/notifications/:id', authMiddleware, async (req: Request, res: Response) => {
    const notificationId = parseInt(req.params.id || '');
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        await prisma.notification.delete({
            where: { 
                id: notificationId,
                userId: req.user.username
            }
        });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Bulk delete notifications
app.delete('/notifications/bulk', authMiddleware, async (req: Request, res: Response) => {
    const { notificationIds } = req.body as { notificationIds: number[] };
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({ error: 'Invalid notification IDs' });
    }
    
    try {
        await prisma.notification.deleteMany({
            where: { 
                id: { in: notificationIds },
                userId: req.user.username
            }
        });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Categories endpoints
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
    const { name } = req.body as { name: string };
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    try {
        // Check if a category with this name already exists (including inactive ones)
        const existingCategory = await prisma.category.findUnique({
            where: { name: name.trim() }
        });
        
        if (existingCategory) {
            if (existingCategory.isActive) {
                return res.status(400).json({ error: 'Category already exists' });
            } else {
                // Reactivate the existing category
                const category = await prisma.category.update({
                    where: { id: existingCategory.id },
                    data: { isActive: true }
                });
                emitToAll('category_created', category);
                return res.status(201).json(category);
            }
        }
        
        // Create new category if none exists
        const category = await prisma.category.create({
            data: { name: name.trim() }
        });
        
        emitToAll('category_created', category);
        res.status(201).json(category);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.put('/categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    const { name } = req.body as { name: string };
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
    }
    
    try {
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { name: name.trim() }
        });
        
        emitToAll('category_updated', category);
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
        const category = await prisma.category.update({
            where: { id: categoryId },
            data: { isActive: false }
        });
        
        emitToAll('category_deleted', { id: categoryId });
        res.json({ success: true, category });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// Service Categories endpoints
app.get('/service-categories', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.serviceCategory.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/service-categories', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const { name } = req.body as { name: string };
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Service category name is required' });
    }
    
    try {
        const category = await prisma.serviceCategory.create({
            data: { name: name.trim() }
        });
        
        emitToAll('service_category_created', category);
        res.status(201).json(category);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Service category already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.put('/service-categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    const { name } = req.body as { name: string };
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Service category name is required' });
    }
    
    try {
        const category = await prisma.serviceCategory.update({
            where: { id: categoryId },
            data: { name: name.trim() }
        });
        
        emitToAll('service_category_updated', category);
        res.json(category);
    } catch (err: any) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Service category already exists' });
        }
        res.status(500).json({ error: String(err) });
    }
});

app.delete('/service-categories/:id', authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.id || '');
    
    try {
        const category = await prisma.serviceCategory.update({
            where: { id: categoryId },
            data: { isActive: false }
        });
        
        emitToAll('service_category_deleted', { id: categoryId });
        res.json({ success: true, category });
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// CarryInService endpoints
app.get('/carry-in-services', authMiddleware, async (_req: Request, res: Response) => {
    try {
        const services = await prisma.carryInService.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(services);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/carry-in-services', authMiddleware, async (req: Request, res: Response) => {
    const { customerName, phone, email, address, category, serviceDescription } = req.body as {
        customerName: string;
        phone: string;
        email?: string;
        address?: string;
        category: string;
        serviceDescription?: string;
    };
    
    if (!customerName || !phone || !category) {
        return res.status(400).json({ error: 'Customer name, phone, and category are required' });
    }
    
    try {
        let customer = await prisma.customer.findUnique({ where: { phone } });
        if (!customer) {
            customer = await prisma.customer.create({
                data: { 
                    name: customerName, 
                    phone, 
                    email: email || null, 
                    address: address || null,
                    outsideCalls: 0,
                    carryInServices: 0,
                    totalInteractions: 0
                }
            });
        }
        
        const [service] = await prisma.$transaction([
            prisma.carryInService.create({
                data: {
                    customerName,
                    phone,
                    email: email || null,
                    address: address || null,
                    category,
                    serviceDescription: serviceDescription || null,
                    customerId: customer.id,
                    createdBy: req.user?.username || 'system'
                }
            }),
            prisma.customer.update({
                where: { id: customer.id },
                data: {
                    carryInServices: { increment: 1 },
                    totalInteractions: { increment: 1 },
                    lastServiceDate: new Date(),
                    lastActivityDate: new Date()
                }
            })
        ]);
        
        emitToAll('service_created', service);
        res.status(201).json(service);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/carry-in-services/:id/complete', authMiddleware, async (req: Request, res: Response) => {
    const serviceId = parseInt(req.params.id || '');
    const { completeRemark } = req.body as { completeRemark?: string };
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        const service = await prisma.carryInService.update({
            where: { id: serviceId },
            data: {
                status: 'COMPLETED_NOT_COLLECTED',
                completedBy: req.user.username,
                completedAt: new Date(),
                completeRemark: completeRemark || null
            }
        });
        
        emitToAll('service_updated', service);
        res.json(service);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post('/carry-in-services/:id/deliver', authMiddleware, async (req: Request, res: Response) => {
    const serviceId = parseInt(req.params.id || '');
    const { deliverRemark } = req.body as { deliverRemark?: string };
    
    if (!req.user?.username) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
        const service = await prisma.carryInService.update({
            where: { id: serviceId },
            data: {
                status: 'COMPLETED_AND_COLLECTED',
                deliveredBy: req.user.username,
                deliveredAt: new Date(),
                deliverRemark: deliverRemark || null
            }
        });
        
        emitToAll('service_updated', service);
        res.json(service);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

// WebSocket setup
io.on('connection', (socket) => {
    socket.on('register', (userId: number) => {
        userSockets.set(userId, socket.id);
    });
    
    socket.on('disconnect', () => {
        for (const [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                break;
            }
        }
    });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});