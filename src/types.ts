export type MathOperation = 'add' | 'sub' | 'mul' | 'div';

export type DifficultyLevel = 1 | 2 | 3;

export type UserRole = 'admin' | 'customer';

export interface UserProgress {
  stars: number;
  streak: number;
  bestStreak: number;
  solvedCount: number;
  byOp: {
    add: number;
    sub: number;
    mul: number;
    div: number;
  };
}

export interface PublicUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  isVip: boolean;
  status: 'active' | 'suspended';
  plan: 'lifetime' | 'admin';
  paymentRef?: string;
  createdAt: string;
  lastLoginAt?: string;
  progress: UserProgress;
}

export interface PaymentNotification {
  id: string;
  phone: string;
  studentName: string;
  amountVnd: number;
  bank: string;
  accountNumber: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PaymentInfo {
  lifetimeFeeVnd: number;
  bank: string;
  accountNumber: string;
  accountHolder: string;
  currency: string;
}

export interface MathQuestion {
  id: string;
  op: MathOperation;
  a: number;
  b: number;
  answer: number;
  choices: number[];
  level: DifficultyLevel;
}
