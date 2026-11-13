import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw } from 'lucide-react';
import type { MathQuestion } from '../types';
import { playCountTick } from '../utils/sound';

interface OperationVisualStageProps {
  question: MathQuestion;
  revealAnswer: boolean;
}

export const OperationVisualStage: React.FC<OperationVisualStageProps> = ({
  question,
  revealAnswer,
}) => {
  const { op, a, b, answer } = question;
  const [animStep, setAnimStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setAnimStep(0);
    setIsPlaying(false);
  }, [question.id]);

  useEffect(() => {
    if (revealAnswer) {
      if (op === 'add') setAnimStep(a + b);
      if (op === 'sub') setAnimStep(b);
      if (op === 'mul') setAnimStep(a);
      if (op === 'div') setAnimStep(b);
      setIsPlaying(false);
    }
  }, [revealAnswer, op, a, b]);

  useEffect(() => {
    if (!isPlaying) return;

    const totalSteps =
      op === 'add'
        ? Math.min(a + b, 24)
        : op === 'sub'
          ? Math.min(b, 20)
          : op === 'mul'
            ? a
            : b;

    if (animStep >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const next = animStep + 1;
      setAnimStep(next);
      playCountTick(next);
    }, 340);

    return () => window.clearTimeout(timer);
  }, [isPlaying, animStep, op, a, b]);

  const handlePlay = () => {
    setAnimStep(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAnimStep(0);
  };

  const renderAdditionVisual = () => {
    const useBaseTen = a + b > 20;
    if (useBaseTen) {
      const aTens = Math.floor(a / 10);
      const aOnes = a % 10;
      const bTens = Math.floor(b / 10);
      const bOnes = b % 10;
      return (
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-orange-800 font-math">{a}</span>
            <div className="flex flex-wrap items-end gap-1.5 max-w-[180px] justify-center">
              {Array.from({ length: aTens }).map((_, i) => (
                <div
                  key={`at-${i}`}
                  className="w-4 h-12 rounded-md bg-orange-500 border border-orange-600 flex flex-col justify-evenly items-center py-0.5"
                  title="10"
                >
                  <span className="w-2 h-0.5 bg-orange-200" />
                  <span className="w-2 h-0.5 bg-orange-200" />
                </div>
              ))}
              {Array.from({ length: aOnes }).map((_, i) => (
                <div
                  key={`ao-${i}`}
                  className="w-4 h-4 rounded-sm bg-orange-400 border border-orange-600"
                />
              ))}
            </div>
          </div>

          <span className="font-math text-3xl font-extrabold text-orange-600">+</span>

          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-amber-800 font-math">{b}</span>
            <div className="flex flex-wrap items-end gap-1.5 max-w-[180px] justify-center">
              {Array.from({ length: bTens }).map((_, i) => (
                <div
                  key={`bt-${i}`}
                  className="w-4 h-12 rounded-md bg-amber-500 border border-amber-600 flex flex-col justify-evenly items-center py-0.5"
                  title="10"
                >
                  <span className="w-2 h-0.5 bg-amber-200" />
                  <span className="w-2 h-0.5 bg-amber-200" />
                </div>
              ))}
              {Array.from({ length: bOnes }).map((_, i) => (
                <div
                  key={`bo-${i}`}
                  className="w-4 h-4 rounded-sm bg-amber-400 border border-amber-600"
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
          <p className="text-xs font-bold text-orange-800 mb-2 text-center font-math">
            Nhóm 1 ({a})
          </p>
          <div className="flex flex-wrap gap-2 max-w-[200px] justify-center">
            {Array.from({ length: a }).map((_, idx) => {
              const countNum = idx + 1;
              const lit = animStep >= countNum;
              return (
                <motion.div
                  key={`a-${idx}`}
                  animate={{
                    scale: animStep === countNum ? 1.2 : lit ? 1.05 : 1,
                    y: animStep === countNum ? -6 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-math text-xs font-bold shadow-xs border-2 ${
                    lit
                      ? 'bg-orange-500 border-orange-600 text-white'
                      : 'bg-orange-200 border-orange-300 text-orange-900'
                  }`}
                >
                  {lit ? countNum : ''}
                </motion.div>
              );
            })}
          </div>
        </div>

        <span className="font-math text-3xl font-extrabold text-orange-600">+</span>

        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-bold text-amber-900 mb-2 text-center font-math">
            Nhóm 2 ({b})
          </p>
          <div className="flex flex-wrap gap-2 max-w-[200px] justify-center">
            {Array.from({ length: b }).map((_, idx) => {
              const countNum = a + idx + 1;
              const lit = animStep >= countNum;
              return (
                <motion.div
                  key={`b-${idx}`}
                  animate={{
                    scale: animStep === countNum ? 1.2 : lit ? 1.05 : 1,
                    y: animStep === countNum ? -6 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-math text-xs font-bold shadow-xs border-2 ${
                    lit
                      ? 'bg-amber-500 border-amber-600 text-white'
                      : 'bg-amber-200 border-amber-300 text-amber-900'
                  }`}
                >
                  {lit ? countNum : ''}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSubtractionVisual = () => {
    if (a > 24) {
      const aTens = Math.floor(a / 10);
      const aOnes = a % 10;
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-sky-50 border border-sky-200 p-5 flex flex-wrap items-end justify-center gap-2 max-w-md">
            {Array.from({ length: aTens }).map((_, i) => (
              <div
                key={`st-${i}`}
                className="w-5 h-14 rounded-md bg-sky-500 border border-sky-700 text-[10px] font-bold text-white flex items-center justify-center font-math"
              >
                10
              </div>
            ))}
            {Array.from({ length: aOnes }).map((_, i) => (
              <div
                key={`so-${i}`}
                className="w-5 h-5 rounded-sm bg-sky-300 border border-sky-500"
              />
            ))}
          </div>
          <p className="text-sm font-semibold text-sky-900 font-math">
            Ban đầu có {a} · Lấy bớt {b}{' '}
            {revealAnswer ? `= Còn lại ${answer}` : ''}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-sky-50 border border-sky-200 p-5 flex flex-wrap items-center justify-center gap-3 max-w-lg">
          {Array.from({ length: a }).map((_, idx) => {
            const removeOrder = a - idx;
            const isTargetToRemove = removeOrder <= b;
            const hasDisappeared = isTargetToRemove && animStep >= removeOrder;

            return (
              <motion.div
                key={`sub-${idx}`}
                animate={{
                  opacity: hasDisappeared ? 0.22 : 1,
                  y: hasDisappeared ? -16 : 0,
                  scale: hasDisappeared ? 0.78 : 1,
                }}
                transition={{ duration: 0.28 }}
                className={`w-10 h-12 rounded-full flex items-center justify-center font-math text-xs font-bold border-2 relative ${
                  isTargetToRemove
                    ? 'bg-rose-400 border-rose-500 text-white'
                    : 'bg-sky-500 border-sky-600 text-white'
                }`}
              >
                {hasDisappeared ? '×' : idx + 1}
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs font-semibold text-slate-600 font-math">
          {animStep > 0
            ? `Đã lấy bớt: ${Math.min(animStep, b)} / ${b} · Còn lại: ${a - Math.min(animStep, b)}`
            : `Tổng bóng bay: ${a} · Bấm nút phía trên để xem bớt đi ${b}`}
        </p>
      </div>
    );
  };

  const renderMultiplicationVisual = () => {
    const showDotsInside = b <= 9 && a <= 8;
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl">
          {Array.from({ length: a }).map((_, groupIdx) => {
            const active = animStep > groupIdx;
            return (
              <motion.div
                key={`mul-g-${groupIdx}`}
                animate={{
                  scale: animStep === groupIdx + 1 ? 1.08 : 1,
                  borderColor: active ? '#d97706' : '#fcd34d',
                }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl border-2 p-3 min-w-[78px] flex flex-col items-center gap-1.5 ${
                  active ? 'bg-amber-100' : 'bg-amber-50/80'
                }`}
              >
                <span className="text-[11px] font-bold text-amber-900 font-math">
                  Nhóm {groupIdx + 1}
                </span>
                {showDotsInside ? (
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: b }).map((_, itemIdx) => (
                      <span
                        key={`mi-${itemIdx}`}
                        className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block"
                      />
                    ))}
                  </div>
                ) : (
                  <span className="font-math text-lg font-extrabold text-amber-800">{b}</span>
                )}
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs font-semibold text-slate-600 font-math">
          {animStep > 0
            ? `${animStep} nhóm × ${b} = ${animStep * b}`
            : `${a} nhóm đều nhau, mỗi nhóm có ${b} viên`}
        </p>
      </div>
    );
  };

  const renderDivisionVisual = () => {
    const perBowlShown = answer;
    const compactNumbers = perBowlShown > 8;

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-900 font-math">
          Tổng số kẹo chia đều: {a} ÷ {b} đĩa
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3.5 max-w-xl">
          {Array.from({ length: b }).map((_, bowlIdx) => {
            const filled = animStep > bowlIdx || revealAnswer;
            return (
              <motion.div
                key={`div-b-${bowlIdx}`}
                animate={{
                  scale: animStep === bowlIdx + 1 ? 1.07 : 1,
                }}
                transition={{ duration: 0.22 }}
                className={`rounded-b-3xl rounded-t-xl border-2 px-4 py-3 min-w-[92px] flex flex-col items-center gap-2 ${
                  filled
                    ? 'bg-emerald-100 border-emerald-500'
                    : 'bg-white border-emerald-200'
                }`}
              >
                <span className="text-[11px] font-bold text-emerald-900 font-math">
                  Đĩa {bowlIdx + 1}
                </span>
                {filled ? (
                  compactNumbers ? (
                    <span className="font-math text-lg font-extrabold text-emerald-800">
                      {perBowlShown}
                    </span>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-1 max-w-[74px]">
                      {Array.from({ length: perBowlShown }).map((_, itemIdx) => (
                        <motion.span
                          key={`di-${itemIdx}`}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2, delay: itemIdx * 0.04 }}
                          className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block"
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <span className="text-xs text-slate-400 font-math">?</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-between h-full gap-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Khu vực Minh họa Trực quan
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlay}
            disabled={isPlaying}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            {op === 'add'
              ? 'Cùng đếm nhé'
              : op === 'sub'
                ? 'Xem lấy bớt'
                : op === 'mul'
                  ? 'Đếm theo nhóm'
                  : 'Chia đều ngay'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Đặt lại minh họa"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-100 p-2 text-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] flex items-center justify-center rounded-2xl bg-slate-50/80 border border-slate-200 p-4">
        {op === 'add' && renderAdditionVisual()}
        {op === 'sub' && renderSubtractionVisual()}
        {op === 'mul' && renderMultiplicationVisual()}
        {op === 'div' && renderDivisionVisual()}
      </div>
    </div>
  );
};
