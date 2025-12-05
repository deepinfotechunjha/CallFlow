import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from "express";

dotenv.config();

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
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    if (!role || !['HOST', 'ADMIN', 'USER'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    
    try {
        // Check HOST limit if promoting to HOST
        if (role === 'HOST') {
            const hostCount = await prisma.user.count({ where: { role: 'HOST' } });
            const currentUser = await prisma.user.findUnique({ where: { id: userId } });
            if (currentUser?.role !== 'HOST' && hostCount >= 3) {
                return res.status(400).json({ error: 'Maximum 3 HOSTs allowed' });
            }
        }
        
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, username: true, role: true, createdAt: true }
        });
        
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: String(err) });
    }
});

app.post("/users", authMiddleware, requireRole(['HOST']), async (req: Request, res: Response) => {
    const { username, password, role } = req.body as { username?: string; password?: string; role?: string };
    
    if (!username || !password || !role) {
        return res.status(400).json({ error: "username, password, and role are required" });
    }
    
    if (!['HOST', 'ADMIN', 'USER'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be HOST, ADMIN, or USER" });
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
        const user = await prisma.user.create({ 
            data: { username, password: hashed, role } 
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
        
        const calls = await prisma.call.findMany({ 
            where: whereClause
        });
        res.json(calls);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch calls' });
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

        const call = await prisma.call.update({
            where: { id: callId },
            data: {
                customerName,
                phone,
                email: email || null,
                address: address || null,
                problem,
                category,
                status,
                assignedTo: assignedTo || null,
            }
        });

        res.json(call);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update call' });
    }
});

// Assign call to worker
app.post('/calls/:id/assign', authMiddleware, requireRole(['HOST', 'ADMIN']), async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id);
    const { assignee } = req.body;
    
    if (!assignee) {
        return res.status(400).json({ error: 'Assignee is required' });
    }
    
    try {
        const call = await prisma.call.update({
            where: { id: callId },
            data: {
                assignedTo: assignee,
                assignedAt: new Date(),
                status: 'ASSIGNED'
            }
        });
        
        res.json(call);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to assign call' });
    }
});

// Complete a call
app.post('/calls/:id/complete', authMiddleware, async (req: Request, res: Response) => {
    const callId = parseInt(req.params.id);
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
                completedAt: new Date()
            }
        });
        
        res.json(updatedCall);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to complete call' });
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
        createdBy,
        status = 'PENDING'
    } = req.body as any;

    if (!customerName || !phone || !problem || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const call = await prisma.call.create({
            data: {
                customerName,
                phone,
                email: email || null,
                address: address || null,
                problem,
                category,
                status,
                assignedTo: assignedTo || null,
                createdBy: req.user?.username || createdBy || 'system',
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