import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  ADMIN_PHONE,
  LIFETIME_FEE_VND,
  PAYMENT_ACCOUNT_HOLDER,
  PAYMENT_ACCOUNT_NUMBER,
  PAYMENT_BANK,
  hashPassword,
  normalizePhone,
  readDb,
  sanitizeUser,
  signAuthToken,
  verifyAuthToken,
  verifyPassword,
  writeDb,
} from './server/db.ts';
import type { StoredUser } from './server/db.ts';

interface AuthedRequest extends Request {
  authUser?: StoredUser;
}

function attachUser(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  const verified = verifyAuthToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === verified.sub);
  if (!user) {
    res.status(401).json({ error: 'Account not found' });
    return;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ error: 'Account is suspended. Contact Admin.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser || req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Admin privileges required' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support Capacitor Android WebView and cross-origin mobile builds
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '256kb' }));

  // Initialize DB on boot
  readDb();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'MathSpark Kids' });
  });

  app.get('/api/payment/info', (_req, res) => {
    res.json({
      lifetimeFeeVnd: LIFETIME_FEE_VND,
      bank: PAYMENT_BANK,
      accountNumber: PAYMENT_ACCOUNT_NUMBER,
      accountHolder: PAYMENT_ACCOUNT_HOLDER,
      currency: 'VND',
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const password = String(req.body?.password ?? '');

    if (!phone || phone.length < 8) {
      res.status(400).json({ code: 'INVALID_INPUT', error: 'Vui lòng nhập số điện thoại hợp lệ.' });
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.phone === phone);

    if (!user) {
      res.status(404).json({
        code: 'ACCOUNT_NOT_FOUND',
        error: 'Số điện thoại này chưa có tài khoản VIP. Vui lòng thanh toán 15.000 VNĐ để kích hoạt.',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        code: 'ACCOUNT_SUSPENDED',
        error: 'Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Admin.',
      });
      return;
    }

    const requiresPassword = user.role !== 'admin' || Boolean(user.customPasswordSet);
    if (requiresPassword && (!password || !verifyPassword(password, user.passwordHash))) {
      res.status(401).json({
        code: 'INVALID_PASSWORD',
        error: 'Mật khẩu chưa chính xác. Vui lòng kiểm tra lại.',
      });
      return;
    }

    user.lastLoginAt = new Date().toISOString();
    writeDb(db);

    const token = signAuthToken(user.id, user.role);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.get('/api/auth/me', attachUser, (req: AuthedRequest, res) => {
    res.json({ user: sanitizeUser(req.authUser!) });
  });

  app.post('/api/payment/notify', (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const studentName = String(req.body?.studentName ?? '').trim().slice(0, 80);
    const note = String(req.body?.note ?? '').trim().slice(0, 160);

    if (!phone || phone.length < 8 || phone.length > 15) {
      res.status(400).json({ error: 'Vui lòng nhập số điện thoại hợp lệ.' });
      return;
    }
    if (!studentName) {
      res.status(400).json({ error: 'Vui lòng nhập tên học sinh hoặc phụ huynh.' });
      return;
    }

    const db = readDb();
    const entry = {
      id: `pay_${crypto.randomUUID().slice(0, 8)}`,
      phone,
      studentName,
      amountVnd: LIFETIME_FEE_VND,
      bank: PAYMENT_BANK,
      accountNumber: PAYMENT_ACCOUNT_NUMBER,
      note: note || `VIP Tron Doi 15.000 VND - ${phone}`,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    db.paymentRequests.unshift(entry);
    writeDb(db);

    res.status(201).json({ request: entry });
  });

  app.post('/api/progress/record', attachUser, (req: AuthedRequest, res) => {
    const op = String(req.body?.op ?? '');
    const correct = Boolean(req.body?.correct);
    if (!['add', 'sub', 'mul', 'div'].includes(op)) {
      res.status(400).json({ error: 'Phép tính không hợp lệ' });
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.id === req.authUser!.id);
    if (!user) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản' });
      return;
    }

    if (correct) {
      user.progress.stars += 1;
      user.progress.streak += 1;
      user.progress.bestStreak = Math.max(user.progress.bestStreak, user.progress.streak);
      user.progress.solvedCount += 1;
      user.progress.byOp[op as 'add' | 'sub' | 'mul' | 'div'] += 1;
    } else {
      user.progress.streak = 0;
    }
    writeDb(db);
    res.json({ progress: user.progress });
  });

  // Admin endpoints
  app.get('/api/admin/overview', attachUser, requireAdmin, (_req, res) => {
    const db = readDb();
    const customers = db.users
      .filter((u) => u.role === 'customer')
      .map((u) => sanitizeUser(u));
    const pendingRequests = db.paymentRequests.filter((r) => r.status === 'pending').length;
    const activeCustomers = customers.filter((c) => c.status === 'active' && c.isVip).length;

    res.json({
      customers,
      paymentRequests: db.paymentRequests,
      stats: {
        totalCustomers: customers.length,
        activeCustomers,
        pendingRequests,
        estimatedRevenueVnd: customers.length * LIFETIME_FEE_VND,
      },
    });
  });

  app.post('/api/admin/customers', attachUser, requireAdmin, (req, res) => {
    const phone = normalizePhone(String(req.body?.phone ?? ''));
    const password = String(req.body?.password ?? '').trim();
    const name = String(req.body?.name ?? '').trim().slice(0, 80);
    const paymentRef = String(req.body?.paymentRef ?? `Agribank 15.000 VNĐ`).trim().slice(0, 120);
    const requestId = req.body?.requestId ? String(req.body.requestId) : null;

    if (!phone || phone.length < 8 || phone.length > 15) {
      res.status(400).json({ error: 'Số điện thoại phải gồm 8 đến 15 chữ số.' });
      return;
    }
    if (phone === ADMIN_PHONE) {
      res.status(400).json({ error: 'Không thể ghi đè số điện thoại Admin.' });
      return;
    }
    if (!password || password.length < 4) {
      res.status(400).json({ error: 'Mật khẩu phải có ít nhất 4 ký tự.' });
      return;
    }

    const db = readDb();
    if (db.users.some((u) => u.phone === phone)) {
      res.status(409).json({ error: 'Số điện thoại này đã tồn tại tài khoản.' });
      return;
    }

    const newCustomer: StoredUser = {
      id: `cust_${crypto.randomUUID().slice(0, 8)}`,
      phone,
      name: name || `Học sinh ${phone.slice(-4)}`,
      role: 'customer',
      passwordHash: hashPassword(password),
      isVip: true,
      status: 'active',
      plan: 'lifetime',
      paymentRef,
      createdAt: new Date().toISOString(),
      progress: {
        stars: 0,
        streak: 0,
        bestStreak: 0,
        solvedCount: 0,
        byOp: { add: 0, sub: 0, mul: 0, div: 0 },
      },
    };

    db.users.unshift(newCustomer);

    if (requestId) {
      const payReq = db.paymentRequests.find((r) => r.id === requestId);
      if (payReq) {
        payReq.status = 'approved';
      }
    } else {
      db.paymentRequests.forEach((r) => {
        if (r.phone === phone && r.status === 'pending') {
          r.status = 'approved';
        }
      });
    }

    writeDb(db);
    res.status(201).json({ customer: sanitizeUser(newCustomer) });
  });

  app.patch('/api/admin/customers/:id', attachUser, requireAdmin, (req, res) => {
    const id = req.params.id;
    const db = readDb();
    const customer = db.users.find((u) => u.id === id && u.role === 'customer');
    if (!customer) {
      res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
      return;
    }

    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      customer.name = req.body.name.trim().slice(0, 80);
    }
    if (req.body?.status === 'active' || req.body?.status === 'suspended') {
      customer.status = req.body.status;
    }
    if (typeof req.body?.isVip === 'boolean') {
      customer.isVip = req.body.isVip;
    }
    if (typeof req.body?.newPassword === 'string' && req.body.newPassword.trim().length >= 4) {
      customer.passwordHash = hashPassword(req.body.newPassword.trim());
    }

    writeDb(db);
    res.json({ customer: sanitizeUser(customer) });
  });

  app.delete('/api/admin/customers/:id', attachUser, requireAdmin, (req, res) => {
    const id = req.params.id;
    const db = readDb();
    const index = db.users.findIndex((u) => u.id === id && u.role === 'customer');
    if (index === -1) {
      res.status(404).json({ error: 'Không tìm thấy khách hàng.' });
      return;
    }
    db.users.splice(index, 1);
    writeDb(db);
    res.json({ deleted: true });
  });

  app.patch('/api/admin/payment-requests/:id', attachUser, requireAdmin, (req, res) => {
    const id = req.params.id;
    const status = req.body?.status;
    if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
      res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      return;
    }
    const db = readDb();
    const item = db.paymentRequests.find((r) => r.id === id);
    if (!item) {
      res.status(404).json({ error: 'Không tìm thấy yêu cầu thanh toán.' });
      return;
    }
    item.status = status;
    writeDb(db);
    res.json({ request: item });
  });

  app.post('/api/admin/change-password', attachUser, requireAdmin, (req: AuthedRequest, res) => {
    const newPassword = String(req.body?.newPassword ?? '').trim();
    if (newPassword.length < 4) {
      res.status(400).json({ error: 'Mật khẩu Admin phải có ít nhất 4 ký tự.' });
      return;
    }
    const db = readDb();
    const admin = db.users.find((u) => u.id === req.authUser!.id);
    if (!admin) {
      res.status(404).json({ error: 'Không tìm thấy tài khoản Admin' });
      return;
    }
    admin.passwordHash = hashPassword(newPassword);
    admin.customPasswordSet = true;
    writeDb(db);
    res.json({ updated: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MathSpark Kids server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
