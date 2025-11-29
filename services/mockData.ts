import { Transaction, Capsule, UserStats } from '../types';

export const initialStats: UserStats = {
  currentBalance: 12450.78,
  monthlyExpenses: 1834.50,
  totalSavings: 8200.00,
  streakDays: 14,
  savingsGoals: [
    { name: "Emergency Fund", current: 3000, target: 5000 },
    { name: "New Car", current: 5000, target: 20000 }
  ],
  xp: 550,
  level: 4,
  levelTitle: 'Smart Spender'
};

export const initialCapsules: Capsule[] = [
  { id: '1', name: 'Food', spent: 150, total: 400, icon: 'restaurant' },
  { id: '2', name: 'Transport', spent: 70, total: 150, icon: 'directions_bus' },
  { id: '3', name: 'Entertainment', spent: 30, total: 150, icon: 'theaters' },
  { id: '4', name: 'Utilities', spent: 185, total: 200, icon: 'bolt' },
];

export const initialTransactions: Transaction[] = [
  { id: '1', type: 'expense', amount: 450.25, category: 'Groceries', date: '2023-10-25', icon: 'shopping_cart' },
  { id: '2', type: 'expense', amount: 120.00, category: 'Transport', date: '2023-10-24', icon: 'directions_car' },
  { id: '3', type: 'expense', amount: 215.50, category: 'Restaurants', date: '2023-10-23', icon: 'restaurant' },
  { id: '4', type: 'income', amount: 3500.00, category: 'Salary', date: '2023-10-15', icon: 'payments' },
];