import { AdminUserRecord, AdminReceiptRecord, AdminStats, AdminReportsData } from '../types';

const ADMIN_TOKEN_KEY = 'smartreceipt_admin_token';
const ADMIN_USER_KEY = 'smartreceipt_admin_user';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function getAdminUser(): { email: string; name: string } | null {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function isAdminLoggedIn(): boolean {
  return Boolean(getAdminToken());
}

export function adminLogout(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch (e) {}
}

export const adminApi = {
  async login(email: string, password: string): Promise<{ success: boolean; token: string; admin: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Invalid admin credentials' }));
      throw new Error(err.error || 'Admin login failed');
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.admin || { email, name: 'Admin' }));
    }
    return data;
  },

  async getStats(): Promise<AdminStats> {
    const token = getAdminToken();
    const res = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token || 'admin_token'}`,
        'x-admin-token': token || 'admin_token'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch admin stats');
    }
    return res.json();
  },

  async getUsers(): Promise<AdminUserRecord[]> {
    const token = getAdminToken();
    const res = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token || 'admin_token'}`,
        'x-admin-token': token || 'admin_token'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch users');
    }
    return res.json();
  },

  async deleteUser(id: string): Promise<boolean> {
    const token = getAdminToken();
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token || 'admin_token'}`,
        'x-admin-token': token || 'admin_token'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to delete user');
    }
    return true;
  },

  async getReceipts(userId?: string): Promise<AdminReceiptRecord[]> {
    const token = getAdminToken();
    const url = userId ? `/api/admin/receipts?userId=${encodeURIComponent(userId)}` : '/api/admin/receipts';
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token || 'admin_token'}`,
        'x-admin-token': token || 'admin_token'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch receipts');
    }
    return res.json();
  },

  async deleteReceipt(id: string): Promise<boolean> {
    const token = getAdminToken();
    const res = await fetch(`/api/admin/receipts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token || 'admin_token'}`,
        'x-admin-token': token || 'admin_token'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to delete receipt');
    }
    return true;
  },

  async getReports(userId?: string): Promise<AdminReportsData> {
    const token = getAdminToken();
    const url = userId ? `/api/admin/reports?userId=${encodeURIComponent(userId)}` : '/api/admin/reports';
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token || 'admin_token'}`,
        'x-admin-token': token || 'admin_token'
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch reports');
    }
    return res.json();
  }
};
