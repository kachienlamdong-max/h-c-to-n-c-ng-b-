import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface UserProgress {
  stars: number;
  streak: number;
  bestStreak: number;
  solvedCount: number;
  byOp: {
    add: number;
    sub: number;
    mul: number;
    div: number;
  };
}

export interface StoredUser {
  id: string;
  phone: string;
  name: string;
  role: 'admin' | 'customer';
  passwordHash: string;
  isVip: boolean;
  status: 'active' | 'suspended';
  plan: 'lifetime' | 'admin';
  paymentRef?: string;
  createdAt: string;
  lastLoginAt?: string;
  progress: UserProgress;
}

export interface StoredPaymentNotification {
  id: string;
  phone: string;
  studentName: string;
  amountVnd: number;
  bank: string;
  accountNumber: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  paymentRequests: StoredPaymentNotification[];
}

export const ADMIN_PHONE = '0382049919';
export const LIFETIME_FEE_VND = 15000;
export const PAYMENT_BANK = 'Agribank';
export const PAYMENT_ACCOUNT_NUMBER = '54955215016444';
export const PAYMENT_ACCOUNT_HOLDER = 'MATHSPARK KIDS EDUCATION';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const SECRET_FILE = path.join(DATA_DIR, '.session-secret');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().+]/g, '').trim();
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  ensureDataDir();
  if (fs.existsSync(SECRET_FILE)) {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
  return secret;
}

export function signAuthToken(userId: string, role: 'admin' | 'customer'): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      role,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAuthToken(
  token: string
): { sub: string; role: 'admin' | 'customer' } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub: string;
      role: 'admin' | 'customer';
      exp: number;
    };
    if (!parsed.sub || Date.now() > parsed.exp) return null;
    return { sub: parsed.sub, role: parsed.role };
  } catch {
    return null;
  }
}

function createInitialDb(): DatabaseSchema {
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || ADMIN_PHONE;
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'admin-root',
        phone: ADMIN_PHONE,
        name: 'System Admin',
        role: 'admin',
        passwordHash: hashPassword(adminPassword),
        isVip: true,
        status: 'active',
        plan: 'admin',
        paymentRef: 'Administrator Account',
        createdAt: now,
        progress: {
          stars: 0,
          streak: 0,
          bestStreak: 0,
          solvedCount: 0,
          byOp: { add: 0, sub: 0, mul: 0, div: 0 },
        },
      },
    ],
    paymentRequests: [],
  };
}

export function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDb();
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    const hasAdmin = parsed.users?.some((u) => u.phone === ADMIN_PHONE && u.role === 'admin');
    if (!hasAdmin) {
      const initial = createInitialDb();
      parsed.users = [initial.users[0], ...(parsed.users || [])];
      writeDb(parsed);
    }
    return parsed;
  } catch {
    const initial = createInitialDb();
    writeDb(initial);
    return initial;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDataDir();
  const tmpFile = `${DB_FILE}.tmp.${process.pid}`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function sanitizeUser(user: StoredUser) {
  const { passwordHash: _removed, ...rest } = user;
  return rest;
}
