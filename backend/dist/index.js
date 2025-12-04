import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
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
// simple auth middleware
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
function applyPrismaSchema() {
    try {
        const shell = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "/bin/sh";
        execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", shell });
        return true;
    }
    catch (err) {
        console.error("Prisma db push failed:", String(err));
        return false;
    }
}
let dbAvailable = true;
app.get("/health", async (_req, res) => {
    try {
        if (!dbAvailable)
            return res.status(503).json({ status: 'unavailable' });
        await prisma.$queryRaw `SELECT 1`;
        res.json({ status: "ok" });
    }
    catch (err) {
        res.status(500).json({ status: "error", error: String(err) });
    }
});
// Basic user endpoints (minimal)
app.get("/users", authMiddleware, async (_req, res) => {
    try {
        if (!dbAvailable)
            return res.status(503).json({ error: 'database unavailable' });
        const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, createdAt: true } });
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
        if (!dbAvailable)
            return res.status(503).json({ error: 'database unavailable' });
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { username, password: hashed, role: role ?? 'USER' } });
        res.status(201).json({ id: user.id, username: user.username, role: user.role, createdAt: user.createdAt });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.put('/users/:id', authMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const { role } = req.body;
    if (!role)
        return res.status(400).json({ error: 'role required' });
    try {
        if (!dbAvailable)
            return res.status(503).json({ error: 'database unavailable' });
        const actorRole = req.user?.role;
        // only HOST can set role to HOST
        if (role === 'HOST' && actorRole !== 'HOST')
            return res.status(403).json({ error: 'forbidden' });
        if (!(actorRole === 'HOST' || actorRole === 'ADMIN'))
            return res.status(403).json({ error: 'forbidden' });
        const user = await prisma.user.update({ where: { id }, data: { role } });
        res.json({ id: user.id, username: user.username, role: user.role, createdAt: user.createdAt });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// Simple auth (plain password check) - replace with proper auth in production
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'username and password required' });
    try {
        if (!dbAvailable)
            return res.status(503).json({ error: 'database unavailable' });
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user)
            return res.status(401).json({ error: 'invalid credentials' });
        // Try multiple comparison strategies to support legacy hashes stored in DB
        let ok = false;
        let matchedBy = null;
        // 1) bcrypt (preferred)
        try {
            ok = await bcrypt.compare(password, user.password);
            if (ok)
                matchedBy = 'bcrypt';
        }
        catch (e) {
            ok = false;
        }
        // 2) direct plaintext equality
        if (!ok && user.password === password) {
            ok = true;
            matchedBy = 'plaintext';
        }
        // 3) common hex/hash formats: sha256, sha1, md5
        const tryHexHash = (alg) => {
            try {
                const h = crypto.createHash(alg).update(password, 'utf8').digest('hex');
                return h === user.password;
            }
            catch (e) {
                return false;
            }
        };
        if (!ok) {
            if (typeof user.password === 'string') {
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
        }
        if (!ok)
            return res.status(401).json({ error: 'invalid credentials' });
        // If matched by a non-bcrypt method, migrate to bcrypt for future logins
        if (matchedBy && matchedBy !== 'bcrypt') {
            try {
                const hashed = await bcrypt.hash(password, 10);
                await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
                console.log(`Migrated password for user=${username} (was=${matchedBy}) to bcrypt`);
            }
            catch (e) {
                console.warn('Failed to migrate password to bcrypt for user=', username, String(e));
            }
        }
        const token = signToken({ id: user.id, username: user.username, role: user.role });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, createdAt: user.createdAt } });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// Basic customer endpoints (minimal)
app.get("/customers", async (_req, res) => {
    const customers = await prisma.customer.findMany();
    res.json(customers);
});
// Search customer by phone or email (used by frontend)
app.get('/customers/search', async (req, res) => {
    const phone = String(req.query.phone || '');
    const email = String(req.query.email || '');
    try {
        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    phone ? { phone } : undefined,
                    email ? { email } : undefined,
                ].filter(Boolean),
            },
        });
        if (!customer)
            return res.status(404).json(null);
        res.json(customer);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// Upsert customer from frontend (name, phone, email, address)
app.post('/customers', async (req, res) => {
    const { name, phone, email, address } = req.body;
    if (!name || !phone)
        return res.status(400).json({ error: 'name and phone required' });
    try {
        const customer = await prisma.customer.upsert({
            where: { phone },
            update: { name, email: email ?? null, address: address ?? null },
            create: { name, phone, email: email ?? null, address: address ?? null },
        });
        res.status(200).json(customer);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// Calls endpoints
app.post('/calls', async (req, res) => {
    const { customerName, phone, email, address, problem, category, assignedTo, createdBy: createdByFromBody, status } = req.body;
    // try to read authenticated user from Authorization header if present
    let authUser = undefined;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) {
            const payload = verifyToken(parts[1]);
            if (payload && payload.username)
                authUser = payload.username;
        }
    }
    const createdBy = authUser ?? createdByFromBody;
    if (!customerName || !phone || !problem || !category || !createdBy || !status)
        return res.status(400).json({ error: 'missing required call fields' });
    try {
        // ensure customer exists/upsert
        const customer = await prisma.customer.upsert({
            where: { phone },
            update: { name: customerName, email, address },
            create: { name: customerName, phone, email, address },
        });
        const call = await prisma.call.create({
            data: {
                problem,
                category,
                status,
                assignedTo: assignedTo || null,
                createdBy,
                customer: { connect: { id: customer.id } },
            },
        });
        res.status(201).json(call);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// Assign a call to a worker - only ADMIN or HOST can do this
app.post('/calls/:id/assign', authMiddleware, async (req, res) => {
    const callId = Number(req.params.id);
    const { assignee } = req.body;
    const actor = req.user?.username;
    const actorRole = req.user?.role;
    if (!assignee)
        return res.status(400).json({ error: 'assignee required' });
    try {
        if (!dbAvailable)
            return res.status(503).json({ error: 'database unavailable' });
        if (!actor)
            return res.status(401).json({ error: 'unauthenticated' });
        if (!(actorRole === 'HOST' || actorRole === 'ADMIN'))
            return res.status(403).json({ error: 'forbidden' });
        const call = await prisma.call.update({ where: { id: callId }, data: { assignedTo: assignee, assignedAt: new Date() } });
        res.json(call);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
// Mark a call as completed - allowed by the assignee or HOST/ADMIN
app.post('/calls/:id/complete', authMiddleware, async (req, res) => {
    const callId = Number(req.params.id);
    const actor = req.user?.username;
    const actorRole = req.user?.role;
    if (!actor)
        return res.status(401).json({ error: 'unauthenticated' });
    try {
        if (!dbAvailable)
            return res.status(503).json({ error: 'database unavailable' });
        const call = await prisma.call.findUnique({ where: { id: callId } });
        if (!call)
            return res.status(404).json({ error: 'call not found' });
        // allow if actor is assignee or actor is ADMIN/HOST
        if (call.assignedTo && call.assignedTo !== actor && !(actorRole === 'HOST' || actorRole === 'ADMIN'))
            return res.status(403).json({ error: 'forbidden' });
        const updated = await prisma.call.update({ where: { id: callId }, data: { status: 'COMPLETED', completedBy: actor, completedAt: new Date() } });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.get('/calls', async (_req, res) => {
    try {
        const calls = await prisma.call.findMany({ include: { customer: true } });
        res.json(calls);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
app.put('/calls/:id', async (req, res) => {
    const id = Number(req.params.id);
    const updates = req.body;
    try {
        const call = await prisma.call.update({ where: { id }, data: updates });
        res.json(call);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
async function main() {
    if (!process.env.DATABASE_URL) {
        console.warn("Warning: DATABASE_URL not set. Set it in .env for Prisma to connect.");
    }
    // Only run prisma db push when explicitly requested (avoid side-effects on npm run dev)
    if (process.env.RUN_PRISMA_PUSH === 'true') {
        const ok = applyPrismaSchema();
        if (!ok) {
            console.warn('Prisma db push failed. The API will run but DB operations will return 503 until DB is available.');
            dbAvailable = false;
        }
    }
    try {
        await prisma.$connect();
    }
    catch (err) {
        dbAvailable = false;
        console.warn('Prisma $connect failed — database not available. API will run but DB operations will return 503 until DB is available.');
        console.warn(String(err));
    }
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
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
