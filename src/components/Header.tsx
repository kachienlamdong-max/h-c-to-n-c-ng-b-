import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { PublicUser } from '../types';

export type AppView = 'home' | 'practice' | 'admin';

interface HeaderProps {
  activeView: AppView;
  user: PublicUser | null;
  onNavigate: (view: AppView) => void;
  onOpenPayment: () => void;
  onOpenAuth: (tab?: 'student' | 'admin') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  user,
  onNavigate,
  onOpenPayment,
  onOpenAuth,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (isActive: boolean) =>
    `text-sm font-semibold transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
      isActive
        ? 'text-sky-700 border-sky-600'
        : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
    }`;

  const handleNav = (action: () => void) => {
    setMobileOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => handleNav(() => onNavigate('home'))}
          className="font-display text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-md"
        >
          MathSpark
        </button>

        <nav className="hidden md:flex items-center gap-6" aria-label="Điều hướng chính">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className={linkClass(activeView === 'home')}
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className={linkClass(activeView === 'practice')}
          >
            Luyện tập
          </button>
          <button type="button" onClick={onOpenPayment} className={linkClass(false)}>
            Nâng cấp VIP
          </button>
          <button
            type="button"
            onClick={() => {
              if (user?.role === 'admin') {
                onNavigate('admin');
              } else {
                onOpenAuth('admin');
              }
            }}
            className={linkClass(activeView === 'admin')}
          >
            Quản trị
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              Đăng xuất ({user.role === 'admin' ? 'Admin' : user.name.split(' ')[0]})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('student')}
              className="px-5 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              Đăng nhập
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Mở menu điều hướng"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleNav(() => onNavigate('home'))}
            className="text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => handleNav(() => onNavigate('practice'))}
            className="text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Luyện tập
          </button>
          <button
            type="button"
            onClick={() => handleNav(onOpenPayment)}
            className="text-left px-3 py-2 rounded-xl text-sm font-semibold text-amber-700 hover:bg-amber-50"
          >
            Nâng cấp VIP (15.000 VNĐ)
          </button>
          <button
            type="button"
            onClick={() =>
              handleNav(() => {
                if (user?.role === 'admin') {
                  onNavigate('admin');
                } else {
                  onOpenAuth('admin');
                }
              })
            }
            className="text-left px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Cổng Quản trị
          </button>
        </div>
      )}
    </header>
  );
};
