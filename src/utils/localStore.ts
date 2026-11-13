import type { PaymentInfo, PaymentNotification, PublicUser, UserProgress } from '../types';
import { ApiError } from './api';

const LOCAL_DB_KEY = 'mathspark_local_store_v1';
const LOCAL_TOKEN_PREFIX = 'local_token_';
const ADMIN_PHONE = '0382049919';

interface LocalUser extends PublicUser {
  password: string;
  customPasswordSet?: boolean;
}

interface LocalDb {
  users: LocalUser[];
  paymentRequests: PaymentNotification[];
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-().+]/g, '').trim();
}

function createInitialLocalDb(): LocalDb {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'admin-root',
        phone: ADMIN_PHONE,
        name: 'Quản trị viên',
        role: 'admin',
        password: ADMIN_PHONE,
        customPasswordSet: false,
        isVip: true,
        status: 'active',
        plan: 'admin',
        paymentRef: 'Tài khoản Quản trị',
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

function readLocalDb(): LocalDb {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      const initial = createInitialLocalDb();
      writeLocalDb(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as LocalDb;
    if (!parsed.users?.some((u) => u.phone === ADMIN_PHONE && u.role === 'admin')) {
      const initial = createInitialLocalDb();
      parsed.users = [initial.users[0], ...(parsed.users || [])];
      writeLocalDb(parsed);
    }
    return parsed;
  } catch {
    return createInitialLocalDb();
  }
}

function writeLocalDb(db: LocalDb): void {
  try {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
  } catch {
    // Ignore quota error
  }
}

function sanitize(user: LocalUser): PublicUser {
  const { password: _p, customPasswordSet: _c, ...rest } = user;
  return rest;
}

function requireLocalUser(token: string | null): { db: LocalDb; user: LocalUser } {
  if (!token || !token.startsWith(LOCAL_TOKEN_PREFIX)) {
    throw new ApiError('Vui lòng đăng nhập lại.', 401);
  }
  const userId = token.slice(LOCAL_TOKEN_PREFIX.length);
  const db = readLocalDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    throw new ApiError('Không tìm thấy tài khoản.', 401);
  }
  if (user.status === 'suspended') {
    throw new ApiError('Tài khoản đang bị tạm khóa. Vui lòng liên hệ Admin.', 403);
  }
  return { db, user };
}

export const localFallback = {
  getPaymentInfo(): PaymentInfo {
    return {
      lifetimeFeeVnd: 15000,
      bank: 'Agribank',
      accountNumber: '54955215016444',
      accountHolder: 'MATHSPARK KIDS EDUCATION',
      currency: 'VND',
    };
  },

  login(rawPhone: string, password: string): { token: string; user: PublicUser } {
    const phone = normalizePhone(rawPhone);
    if (!phone || phone.length < 8) {
      throw new ApiError('Vui lòng nhập số điện thoại hợp lệ.', 400, 'INVALID_INPUT');
    }

    const db = readLocalDb();
    const user = db.users.find((u) => u.phone === phone);
    if (!user) {
      throw new ApiError(
        'Số điện thoại này chưa có tài khoản VIP. Vui lòng thanh toán 15.000 VNĐ để kích hoạt.',
        404,
        'ACCOUNT_NOT_FOUND'
      );
    }
    if (user.status === 'suspended') {
      throw new ApiError(
        'Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Admin.',
        403,
        'ACCOUNT_SUSPENDED'
      );
    }

    const requiresPassword = user.role !== 'admin' || Boolean(user.customPasswordSet);
    if (requiresPassword && user.password !== password) {
      throw new ApiError(
        'Mật khẩu chưa chính xác. Vui lòng kiểm tra lại.',
        401,
        'INVALID_PASSWORD'
      );
    }

    user.lastLoginAt = new Date().toISOString();
    writeLocalDb(db);
    return {
      token: `${LOCAL_TOKEN_PREFIX}${user.id}`,
      user: sanitize(user),
    };
  },

  me(token: string | null): { user: PublicUser } {
    const { user } = requireLocalUser(token);
    return { user: sanitize(user) };
  },

  notifyPayment(rawPhone: string, studentName: string, note: string): { request: PaymentNotification } {
    const phone = normalizePhone(rawPhone);
    if (!phone || phone.length < 8 || phone.length > 15) {
      throw new ApiError('Vui lòng nhập số điện thoại hợp lệ.', 400);
    }
    if (!studentName.trim()) {
      throw new ApiError('Vui lòng nhập tên học sinh hoặc phụ huynh.', 400);
    }
    const db = readLocalDb();
    const entry: PaymentNotification = {
      id: `pay_${Date.now().toString(36)}`,
      phone,
      studentName: studentName.trim(),
      amountVnd: 15000,
      bank: 'Agribank',
      accountNumber: '54955215016444',
      note: note.trim() || `VIP Tron Doi 15.000 VND - ${phone}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.paymentRequests.unshift(entry);
    writeLocalDb(db);
    return { request: entry };
  },

  recordProgress(
    token: string | null,
    op: 'add' | 'sub' | 'mul' | 'div',
    correct: boolean
  ): { progress: UserProgress } {
    const { db, user } = requireLocalUser(token);
    if (correct) {
      user.progress.stars += 1;
      user.progress.streak += 1;
      user.progress.bestStreak = Math.max(user.progress.bestStreak, user.progress.streak);
      user.progress.solvedCount += 1;
      user.progress.byOp[op] += 1;
    } else {
      user.progress.streak = 0;
    }
    writeLocalDb(db);
    return { progress: user.progress };
  },

  adminOverview(token: string | null) {
    const { db, user } = requireLocalUser(token);
    if (user.role !== 'admin') {
      throw new ApiError('Cần quyền Quản trị Admin.', 403);
    }
    const customers = db.users.filter((u) => u.role === 'customer').map(sanitize);
    const pendingRequests = db.paymentRequests.filter((r) => r.status === 'pending').length;
    const activeCustomers = customers.filter((c) => c.status === 'active' && c.isVip).length;
    return {
      customers,
      paymentRequests: db.paymentRequests,
      stats: {
        totalCustomers: customers.length,
        activeCustomers,
        pendingRequests,
        estimatedRevenueVnd: customers.length * 15000,
      },
    };
  },

  createCustomer(
    token: string | null,
    payload: { phone: string; password: string; name: string; paymentRef?: string; requestId?: string }
  ) {
    const { db, user } = requireLocalUser(token);
    if (user.role !== 'admin') {
      throw new ApiError('Cần quyền Quản trị Admin.', 403);
    }
    const phone = normalizePhone(payload.phone);
    const password = payload.password.trim();
    if (!phone || phone.length < 8 || phone.length > 15) {
      throw new ApiError('Số điện thoại phải gồm 8 đến 15 chữ số.', 400);
    }
    if (phone === ADMIN_PHONE) {
      throw new ApiError('Không thể ghi đè số điện thoại Admin.', 400);
    }
    if (password.length < 4) {
      throw new ApiError('Mật khẩu phải có ít nhất 4 ký tự.', 400);
    }
    if (db.users.some((u) => u.phone === phone)) {
      throw new ApiError('Số điện thoại này đã tồn tại tài khoản.', 409);
    }

    const newCustomer: LocalUser = {
      id: `cust_${Date.now().toString(36)}`,
      phone,
      name: payload.name.trim() || `Học sinh ${phone.slice(-4)}`,
      role: 'customer',
      password,
      isVip: true,
      status: 'active',
      plan: 'lifetime',
      paymentRef: payload.paymentRef || 'Agribank 15.000 VNĐ',
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

    if (payload.requestId) {
      const reqItem = db.paymentRequests.find((r) => r.id === payload.requestId);
      if (reqItem) reqItem.status = 'approved';
    } else {
      db.paymentRequests.forEach((r) => {
        if (r.phone === phone && r.status === 'pending') r.status = 'approved';
      });
    }

    writeLocalDb(db);
    return { customer: sanitize(newCustomer) };
  },

  updateCustomer(
    token: string | null,
    id: string,
    payload: { name?: string; status?: 'active' | 'suspended'; isVip?: boolean; newPassword?: string }
  ) {
    const { db, user } = requireLocalUser(token);
    if (user.role !== 'admin') throw new ApiError('Cần quyền Quản trị Admin.', 403);
    const customer = db.users.find((u) => u.id === id && u.role === 'customer');
    if (!customer) throw new ApiError('Không tìm thấy khách hàng.', 404);
    if (payload.name?.trim()) customer.name = payload.name.trim();
    if (payload.status) customer.status = payload.status;
    if (typeof payload.isVip === 'boolean') customer.isVip = payload.isVip;
    if (payload.newPassword && payload.newPassword.trim().length >= 4) {
      customer.password = payload.newPassword.trim();
    }
    writeLocalDb(db);
    return { customer: sanitize(customer) };
  },

  deleteCustomer(token: string | null, id: string) {
    const { db, user } = requireLocalUser(token);
    if (user.role !== 'admin') throw new ApiError('Cần quyền Quản trị Admin.', 403);
    const idx = db.users.findIndex((u) => u.id === id && u.role === 'customer');
    if (idx === -1) throw new ApiError('Không tìm thấy khách hàng.', 404);
    db.users.splice(idx, 1);
    writeLocalDb(db);
    return { deleted: true };
  },

  updatePaymentRequestStatus(token: string | null, id: string, status: 'approved' | 'rejected' | 'pending') {
    const { db, user } = requireLocalUser(token);
    if (user.role !== 'admin') throw new ApiError('Cần quyền Quản trị Admin.', 403);
    const item = db.paymentRequests.find((r) => r.id === id);
    if (!item) throw new ApiError('Không tìm thấy yêu cầu thanh toán.', 404);
    item.status = status;
    writeLocalDb(db);
    return { request: item };
  },

  changeAdminPassword(token: string | null, newPassword: string) {
    const { db, user } = requireLocalUser(token);
    if (user.role !== 'admin') throw new ApiError('Cần quyền Quản trị Admin.', 403);
    if (newPassword.trim().length < 4) {
      throw new ApiError('Mật khẩu Admin phải có ít nhất 4 ký tự.', 400);
    }
    user.password = newPassword.trim();
    user.customPasswordSet = true;
    writeLocalDb(db);
    return { updated: true };
  },
};
