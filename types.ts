export interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'savings';
  amount: number;
  category: string;
  date: string;
  merchant?: string;
  icon?: string;
  note?: string;
}

export interface Capsule {
  id: string;
  name: string;
  spent: number;
  total: number;
  icon: string;
  color?: string; // Optional override
}

export type ChallengeStatus = 'locked' | 'available' | 'active' | 'completed';

export interface ChallengeDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface ChallengeState {
  status: ChallengeStatus;
  unlockTime?: number; // Timestamp when it becomes available
}

export interface UserStats {
  currentBalance: number;
  monthlyExpenses: number;
  totalSavings: number;
  savingsGoals: {
    name: string;
    current: number;
    target: number;
    color?: string;
  }[];
  streakDays: number;
  xp: number;
  level: number;
  levelTitle: string;
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'MYR';

export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: 'expense' | 'income' | 'savings';
  amount: number;
  category: string;
  icon: string;
  note?: string;
  interval: RecurrenceInterval;
  startDate: string;
  nextDate: string;
}

export interface LevelDef {
  level: number;
  name: string;
  minXp: number;
  artifact: string;
  artifactIcon: string;
  phase: string;
}