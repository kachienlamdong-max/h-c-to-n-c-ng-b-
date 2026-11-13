import React, { useEffect, useState } from 'react';
import { Crown, KeyRound, Lock, Phone, Shield, X } from 'lucide-react';
import type { PublicUser } from '../types';
import { ApiError, api, setStoredToken } from '../utils/api';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'student' | 'admin';
  onClose: () => void;
  onSuccess: (user: PublicUser) => void;
  onOpenPayment: (prefillPhone?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'student',
  onClose,
  onSuccess,
  onOpenPayment,
}) => {
  const [tab, setTab] = useState<'student' | 'admin'>(initialTab);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setError(null);
    setNotRegistered(false);
    if (initialTab === 'admin' && !phone) {
      setPhone('0382049919');
    } else if (initialTab === 'student' && phone === '0382049919') {
      setPhone('');
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotRegistered(false);
    setLoading(true);

    try {
      const { token, user } = await api.login(phone, password);
      setStoredToken(token);
      onSuccess(user);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ACCOUNT_NOT_FOUND') {
        setNotRegistered(true);
      }
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="auth-modal-title" className="font-display text-lg font-extrabold text-slate-900">
            {tab === 'admin' ? 'Cổng Quản trị Admin' : 'Đăng nhập Học sinh VIP'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đăng nhập"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Segmented Role Switch */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTab('student');
                setError(null);
                setNotRegistered(false);
                if (phone === '0382049919') setPhone('');
                setPassword('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                tab === 'student'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học sinh / Khách hàng
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('admin');
                setError(null);
                setNotRegistered(false);
                setPhone('0382049919');
                setPassword('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                tab === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin (0382049919)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Số điện thoại
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={tab === 'admin' ? '0382049919' : 'Nhập số điện thoại đã đăng ký'}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-math focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                {tab === 'admin' ? 'Mật khẩu Admin' : 'Mật khẩu'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {tab === 'admin' && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2 text-xs text-slate-600">
                <Shield className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  SĐT Admin: <strong className="font-math">0382049919</strong> · Mật khẩu mặc định
                  ban đầu: <strong className="font-math">0382049919</strong> (có thể đổi trong bảng
                  điều khiển).
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 space-y-2">
                <p>{error}</p>
                {notRegistered && tab === 'student' && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPayment(phone);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Đăng ký & Thanh toán 15.000 VNĐ lên VIP
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-700 border-b-4 border-sky-800 disabled:opacity-50 py-3 text-sm font-bold text-white transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              {loading
                ? 'Đang đăng nhập...'
                : tab === 'admin'
                  ? 'Vào Bảng điều khiển Admin'
                  : 'Đăng nhập VIP'}
            </button>
          </form>

          {tab === 'student' && (
            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(phone);
                }}
                className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Chưa có tài khoản VIP? Xem thông tin chuyển khoản 15.000 VNĐ
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Tiếp tục Dùng thử miễn phí
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
