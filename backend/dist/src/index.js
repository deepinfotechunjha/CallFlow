import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
dotenv.config();
const prisma = new PrismaClient();
const app = express();
app.use(express.json());
const allowedOrigins = [process.env.FRONTEND_ORIGIN ?? 'https://call-manage.netlify.app', 'http://localhost:5173'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE"]
}));
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (err) {
        return null;
    }
}
// Simple auth middleware
function authMiddleware(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth)
        return res.status(401).json({ error: 'Missing Authorization header' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
        return res.status(401).json({ error: 'Invalid Authorization format' });
    const token = parts[1];
    if (!token)
        return res.status(401).json({ error: 'Missing token' });
    const payload = verifyToken(token);
    if (!payload)
        return res.status(401).json({ error: 'Invalid token' });
    req.user = payload;
    next();
}
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
// Health check endpoint
app.get("/health", async (_req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ok" });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: String(err) });
    }
});
// User endpoints
app.get("/users", authMiddleware, async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, role: true, createdAt: true }
        });
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.post("/users", async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: "username and password required" });
    try {
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                username,
                password: hashed,
                role: role ?? 'USER'
            }
        });
        res.status(201).json({
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt
        });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// Customer endpoints
app.get("/customers", async (_req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { calls: { orderBy: { createdAt: 'desc' } } }
        });
        res.json(customers);
    }
    catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});
app.get("/customers/search", async (req, res) => {
    try {
        const phone = String(req.query.phone || '');
        const email = String(req.query.email || '');
        if (!phone && !email) {
            return res.status(400).json({ error: 'Either phone or email is required' });
        }
        const where = {
            OR: [
                phone ? { phone } : undefined,
                email ? { email } : undefined,
            ].filter(Boolean)
        };
        const customer = await prisma.customer.findFirst({
            where,
            include: { calls: { orderBy: { createdAt: 'desc' } } }
        });
        if (!customer)
            return res.status(404).json(null);
        res.json(customer);
    }
    catch (err) {
        console.error('Error searching customer:', err);
        res.status(500).json({ error: 'Failed to search customer' });
    }
});
app.post('/customers', async (req, res) => {
    const { name, phone, email, address } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
    }
    try {
        console.log('Creating/updating customer with:', { name, phone, email, address });
        const updateData = { name };
        const createData = { name, phone };
        if (email !== undefined) {
            updateData.email = email;
            createData.email = email;
        }
        if (address !== undefined) {
            updateData.address = address;
            createData.address = address;
        }
        const customer = await prisma.customer.upsert({
            where: { phone },
            update: updateData,
            create: createData,
        });
        console.log('Customer processed successfully:', customer);
        res.json(customer);
    }
    catch (err) {
        console.error('Error in customer upsert:', {
            message: err.message,
            stack: err.stack,
            code: err.code,
            meta: err.meta
        });
        res.status(500).json({
            error: 'Failed to process customer',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});
// Call endpoints
app.get('/calls', async (_req, res) => {
    try {
        const calls = await prisma.call.findMany({
            include: { customer: true }
        });
        res.json(calls);
    }
    catch (err) {
        console.error('Error fetching calls:', err);
        res.status(500).json({ error: 'Failed to fetch calls' });
    }
});
app.post('/calls', async (req, res) => {
    console.log('Received call creation request:', JSON.stringify(req.body, null, 2));
    const { customerName, phone, email, address, problem, category, assignedTo, createdBy, status = 'PENDING' } = req.body;
    // Validate required fields
    if (!customerName || !phone || !problem || !category) {
        const error = {
            error: 'Missing required fields',
            missing: [],
            received: { customerName, phone, problem, category }
        };
        if (!customerName)
            error.missing.push('customerName');
        if (!phone)
            error.missing.push('phone');
        if (!problem)
            error.missing.push('problem');
        if (!category)
            error.missing.push('category');
        console.error('Validation error:', error);
        return res.status(400).json(error);
    }
    try {
        console.log('Processing customer upsert for phone:', phone);
        // Prepare customer data
        const customerData = {
            name: customerName,
            phone,
            ...(email && { email }),
            ...(address && { address })
        };
        console.log('Customer data to upsert:', customerData);
        // Ensure customer exists/upsert
        const customer = await prisma.customer.upsert({
            where: { phone },
            update: customerData,
            create: customerData,
            select: { id: true, name: true, phone: true }
        });
        console.log('Customer processed:', customer);
        // Prepare call data
        const callData = {
            problem,
            category,
            status,
            assignedTo: assignedTo || null,
            createdBy: createdBy || 'system',
            customer: { connect: { id: customer.id } },
        };
        console.log('Creating call with data:', callData);
        const call = await prisma.call.create({
            data: callData,
            include: { customer: true }
        });
        console.log('Call created successfully:', call);
        res.status(201).json(call);
    }
    catch (err) {
        console.error('Error in /calls endpoint:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack
        });
        res.status(500).json({
            error: 'Failed to create call',
            ...(process.env.NODE_ENV === 'development' && {
                details: err.message,
                code: err.code,
                meta: err.meta
            })
        });
    }
});
// Auth endpoints
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        // Try multiple comparison strategies
        let ok = false;
        let matchedBy = '';
        // 1. Try bcrypt
        try {
            ok = await bcrypt.compare(password, user.password);
            if (ok)
                matchedBy = 'bcrypt';
        }
        catch (e) {
            ok = false;
        }
        // 2. Try plaintext
        if (!ok && user.password === password) {
            ok = true;
            matchedBy = 'plaintext';
        }
        // 3. Try common hash formats
        const tryHexHash = (alg) => {
            try {
                const h = crypto.createHash(alg).update(password, 'utf8').digest('hex');
                return h === user.password;
            }
            catch (e) {
                return false;
            }
        };
        if (!ok && typeof user.password === 'string') {
            if (user.password.length === 64 && tryHexHash('sha256')) {
                ok = true;
                matchedBy = 'sha256';
            }
            else if (user.password.length === 40 && tryHexHash('sha1')) {
                ok = true;
                matchedBy = 'sha1';
            }
            else if (user.password.length === 32 && tryHexHash('md5')) {
                ok = true;
                matchedBy = 'md5';
            }
        }
        if (!ok)
            return res.status(401).json({ error: 'Invalid credentials' });
        // Migrate to bcrypt if needed
        if (matchedBy && matchedBy !== 'bcrypt') {
            try {
                const hashed = await bcrypt.hash(password, 10);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { password: hashed }
                });
                console.log(`Migrated password for user=${username} (was=${matchedBy}) to bcrypt`);
            }
            catch (e) {
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
    }
    catch (err) {
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
//# sourceMappingURL=index.js.map