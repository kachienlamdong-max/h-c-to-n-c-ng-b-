import React from 'react';
import { Download, Smartphone, Terminal, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidModal: React.FC<AndroidModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="android-modal-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <h2 id="android-modal-title" className="font-display text-lg font-extrabold text-slate-900">
              Cài đặt trên Điện thoại & Xuất file .APK
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-700">
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
            <h3 className="font-bold text-emerald-900">1. Cài nhanh trên Android & Máy tính (PWA)</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              MathSpark Kids hỗ trợ cài đặt trực tiếp như ứng dụng di động và học ngoại tuyến. Trên
              trình duyệt Chrome Android, chọn <strong>Cài đặt ứng dụng</strong> (hoặc menu{' '}
              <strong>Thêm vào màn hình chính</strong>) để mở toàn màn hình.
            </p>
            {isInstallable && (
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Cài đặt ngay
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Terminal className="w-4 h-4 text-sky-600" />
              <h3>2. Đóng gói file cài đặt Android .APK (Capacitor)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mã nguồn đã cấu hình sẵn <code className="font-math">capacitor.config.ts</code> và{' '}
              <code className="font-math">ANDROID_APK_GUIDE.md</code> để xuất file .APK qua Android
              Studio / Gradle:
            </p>
            <pre className="rounded-xl bg-slate-900 text-slate-100 p-3 text-xs font-math overflow-x-auto leading-relaxed">
{`npm run build
npm install -D @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android
cd android && ./gradlew assembleRelease`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
