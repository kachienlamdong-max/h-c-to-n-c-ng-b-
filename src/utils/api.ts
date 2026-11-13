import type { PaymentInfo, PaymentNotification, PublicUser, UserProgress } from '../types';

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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      data?.error || 'Request failed. Please try again.',
      res.status,
      data?.code
    );
  }
  return data as T;
}

export const api = {
  getPaymentInfo: () => request<PaymentInfo>('/api/payment/info'),

  login: (phone: string, password: string) =>
    request<{ token: string; user: PublicUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  me: () => request<{ user: PublicUser }>('/api/auth/me'),

  notifyPayment: (phone: string, studentName: string, note: string) =>
    request<{ request: PaymentNotification }>('/api/payment/notify', {
      method: 'POST',
      body: JSON.stringify({ phone, studentName, note }),
    }),

  recordProgress: (op: 'add' | 'sub' | 'mul' | 'div', correct: boolean) =>
    request<{ progress: UserProgress }>('/api/progress/record', {
      method: 'POST',
      body: JSON.stringify({ op, correct }),
    }),

  adminOverview: () =>
    request<{
      customers: PublicUser[];
      paymentRequests: PaymentNotification[];
      stats: {
        totalCustomers: number;
        activeCustomers: number;
        pendingRequests: number;
        estimatedRevenueVnd: number;
      };
    }>('/api/admin/overview'),

  createCustomer: (payload: {
    phone: string;
    password: string;
    name: string;
    paymentRef?: string;
    requestId?: string;
  }) =>
    request<{ customer: PublicUser }>('/api/admin/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCustomer: (
    id: string,
    payload: {
      name?: string;
      status?: 'active' | 'suspended';
      isVip?: boolean;
      newPassword?: string;
    }
  ) =>
    request<{ customer: PublicUser }>(`/api/admin/customers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCustomer: (id: string) =>
    request<{ deleted: boolean }>(`/api/admin/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  updatePaymentRequestStatus: (id: string, status: 'approved' | 'rejected' | 'pending') =>
    request<{ request: PaymentNotification }>(
      `/api/admin/payment-requests/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    ),

  changeAdminPassword: (newPassword: string) =>
    request<{ updated: boolean }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
};
