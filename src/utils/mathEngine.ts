import type { DifficultyLevel, MathOperation, MathQuestion } from '../types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildChoices(answer: number, minChoice: number, maxChoice: number): number[] {
  const set = new Set<number>([answer]);
  let attempts = 0;
  while (set.size < 4 && attempts < 60) {
    attempts++;
    const delta = randInt(-4, 4);
    const candidate = answer + delta;
    if (candidate >= minChoice && candidate <= maxChoice && candidate !== answer) {
      set.add(candidate);
    }
  }
  while (set.size < 4) {
    const candidate = randInt(minChoice, Math.max(maxChoice, answer + 6));
    if (candidate !== answer) set.add(candidate);
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function generateQuestion(op: MathOperation, level: DifficultyLevel): MathQuestion {
  let a = 1;
  let b = 1;
  let answer = 2;

  if (op === 'add') {
    if (level === 1) {
      a = randInt(1, 7);
      b = randInt(1, 6);
    } else if (level === 2) {
      a = randInt(5, 18);
      b = randInt(4, 15);
    } else {
      a = randInt(14, 58);
      b = randInt(12, 45);
    }
    answer = a + b;
  } else if (op === 'sub') {
    if (level === 1) {
      a = randInt(4, 10);
      b = randInt(1, a - 1);
    } else if (level === 2) {
      a = randInt(12, 32);
      b = randInt(3, Math.min(18, a - 1));
    } else {
      a = randInt(35, 95);
      b = randInt(12, a - 5);
    }
    answer = a - b;
  } else if (op === 'mul') {
    if (level === 1) {
      a = randInt(2, 4);
      b = randInt(2, 4);
    } else if (level === 2) {
      a = randInt(2, 6);
      b = randInt(2, 7);
    } else {
      a = randInt(4, 11);
      b = randInt(3, 9);
    }
    answer = a * b;
  } else {
    if (level === 1) {
      b = randInt(2, 4);
      answer = randInt(1, 4);
      a = b * answer;
    } else if (level === 2) {
      b = randInt(2, 6);
      answer = randInt(2, 7);
      a = b * answer;
    } else {
      b = randInt(3, 9);
      answer = randInt(3, 12);
      a = b * answer;
    }
  }

  const minBound = op === 'sub' ? 0 : 1;
  const maxBound = Math.max(answer + 8, 12);

  return {
    id: `${op}-${level}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    op,
    a,
    b,
    answer,
    choices: buildChoices(answer, minBound, maxBound),
    level,
  };
}
