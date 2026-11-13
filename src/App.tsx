import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import type { MathOperation, PublicUser } from './types';
import { api, getStoredToken, setStoredToken } from './utils/api';
import { playClickSound, setSoundEnabled } from './utils/sound';
import { Header, type AppView } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { MathSandbox } from './components/MathSandbox';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { PaymentModal } from './components/PaymentModal';
import { AndroidModal } from './components/AndroidModal';
import { OfflineIndicator } from './components/PWAInstallButton';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedOp, setSelectedOp] = useState<MathOperation>('add');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'student' | 'admin'>('student');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentPrefillPhone, setPaymentPrefillPhone] = useState('');
  const [androidModalOpen, setAndroidModalOpen] = useState(false);

  useEffect(() => {
    registerSW({ immediate: true });
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api
      .me()
      .then(({ user: loadedUser }) => {
        setUser(loadedUser);
      })
      .catch(() => {
        setStoredToken(null);
      });
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  const handleSelectOperation = (op: MathOperation) => {
    playClickSound();
    setSelectedOp(op);
    setActiveView('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (tab: 'student' | 'admin' = 'student') => {
    playClickSound();
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleOpenPayment = (prefillPhone = '') => {
    playClickSound();
    setPaymentPrefillPhone(prefillPhone);
    setPaymentModalOpen(true);
  };

  const handleAuthSuccess = (loggedInUser: PublicUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'admin') {
      setActiveView('admin');
    }
  };

  const handleLogout = () => {
    playClickSound();
    setStoredToken(null);
    setUser(null);
    if (activeView === 'admin') {
      setActiveView('home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeView={activeView}
        user={user}
        onNavigate={(view) => {
          playClickSound();
          setActiveView(view);
        }}
        onOpenPayment={() => handleOpenPayment('')}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <div className="flex-1">
        {activeView === 'home' && (
          <HomeScreen
            user={user}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onSelectOperation={handleSelectOperation}
            onOpenPayment={() => handleOpenPayment('')}
            onOpenAuth={handleOpenAuth}
            onOpenAndroidGuide={() => setAndroidModalOpen(true)}
          />
        )}

        {activeView === 'practice' && (
          <MathSandbox
            initialOp={selectedOp}
            user={user}
            soundOn={soundOn}
            onToggleSound={handleToggleSound}
            onBackHome={() => setActiveView('home')}
            onOpenPayment={() => handleOpenPayment('')}
            onProgressUpdated={(updated) => setUser(updated)}
          />
        )}

        {activeView === 'admin' && user?.role === 'admin' && (
          <AdminDashboard adminUser={user} />
        )}
      </div>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>MathSpark Kids · Học Toán Tiểu Học Trực Quan</span>
          <div className="flex flex-wrap items-center gap-5 font-medium">
            <button
              type="button"
              onClick={() => handleOpenPayment('')}
              className="hover:text-slate-900 cursor-pointer"
            >
              VIP Trọn đời (15.000 VNĐ · Agribank 54955215016444)
            </button>
            <button
              type="button"
              onClick={() => setAndroidModalOpen(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Tải APK Android & PWA
            </button>
            <button
              type="button"
              onClick={() => {
                if (user?.role === 'admin') {
                  setActiveView('admin');
                } else {
                  handleOpenAuth('admin');
                }
              }}
              className="hover:text-slate-900 cursor-pointer"
            >
              Cổng Quản trị Admin
            </button>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        onOpenPayment={(prefill) => handleOpenPayment(prefill || '')}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        initialPhone={paymentPrefillPhone}
        onClose={() => setPaymentModalOpen(false)}
        onSwitchToLogin={() => {
          setPaymentModalOpen(false);
          handleOpenAuth('student');
        }}
      />

      <AndroidModal
        isOpen={androidModalOpen}
        onClose={() => setAndroidModalOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
