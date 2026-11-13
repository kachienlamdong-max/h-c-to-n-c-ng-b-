import type { PaymentInfo, PaymentNotification, PublicUser, UserProgress } from '../types';
import { localFallback } from './localStore';

const TOKEN_KEY = 'mathspark_auth_token';

function getBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.replace(/\/+$/, '');
  }
  return '';
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage restriction
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function requestWithFallback<T>(
  path: string,
  init: RequestInit,
  fallbackFn: () => T
): Promise<T> {
  const token = getStoredToken();
  // If current session uses a local fallback token, continue using local fallback consistently
  if (token && token.startsWith('local_token_')) {
    return fallbackFn();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      credentials: 'same-origin',
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let parsed: Record<string, unknown> | null = null;
    if (contentType.includes('application/json') || text.trim().startsWith('{')) {
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
    }

    if (res.ok && parsed !== null) {
      return parsed as T;
    }

    // Real structured error from Express API: throw it directly
    if (parsed && typeof parsed.error === 'string') {
      throw new ApiError(
        parsed.error,
        res.status,
        typeof parsed.code === 'string' ? parsed.code : undefined
      );
    }

    // Non-JSON 404/405/502/HTML response (e.g. static host / offline SW / preview proxy): use fallback
    return fallbackFn();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    return fallbackFn();
  }
}

export const api = {
  getPaymentInfo: () =>
    requestWithFallback<PaymentInfo>('/api/payment/info', {}, () =>
      localFallback.getPaymentInfo()
    ),

  login: (phone: string, password: string) =>
    requestWithFallback<{ token: string; user: PublicUser }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      },
      () => localFallback.login(phone, password)
    ),

  me: () =>
    requestWithFallback<{ user: PublicUser }>('/api/auth/me', {}, () =>
      localFallback.me(getStoredToken())
    ),

  notifyPayment: (phone: string, studentName: string, note: string) =>
    requestWithFallback<{ request: PaymentNotification }>(
      '/api/payment/notify',
      {
        method: 'POST',
        body: JSON.stringify({ phone, studentName, note }),
      },
      () => localFallback.notifyPayment(phone, studentName, note)
    ),

  recordProgress: (op: 'add' | 'sub' | 'mul' | 'div', correct: boolean) =>
    requestWithFallback<{ progress: UserProgress }>(
      '/api/progress/record',
      {
        method: 'POST',
        body: JSON.stringify({ op, correct }),
      },
      () => localFallback.recordProgress(getStoredToken(), op, correct)
    ),

  adminOverview: () =>
    requestWithFallback<{
      customers: PublicUser[];
      paymentRequests: PaymentNotification[];
      stats: {
        totalCustomers: number;
        activeCustomers: number;
        pendingRequests: number;
        estimatedRevenueVnd: number;
      };
    }>('/api/admin/overview', {}, () => localFallback.adminOverview(getStoredToken())),

  createCustomer: (payload: {
    phone: string;
    password: string;
    name: string;
    paymentRef?: string;
    requestId?: string;
  }) =>
    requestWithFallback<{ customer: PublicUser }>(
      '/api/admin/customers',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      () => localFallback.createCustomer(getStoredToken(), payload)
    ),

  updateCustomer: (
    id: string,
    payload: {
      name?: string;
      status?: 'active' | 'suspended';
      isVip?: boolean;
      newPassword?: string;
    }
  ) =>
    requestWithFallback<{ customer: PublicUser }>(
      `/api/admin/customers/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      () => localFallback.updateCustomer(getStoredToken(), id, payload)
    ),

  deleteCustomer: (id: string) =>
    requestWithFallback<{ deleted: boolean }>(
      `/api/admin/customers/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      },
      () => localFallback.deleteCustomer(getStoredToken(), id)
    ),

  updatePaymentRequestStatus: (id: string, status: 'approved' | 'rejected' | 'pending') =>
    requestWithFallback<{ request: PaymentNotification }>(
      `/api/admin/payment-requests/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      () => localFallback.updatePaymentRequestStatus(getStoredToken(), id, status)
    ),

  changeAdminPassword: (newPassword: string) =>
    requestWithFallback<{ updated: boolean }>(
      '/api/admin/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      },
      () => localFallback.changeAdminPassword(getStoredToken(), newPassword)
    ),
};
