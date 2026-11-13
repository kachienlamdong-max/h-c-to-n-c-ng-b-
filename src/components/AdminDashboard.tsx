import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import type { PaymentNotification, PublicUser } from '../types';
import { api } from '../utils/api';

interface AdminDashboardProps {
  adminUser: PublicUser;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser }) => {
  const [customers, setCustomers] = useState<PublicUser[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentNotification[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    pendingRequests: 0,
    estimatedRevenueVnd: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [paymentRef, setPaymentRef] = useState('Agribank 15.000 VNĐ');
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminPassMsg, setAdminPassMsg] = useState<string | null>(null);

  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminOverview();
      setCustomers(data.customers);
      setPaymentRequests(data.paymentRequests);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const generatePin = () => {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    setPassword(pin);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg(null);
    setError(null);
    setCreating(true);
    try {
      await api.createCustomer({
        phone,
        password,
        name,
        paymentRef,
        requestId: linkedRequestId || undefined,
      });
      setCreateMsg(`Đã tạo tài khoản VIP cho SĐT ${phone} (Mật khẩu: ${password})`);
      setPhone('');
      setName('');
      setPassword('');
      setLinkedRequestId(null);
      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo tài khoản khách hàng.');
    } finally {
      setCreating(false);
    }
  };

  const handlePrefillFromRequest = (req: PaymentNotification) => {
    setPhone(req.phone);
    setName(req.studentName);
    setPaymentRef(`Agribank 15.000 VNĐ · ${req.note}`);
    setLinkedRequestId(req.id);
    if (!password) {
      generatePin();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (customer: PublicUser) => {
    const nextStatus = customer.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateCustomer(customer.id, { status: nextStatus, isVip: nextStatus === 'active' });
      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại.');
    }
  };

  const handleDeleteCustomer = async (customer: PublicUser) => {
    try {
      await api.deleteCustomer(customer.id);
      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa tài khoản thất bại.');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (resetPasswordVal.trim().length < 4) return;
    try {
      await api.updateCustomer(id, { newPassword: resetPasswordVal.trim() });
      setResetTargetId(null);
      setResetPasswordVal('');
      setCreateMsg('Đã cập nhật mật khẩu khách hàng.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại.');
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await api.updatePaymentRequestStatus(id, 'rejected');
      await fetchOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.');
    }
  };

  const handleAdminPassChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassMsg(null);
    try {
      await api.changeAdminPassword(newAdminPass);
      setNewAdminPass('');
      setAdminPassMsg('Đã đổi mật khẩu Admin thành công.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đổi mật khẩu Admin thất bại.');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.phone.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Bảng điều khiển Quản trị · {adminUser.phone}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản lý Khách hàng & Tài khoản VIP
          </h1>
        </div>
        <button
          type="button"
          onClick={fetchOverview}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* KPI Summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Tổng khách hàng VIP</p>
          <p className="font-math text-3xl font-extrabold text-slate-900 mt-1">
            {stats.totalCustomers}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Tài khoản đang hoạt động</p>
          <p className="font-math text-3xl font-extrabold text-emerald-600 mt-1">
            {stats.activeCustomers}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Chờ xác nhận chuyển khoản</p>
          <p className="font-math text-3xl font-extrabold text-amber-600 mt-1">
            {stats.pendingRequests}
          </p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Doanh thu trọn đời (VNĐ)</p>
          <p className="font-math text-2xl sm:text-3xl font-extrabold text-sky-700 mt-1">
            {stats.estimatedRevenueVnd.toLocaleString('vi-VN')}
          </p>
        </div>
      </section>

      {/* Create VIP Customer Account + Pending Payment Notifications */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Tạo Tài khoản Khách VIP
            </h2>
            {linkedRequestId && (
              <button
                type="button"
                onClick={() => setLinkedRequestId(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Bỏ liên kết
              </button>
            )}
          </div>

          <form onSubmit={handleCreateCustomer} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Số điện thoại khách hàng
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-math focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tên học sinh / phụ huynh
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Bé Minh Anh"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Mật khẩu cấp cho khách</label>
                <button
                  type="button"
                  onClick={generatePin}
                  className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
                >
                  Tạo mã 6 số ngẫu nhiên
                </button>
              </div>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 4 ký tự"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-math focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Ghi chú xác nhận thanh toán
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {createMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{createMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 py-2.5 text-sm font-bold text-white cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Đang tạo...' : 'Xác nhận thanh toán & Tạo tài khoản'}
            </button>
          </form>
        </div>

        {/* Pending Payment Confirmations Queue */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Thông báo Chuyển khoản Agribank (15.000 VNĐ)
            </h2>
            <span className="text-xs font-semibold text-slate-500 font-math">
              Agribank · 54955215016444
            </span>
          </div>

          {paymentRequests.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center text-sm text-slate-500">
              Chưa có thông báo chuyển khoản nào. Khi phụ huynh bấm "Xác nhận đã chuyển khoản" ở màn
              hình thanh toán VIP, yêu cầu sẽ hiển thị tại đây để Admin duyệt nhanh.
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {paymentRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="font-math">{req.phone}</span>
                      <span aria-hidden="true">·</span>
                      <span>{req.studentName}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {req.amountVnd.toLocaleString('vi-VN')} VNĐ · {req.note}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Trạng thái:{' '}
                      <span
                        className={
                          req.status === 'approved'
                            ? 'text-emerald-700'
                            : req.status === 'rejected'
                              ? 'text-rose-600'
                              : 'text-amber-700'
                        }
                      >
                        {req.status === 'approved'
                          ? 'ĐÃ DUYỆT'
                          : req.status === 'rejected'
                            ? 'TỪ CHỐI'
                            : 'CHỜ DUYỆT'}
                      </span>
                    </p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrefillFromRequest(req)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Tạo tài khoản
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(req.id)}
                        aria-label="Từ chối yêu cầu"
                        className="rounded-xl border border-slate-300 bg-white hover:bg-rose-50 p-1.5 text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Customer Accounts Table */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Danh sách Khách hàng VIP ({filteredCustomers.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm SĐT hoặc tên..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center text-sm text-slate-500">
            Chưa có tài khoản khách hàng nào khớp tìm kiếm. Hãy tạo tài khoản mới ở biểu mẫu phía
            trên.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500">
                  <th className="py-3 pr-4">Số điện thoại</th>
                  <th className="py-3 pr-4">Tên học sinh</th>
                  <th className="py-3 pr-4">Gói & Ghi chú</th>
                  <th className="py-3 pr-4">Số sao</th>
                  <th className="py-3 pr-4">Trạng thái</th>
                  <th className="py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 pr-4 font-math font-bold text-slate-900">{c.phone}</td>
                    <td className="py-3.5 pr-4 font-medium text-slate-800">{c.name}</td>
                    <td className="py-3.5 pr-4 text-xs text-slate-600">
                      VIP Trọn đời · {c.paymentRef || 'Agribank'}
                    </td>
                    <td className="py-3.5 pr-4 font-math font-semibold text-amber-700">
                      {c.progress.stars}
                    </td>
                    <td className="py-3.5 pr-4 text-xs font-bold">
                      {c.status === 'active' ? (
                        <span className="text-emerald-700">Đang hoạt động</span>
                      ) : (
                        <span className="text-rose-600">Tạm khóa</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {resetTargetId === c.id ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="text"
                              value={resetPasswordVal}
                              onChange={(e) => setResetPasswordVal(e.target.value)}
                              placeholder="Mật khẩu mới"
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-math"
                            />
                            <button
                              type="button"
                              onClick={() => handleResetPassword(c.id)}
                              className="rounded-lg bg-sky-600 px-2 py-1 text-xs font-bold text-white cursor-pointer"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setResetTargetId(null)}
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setResetTargetId(c.id);
                              setResetPasswordVal('');
                            }}
                            title="Đặt lại mật khẩu"
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          title={c.status === 'active' ? 'Tạm khóa tài khoản' : 'Kích hoạt lại'}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                        >
                          {c.status === 'active' ? (
                            <UserX className="w-4 h-4 text-amber-600" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c)}
                          title="Xóa tài khoản"
                          className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Admin Security Settings */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Đổi Mật khẩu Quản trị Admin
          </h3>
          <p className="text-xs text-slate-600">
            Cập nhật mật khẩu cho số điện thoại Admin <span className="font-math">0382049919</span>.
          </p>
        </div>

        <form onSubmit={handleAdminPassChange} className="flex flex-wrap items-center gap-2">
          <input
            type="password"
            required
            minLength={4}
            value={newAdminPass}
            onChange={(e) => setNewAdminPass(e.target.value)}
            placeholder="Mật khẩu Admin mới"
            className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm font-bold text-white cursor-pointer"
          >
            Cập nhật mật khẩu
          </button>
          {adminPassMsg && (
            <span className="text-xs font-semibold text-emerald-700">{adminPassMsg}</span>
          )}
        </form>
      </section>
    </main>
  );
};
