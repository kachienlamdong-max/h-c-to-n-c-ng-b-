import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Crown, Landmark, Send, ShieldCheck, X } from 'lucide-react';
import { api } from '../utils/api';

interface PaymentModalProps {
  isOpen: boolean;
  initialPhone?: string;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  initialPhone = '',
  onClose,
  onSwitchToLogin,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<'account' | 'amount' | null>(null);
  const [phone, setPhone] = useState(initialPhone);
  const [studentName, setStudentName] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone);
  }, [initialPhone]);

  useEffect(() => {
    if (!isOpen) return;
    const payload = 'BANK:Agribank|ACC:54955215016444|AMOUNT:15000VND|NOTE:MathSpark VIP Tron Doi';
    QRCode.toDataURL(payload, {
      width: 200,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async (value: string, field: 'account' | 'amount') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.notifyPayment(phone, studentName, note);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi thông báo thanh toán.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 id="payment-modal-title" className="font-display text-lg font-extrabold text-slate-900">
                Mở khóa Tài khoản VIP Trọn đời
              </h2>
              <p className="text-xs font-medium text-amber-900">
                Thanh toán một lần duy nhất · Sử dụng vĩnh viễn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ thanh toán"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-amber-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Bank Transfer Info Box */}
          <div className="md:col-span-7 space-y-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-600">Phí truy cập trọn đời</span>
                <span className="font-math text-2xl font-extrabold text-emerald-700">
                  15.000 VNĐ
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium inline-flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-emerald-700" />
                    Ngân hàng
                  </span>
                  <span className="font-bold text-slate-900">Agribank</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-math font-bold text-slate-900 text-base">
                      54955215016444
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('54955215016444', 'account')}
                      className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {copiedField === 'account' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Sao chép
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Số tiền chuyển</span>
                  <div className="flex items-center gap-2">
                    <span className="font-math font-bold text-slate-900">15.000 VNĐ</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('15000', 'amount')}
                      className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      {copiedField === 'amount' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Sao chép
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* What VIP Unlocks */}
            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-800 text-sm">Quyền lợi gói VIP Trọn đời:</p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Luyện tập không giới hạn Cộng, Trừ, Nhân, Chia
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Mở khóa toàn bộ 3 cấp độ (Cơ bản, Khám phá, Siêu sao)
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Lưu số sao, chuỗi đúng trên cả Web và Ứng dụng Android
              </p>
            </div>
          </div>

          {/* Right: QR + Notify Admin Form */}
          <div className="md:col-span-5 flex flex-col justify-between gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 flex flex-col items-center text-center gap-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Mã QR chuyển khoản Agribank 15.000 VNĐ"
                  className="w-36 h-36 rounded-lg"
                />
              ) : (
                <div className="w-36 h-36 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                  Mã QR Agribank
                </div>
              )}
              <span className="text-[11px] font-medium text-slate-500">
                Ghi rõ Số điện thoại trong nội dung chuyển khoản
              </span>
            </div>

            {submitted ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900 space-y-2">
                <p className="font-bold">Đã gửi thông báo thanh toán!</p>
                <p className="text-xs leading-relaxed">
                  Admin sẽ kiểm tra giao dịch 15.000 VNĐ qua Agribank và kích hoạt tài khoản SĐT
                  của bạn trong giây lát.
                </p>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Tới trang Đăng nhập VIP
                </button>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-2.5">
                <p className="text-xs font-bold text-slate-800">
                  Đã chuyển khoản? Báo cho Admin kích hoạt:
                </p>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Số điện thoại của bạn (VD: 0912345678)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Tên bé hoặc phụ huynh"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú chuyển khoản (nếu có)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Đang gửi...' : 'Xác nhận đã chuyển khoản'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-semibold text-sky-700 hover:underline text-center cursor-pointer"
            >
              Đã có tài khoản VIP? Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
