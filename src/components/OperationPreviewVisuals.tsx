import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { MathOperation } from '../types';

interface PreviewProps {
  op: MathOperation;
}

export const OperationPreviewVisual: React.FC<PreviewProps> = ({ op }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => (prev + 1) % 6);
    }, 850);
    return () => window.clearInterval(timer);
  }, []);

  if (op === 'add') {
    // 3 coral dots + 2 golden stars counting up 1..5
    const activeCount = (tick % 5) + 1;
    return (
      <div className="flex items-center justify-center gap-2.5 py-2 select-none" aria-hidden="true">
        <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1.5 rounded-xl border border-orange-200">
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              animate={{ scale: activeCount >= n ? 1.15 : 0.92, y: activeCount === n ? -4 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 rounded-full bg-orange-500 inline-block shadow-xs"
            />
          ))}
        </div>
        <span className="font-math font-bold text-orange-700 text-lg">+</span>
        <div className="flex items-center gap-1.5 bg-white/80 px-2.5 py-1.5 rounded-xl border border-orange-200">
          {[4, 5].map((n) => (
            <motion.span
              key={n}
              animate={{ scale: activeCount >= n ? 1.15 : 0.92, y: activeCount === n ? -4 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 rounded-full bg-amber-400 inline-block shadow-xs"
            />
          ))}
        </div>
        <span className="font-math font-bold text-orange-700 text-lg">=</span>
        <span className="font-math font-extrabold text-orange-900 text-lg w-5 text-center">
          {activeCount}
        </span>
      </div>
    );
  }

  if (op === 'sub') {
    // 5 balloons where 2 pop/float away during phases 3..5
    const hideTwo = tick >= 3;
    return (
      <div className="flex items-center justify-center gap-2 py-2 select-none" aria-hidden="true">
        <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-xl border border-sky-200">
          {[1, 2, 3, 4, 5].map((n) => {
            const disappearing = hideTwo && n > 3;
            return (
              <motion.div
                key={n}
                animate={{
                  opacity: disappearing ? 0.2 : 1,
                  y: disappearing ? -10 : 0,
                  scale: disappearing ? 0.75 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`w-5 h-6 rounded-full ${
                  n > 3 ? 'bg-rose-400' : 'bg-sky-500'
                } relative flex items-center justify-center`}
              >
                {disappearing && (
                  <span className="text-[11px] font-bold text-slate-700">×</span>
                )}
              </motion.div>
            );
          })}
        </div>
        <span className="font-math font-bold text-sky-900 text-sm">
          {hideTwo ? '5 − 2 = 3' : '5 bóng'}
        </span>
      </div>
    );
  }

  if (op === 'mul') {
    // 3 grouped boxes of 2 items lighting up sequentially
    const activeGroup = tick % 3;
    return (
      <div className="flex items-center justify-center gap-2 py-2 select-none" aria-hidden="true">
        {[0, 1, 2].map((g) => (
          <motion.div
            key={g}
            animate={{
              scale: activeGroup === g ? 1.08 : 1,
              borderColor: activeGroup === g ? '#d97706' : '#fde68a',
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 bg-white/85 px-2 py-1.5 rounded-xl border-2"
          >
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 inline-block" />
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-500 inline-block" />
          </motion.div>
        ))}
        <span className="font-math font-bold text-amber-900 text-sm ml-1">3 × 2 = 6</span>
      </div>
    );
  }

  // div: 6 items shared equally into 2 bowls
  const shared = tick >= 2;
  return (
    <div className="flex items-center justify-center gap-3 py-2 select-none" aria-hidden="true">
      {[0, 1].map((bowl) => (
        <div
          key={bowl}
          className="flex items-center gap-1 bg-white/85 px-2.5 py-1.5 rounded-b-2xl rounded-t-md border-2 border-emerald-300"
        >
          {[0, 1, 2].map((item) => (
            <motion.span
              key={item}
              animate={{
                scale: shared ? 1 : 0.6,
                opacity: shared ? 1 : 0.45,
                y: shared ? 0 : -6,
              }}
              transition={{ duration: 0.28, delay: item * 0.06 }}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block"
            />
          ))}
        </div>
      ))}
      <span className="font-math font-bold text-emerald-900 text-sm">6 ÷ 2 = 3</span>
    </div>
  );
};
