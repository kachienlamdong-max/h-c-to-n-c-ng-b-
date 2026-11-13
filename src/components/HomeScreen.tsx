import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Crown,
  Divide,
  Minus,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { MathOperation, PublicUser } from '../types';
import { OperationPreviewVisual } from './OperationPreviewVisuals';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeScreenProps {
  user: PublicUser | null;
  soundOn: boolean;
  onToggleSound: () => void;
  onSelectOperation: (op: MathOperation) => void;
  onOpenPayment: () => void;
  onOpenAuth: (tab?: 'student' | 'admin') => void;
  onOpenAndroidGuide: () => void;
}

interface OperationCardConfig {
  op: MathOperation;
  symbol: string;
  title: string;
  subtitle: string;
  visualLabel: string;
  cardBg: string;
  borderColor: string;
  iconBg: string;
  btnBg: string;
  textAccent: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const OPERATION_CARDS: OperationCardConfig[] = [
  {
    op: 'add',
    symbol: '+',
    title: 'Phép Cộng',
    subtitle: 'Gộp các nhóm đồ vật và đếm tăng dần với hiệu ứng nảy sinh động.',
    visualLabel: 'Hình ảnh đếm số sinh động',
    cardBg: 'bg-orange-50/90',
    borderColor: 'border-orange-200 hover:border-orange-400',
    iconBg: 'bg-orange-500 text-white',
    btnBg: 'bg-orange-500 hover:bg-orange-600 border-orange-700',
    textAccent: 'text-orange-800',
    Icon: Plus,
  },
  {
    op: 'sub',
    symbol: '−',
    title: 'Phép Trừ',
    subtitle: 'Quan sát bóng bay nổ và biến mất để biết còn lại bao nhiêu.',
    visualLabel: 'Vật phẩm biến mất trực quan',
    cardBg: 'bg-sky-50/90',
    borderColor: 'border-sky-200 hover:border-sky-400',
    iconBg: 'bg-sky-500 text-white',
    btnBg: 'bg-sky-500 hover:bg-sky-600 border-sky-700',
    textAccent: 'text-sky-800',
    Icon: Minus,
  },
  {
    op: 'mul',
    symbol: '×',
    title: 'Phép Nhân',
    subtitle: 'Khám phá các nhóm bằng nhau và đếm lặp theo từng khay kẹo.',
    visualLabel: 'Nhóm vật phẩm đều nhau',
    cardBg: 'bg-amber-50/90',
    borderColor: 'border-amber-200 hover:border-amber-400',
    iconBg: 'bg-amber-500 text-white',
    btnBg: 'bg-amber-500 hover:bg-amber-600 border-amber-700',
    textAccent: 'text-amber-900',
    Icon: X,
  },
  {
    op: 'div',
    symbol: '÷',
    title: 'Phép Chia',
    subtitle: 'Chia đều bánh kẹo vào từng đĩa để bé hiểu bản chất phép chia.',
    visualLabel: 'Chia đều trực quan',
    cardBg: 'bg-emerald-50/90',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-500 text-white',
    btnBg: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700',
    textAccent: 'text-emerald-800',
    Icon: Divide,
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  soundOn,
  onToggleSound,
  onSelectOperation,
  onOpenPayment,
  onOpenAuth,
  onOpenAndroidGuide,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const isVip = Boolean(user?.isVip);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Banner */}
      <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 font-medium">
                <span>Toán Tiểu Học Trực Quan</span>
                <span aria-hidden="true">·</span>
                {isVip ? (
                  <span className="text-emerald-700 font-semibold">
                    Tài khoản VIP Trọn đời · Xin chào, {user?.name}
                  </span>
                ) : (
                  <span className="text-sky-700 font-semibold">
                    Chế độ Dùng thử miễn phí · Đã mở Cấp độ 1
                  </span>
                )}
              </div>

              <h1
                className="font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-slate-900 leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Học Toán Vui Nhộn Qua Hình Ảnh Sinh Động
              </h1>

              <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                Bé hãy chọn một phép tính bên dưới để cùng đếm, tách nhóm, ghép đôi và chia đều
                với hiệu ứng âm thanh vui tai.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isVip && (
                <button
                  type="button"
                  onClick={onOpenPayment}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Crown className="w-4 h-4" />
                  Mở khóa VIP Trọn đời (15.000 VNĐ)
                </button>
              )}

              {!user && (
                <button
                  type="button"
                  onClick={() => onOpenAuth('student')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 hover:bg-sky-700 border-b-4 border-sky-800 active:border-b-0 active:translate-y-0.5 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  Đăng nhập VIP
                </button>
              )}

              <button
                type="button"
                onClick={onToggleSound}
                aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {soundOn ? (
                  <>
                    <Volume2 className="w-4 h-4 text-sky-600" />
                    Âm thanh: Bật
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    Âm thanh: Tắt
                  </>
                )}
              </button>

              <PWAInstallButton onOpenAndroidGuide={onOpenAndroidGuide} />
            </div>
          </div>

          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="w-full h-56 lg:h-full max-h-64 rounded-2xl overflow-hidden border border-slate-200 bg-amber-50 flex items-center justify-center">
              {!imgFailed ? (
                <img
                  src="/src/assets/images/mascot_owl_teacher_1794581591078.jpg"
                  alt="Thầy giáo cú mèo thân thiện cầm bàn tính học toán"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-amber-800">
                  <Sparkles className="w-10 h-10 mb-2" />
                  <span className="font-display font-bold text-lg">Thầy Cú MathSpark</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4 Distinct Interactive Math Frames */}
      <section aria-label="Các phép tính học tập" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Chọn Phép Tính Của Bé
          </h2>
          {user && (
            <p className="text-sm font-medium text-slate-600 font-math">
              Số sao: {user.progress.stars} · Chuỗi cao nhất: {user.progress.bestStreak}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OPERATION_CARDS.map((card, idx) => {
            const Icon = card.Icon;
            return (
              <motion.div
                key={card.op}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                whileHover={{ y: -3 }}
                onClick={() => onSelectOperation(card.op)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectOperation(card.op);
                  }
                }}
                className={`group rounded-3xl border-2 ${card.borderColor} ${card.cardBg} p-6 shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className={`text-xs font-bold tracking-wide ${card.textAccent}`}>
                        Khung {idx + 1} · {card.visualLabel}
                      </p>
                      <h3 className="font-display text-2xl font-extrabold text-slate-900">
                        {card.title} ({card.symbol})
                      </h3>
                    </div>
                    <div
                      className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-7 h-7 stroke-[2.75]" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">{card.subtitle}</p>
                </div>

                {/* Live Animated Visual Preview Box */}
                <div className="rounded-2xl bg-white/75 border border-slate-200/80 px-3 py-2">
                  <OperationPreviewVisual op={card.op} />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-xs font-semibold text-slate-600 font-math">
                    {user
                      ? `Đã giải: ${user.progress.byOp[card.op]} câu`
                      : 'Cấp độ 1 Miễn phí · Cấp 2–3 VIP'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-2xl ${card.btnBg} border-b-4 px-5 py-2.5 text-sm font-bold text-white transition-all whitespace-nowrap shrink-0`}
                  >
                    Học {card.title}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
};
