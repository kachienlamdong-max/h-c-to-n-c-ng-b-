import React, { useState } from 'react';
import { Download, Smartphone, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenAndroidGuide: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenAndroidGuide }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Cài đặt ứng dụng
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-sky-600" />
          Cài trên iPhone/iPad
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Cài đặt trên iPhone hoặc iPad
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                1. Nhấn biểu tượng <strong>Chia sẻ (Share)</strong> trên thanh công cụ Safari.<br />
                2. Cuộn xuống và chọn <strong>Thêm vào Màn hình chính</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenAndroidGuide}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
    >
      <Smartphone className="w-4 h-4 text-emerald-600" />
      Tải APK Android
    </button>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-4 h-4" />
      <span>Đang ngoại tuyến — Vẫn có thể học các bài đã lưu</span>
    </div>
  );
};
