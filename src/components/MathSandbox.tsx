import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Lock,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import type { DifficultyLevel, MathOperation, MathQuestion, PublicUser } from '../types';
import { generateQuestion } from '../utils/mathEngine';
import {
  playClickSound,
  playCorrectSound,
  playFanfareSound,
  playIncorrectSound,
} from '../utils/sound';
import { api } from '../utils/api';
import { OperationVisualStage } from './OperationVisualStage';

interface MathSandboxProps {
  initialOp: MathOperation;
  user: PublicUser | null;
  soundOn: boolean;
  onToggleSound: () => void;
  onBackHome: () => void;
  onOpenPayment: () => void;
  onProgressUpdated: (updatedUser: PublicUser) => void;
}

const OP_META: Record<
  MathOperation,
  { label: string; symbol: string; accentBtn: string; badgeText: string }
> = {
  add: {
    label: 'Phép Cộng',
    symbol: '+',
    accentBtn: 'bg-orange-500 text-white',
    badgeText: 'text-orange-700',
  },
  sub: {
    label: 'Phép Trừ',
    symbol: '−',
    accentBtn: 'bg-sky-500 text-white',
    badgeText: 'text-sky-700',
  },
  mul: {
    label: 'Phép Nhân',
    symbol: '×',
    accentBtn: 'bg-amber-500 text-white',
    badgeText: 'text-amber-800',
  },
  div: {
    label: 'Phép Chia',
    symbol: '÷',
    accentBtn: 'bg-emerald-500 text-white',
    badgeText: 'text-emerald-700',
  },
};

const FREE_TRIAL_LIMIT = 6;

export const MathSandbox: React.FC<MathSandboxProps> = ({
  initialOp,
  user,
  soundOn,
  onToggleSound,
  onBackHome,
  onOpenPayment,
  onProgressUpdated,
}) => {
  const isVip = Boolean(user?.isVip);
  const [op, setOp] = useState<MathOperation>(initialOp);
  const [level, setLevel] = useState<DifficultyLevel>(1);
  const [question, setQuestion] = useState<MathQuestion>(() => generateQuestion(initialOp, 1));
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [trialSolved, setTrialSolved] = useState(0);
  const [sessionStars, setSessionStars] = useState(user?.progress.stars ?? 0);
  const [sessionStreak, setSessionStreak] = useState(user?.progress.streak ?? 0);

  useEffect(() => {
    setOp(initialOp);
    setQuestion(generateQuestion(initialOp, level));
    setSelectedAnswer(null);
    setStatus('idle');
  }, [initialOp]);

  useEffect(() => {
    if (user) {
      setSessionStars(user.progress.stars);
      setSessionStreak(user.progress.streak);
    }
  }, [user]);

  const loadNextQuestion = useCallback(
    (nextOp: MathOperation, nextLevel: DifficultyLevel) => {
      setQuestion(generateQuestion(nextOp, nextLevel));
      setSelectedAnswer(null);
      setStatus('idle');
    },
    []
  );

  const handleOpChange = (nextOp: MathOperation) => {
    playClickSound();
    setOp(nextOp);
    loadNextQuestion(nextOp, level);
  };

  const handleLevelChange = (nextLevel: DifficultyLevel) => {
    if (nextLevel > 1 && !isVip) {
      playClickSound();
      onOpenPayment();
      return;
    }
    playClickSound();
    setLevel(nextLevel);
    loadNextQuestion(op, nextLevel);
  };

  const handleAnswerClick = async (choice: number) => {
    if (status === 'correct') return;

    if (!isVip && trialSolved >= FREE_TRIAL_LIMIT) {
      onOpenPayment();
      return;
    }

    setSelectedAnswer(choice);
    const isCorrect = choice === question.answer;

    if (isCorrect) {
      setStatus('correct');
      const nextStreak = sessionStreak + 1;
      setSessionStars((s) => s + 1);
      setSessionStreak(nextStreak);

      if (nextStreak > 0 && nextStreak % 5 === 0) {
        playFanfareSound();
      } else {
        playCorrectSound();
      }

      if (!isVip) {
        setTrialSolved((count) => count + 1);
      }

      if (user) {
        try {
          const { progress } = await api.recordProgress(op, true);
          onProgressUpdated({ ...user, progress });
        } catch {
          // Offline play continues seamlessly
        }
      }
    } else {
      setStatus('wrong');
      setSessionStreak(0);
      playIncorrectSound();

      if (user) {
        try {
          const { progress } = await api.recordProgress(op, false);
          onProgressUpdated({ ...user, progress });
        } catch {
          // Offline play continues seamlessly
        }
      }
    }
  };

  const handleNextClick = () => {
    playClickSound();
    if (!isVip && trialSolved >= FREE_TRIAL_LIMIT) {
      onOpenPayment();
      return;
    }
    loadNextQuestion(op, level);
  };

  const trialRemaining = Math.max(0, FREE_TRIAL_LIMIT - trialSolved);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onBackHome();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Trang chủ
          </button>

          {/* Operation Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['add', 'sub', 'mul', 'div'] as MathOperation[]).map((item) => {
              const meta = OP_META[item];
              const active = op === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleOpChange(item)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? `${meta.accentBtn} shadow-xs`
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {meta.symbol} <span className="hidden sm:inline">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Levels + Score */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {([1, 2, 3] as DifficultyLevel[]).map((lvl) => {
              const locked = lvl > 1 && !isVip;
              const active = level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleLevelChange(lvl)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {locked && <Lock className="w-3 h-3 text-amber-600" />}
                  Cấp độ {lvl}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 font-math px-2">
            <span className="inline-flex items-center gap-1 text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              {sessionStars}
            </span>
            <span aria-hidden="true">·</span>
            <span>Chuỗi đúng: {sessionStreak}</span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-sky-600" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Trial Banner if not VIP */}
      {!isVip && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-3">
          <p className="text-sm text-amber-950 font-medium">
            Chế độ Dùng thử miễn phí · Còn <strong className="font-math">{trialRemaining}</strong>{' '}
            lượt giải miễn phí trong phiên này. Nâng cấp một lần chỉ{' '}
            <strong className="font-math">15.000 VNĐ</strong> để mở khóa VIP trọn đời cả 3 cấp độ.
          </p>
          <button
            type="button"
            onClick={onOpenPayment}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            Mở khóa VIP (15.000 VNĐ)
          </button>
        </div>
      )}

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Zone: Visual Stage (60%) */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
          <OperationVisualStage question={question} revealAnswer={status === 'correct'} />
        </div>

        {/* Right Zone: Equation & Answer Deck (40%) */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between gap-6">
          <div className="space-y-2 text-center">
            <p className={`text-xs font-bold uppercase tracking-wider ${OP_META[op].badgeText}`}>
              {OP_META[op].label} · Cấp độ {level}
            </p>
            <div className="py-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="font-math text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {question.a} {OP_META[op].symbol} {question.b} ={' '}
                <span className={status === 'correct' ? 'text-emerald-600' : 'text-sky-600'}>
                  {status === 'correct' ? question.answer : '?'}
                </span>
              </div>
            </div>
          </div>

          {/* Choice Buttons */}
          <div className="grid grid-cols-2 gap-3.5">
            {question.choices.map((choice) => {
              const isSelected = selectedAnswer === choice;
              const isCorrectChoice = status === 'correct' && choice === question.answer;
              const isWrongChoice = status === 'wrong' && isSelected;

              let btnStyle =
                'bg-slate-50 hover:bg-sky-50 border-slate-300 hover:border-sky-400 text-slate-900 border-b-4';
              if (isCorrectChoice) {
                btnStyle = 'bg-emerald-500 border-emerald-700 text-white border-b-4';
              } else if (isWrongChoice) {
                btnStyle = 'bg-rose-500 border-rose-700 text-white border-b-4';
              }

              return (
                <motion.button
                  key={choice}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  animate={
                    isWrongChoice
                      ? { x: [-6, 6, -4, 4, 0] }
                      : isCorrectChoice
                        ? { scale: [1, 1.05, 1] }
                        : {}
                  }
                  transition={{ duration: 0.25 }}
                  onClick={() => handleAnswerClick(choice)}
                  className={`min-h-[72px] rounded-2xl border-2 font-math text-2xl sm:text-3xl font-extrabold transition-colors cursor-pointer flex items-center justify-center ${btnStyle}`}
                >
                  {choice}
                </motion.button>
              );
            })}
          </div>

          {/* Feedback Area */}
          <AnimatePresence mode="wait">
            {status === 'correct' && (
              <motion.div
                key="correct"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Tuyệt vời! {question.a} {OP_META[op].symbol} {question.b} = {question.answer}!
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-500 ml-auto shrink-0" />
                </div>
                <button
                  type="button"
                  onClick={handleNextClick}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 border-b-4 border-emerald-800 py-3 text-sm font-bold text-white cursor-pointer"
                >
                  Câu tiếp theo
                </button>
              </motion.div>
            )}

            {status === 'wrong' && (
              <motion.div
                key="wrong"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-2.5 text-rose-900 text-sm font-semibold"
              >
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Chưa đúng rồi! Bé hãy bấm nút minh họa bên trái để đếm lại nhé.</span>
              </motion.div>
            )}

            {status === 'idle' && (
              <div className="text-center text-xs font-medium text-slate-500 py-2">
                Chọn đáp án đúng ở trên hoặc bấm nút xem minh họa trực quan.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
};
