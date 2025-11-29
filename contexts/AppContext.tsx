import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Transaction, Capsule, UserStats, Currency, RecurringTransaction, RecurrenceInterval, ChallengeStatus, ChallengeState, ChallengeDef, LevelDef } from '../types';

// Centralized Challenge Definitions
// We include a 'criteria' function here for internal logic, but allow the type to be flexible
interface ChallengeDefinition extends ChallengeDef {
    criteria?: (stats: UserStats, txs: Transaction[]) => boolean;
}

export const CHALLENGES: ChallengeDefinition[] = [
    { 
        id: 'c1', 
        title: 'No Eat Out Week', 
        description: 'Spend $0 on Dining/Restaurants in the last 7 days.', 
        icon: 'restaurant_menu', 
        xpReward: 150,
        criteria: (stats, txs) => {
            const today = new Date();
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            const dateStr = sevenDaysAgo.toISOString().split('T')[0];
            
            // Check if user has been active at all in last 7 days (avoid fresh account auto-win)
            const hasRecentActivity = txs.some(t => t.date >= dateStr);
            if (!hasRecentActivity) return false;

            // Check for dining expenses
            const hasDiningSpend = txs.some(t => {
                const cat = t.category.toLowerCase();
                return t.type === 'expense' && 
                       t.date >= dateStr && 
                       (cat === 'food & dining' || cat === 'restaurants' || cat === 'dining' || cat === 'fast food');
            });
            
            return !hasDiningSpend;
        }
    },
    { 
        id: 'c2', 
        title: 'Reduce Expenses', 
        description: 'Spend $20 less this week compared to last week.', 
        icon: 'trending_down', 
        xpReward: 100,
        criteria: (stats, txs) => {
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            
            const d1 = oneWeekAgo.toISOString().split('T')[0];
            const d2 = twoWeeksAgo.toISOString().split('T')[0];
            const dNow = now.toISOString().split('T')[0];

            const thisWeekSpend = txs
                .filter(t => t.type === 'expense' && t.date >= d1 && t.date <= dNow)
                .reduce((sum, t) => sum + t.amount, 0);

            const lastWeekSpend = txs
                .filter(t => t.type === 'expense' && t.date >= d2 && t.date < d1)
                .reduce((sum, t) => sum + t.amount, 0);

            // Valid only if last week had meaningful spend (> $50) to compare against
            return lastWeekSpend > 50 && (lastWeekSpend - thisWeekSpend) >= 20;
        }
    },
    { 
        id: 'c3', 
        title: 'Savings Starter', 
        description: 'Reach $100 in total savings to unlock your potential.', 
        icon: 'savings', 
        xpReward: 200,
        criteria: (s) => s.totalSavings >= 100
    },
    { 
        id: 'c4', 
        title: 'No Spend Weekend', 
        description: 'Spend nothing on the most recent Saturday & Sunday.', 
        icon: 'weekend', 
        xpReward: 300,
        criteria: (stats, txs) => {
            const d = new Date();
            const day = d.getDay(); // 0 is Sun, 6 is Sat
            
            // Calculate date of the most recent FULL Saturday and Sunday that have passed.
            // If today is Sunday (0), we look at *last* weekend, not today.
            const lastSunday = new Date();
            lastSunday.setDate(d.getDate() - (day === 0 ? 7 : day));
            
            const lastSaturday = new Date(lastSunday);
            lastSaturday.setDate(lastSunday.getDate() - 1);
            
            const satStr = lastSaturday.toISOString().split('T')[0];
            const sunStr = lastSunday.toISOString().split('T')[0];
            
            const weekendSpend = txs
                .filter(t => t.type === 'expense' && (t.date === satStr || t.date === sunStr))
                .reduce((sum, t) => sum + t.amount, 0);

            // Ensure we have history prior to that weekend
            const hasHistory = txs.some(t => t.date < satStr);

            return hasHistory && weekendSpend === 0;
        }
    },
    {
        id: 'c8',
        title: 'First Harvest',
        description: 'Record your first income transaction to start the flow.',
        icon: 'monetization_on',
        xpReward: 200,
        criteria: (s, txs) => txs.some(t => t.type === 'income')
    },
    // Initially Locked Challenges
    { 
        id: 'c5', 
        title: 'Goal Setter', 
        description: 'Create at least 1 savings goal to visualize your dreams.', 
        icon: 'flag', 
        xpReward: 150,
        criteria: (s) => s.savingsGoals.length >= 1
    },
    { 
        id: 'c6', 
        title: 'Budget Master', 
        description: 'Log over $500 in monthly expenses to track high flow.', 
        icon: 'account_balance_wallet', 
        xpReward: 250,
        criteria: (s) => s.monthlyExpenses >= 500
    },
    {
        id: 'c7',
        title: 'Income Stream',
        description: 'Log at least one income transaction.',
        icon: 'payments',
        xpReward: 200,
        criteria: (s, txs) => txs.some(t => t.type === 'income')
    }
];

const INITIAL_LOCKED = ['c5', 'c6', 'c7'];

interface AppContextType {
  stats: UserStats;
  capsules: Capsule[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  challengeStates: Record<string, ChallengeState>;
  currency: Currency;
  isSettingsOpen: boolean;
  isTranslucent: boolean;
  challenges: ChallengeDefinition[];
  recentlyCompletedChallenge: ChallengeDef | null;
  newLevelData: LevelDef | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, updatedTx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addCapsule: (capsule: Omit<Capsule, 'id'>) => void;
  editCapsule: (id: string, updatedCapsule: Partial<Capsule>) => void;
  deleteCapsule: (id: string) => void;
  addSavingsGoal: (goal: { name: string; target: number; current?: number }) => void;
  updateSavingsGoal: (goalName: string, amount: number) => void;
  editSavingsGoal: (oldName: string, updatedGoal: { name: string; target: number; current: number }) => void;
  deleteSavingsGoal: (goalName: string) => void;
  addRecurringTransaction: (recurring: Omit<RecurringTransaction, 'id' | 'nextDate'>) => void;
  deleteRecurringTransaction: (id: string) => void;
  acceptChallenge: (id: string) => void; // Replaces updateChallengeStatus for general use
  claimChallengeReward: (id: string) => void; // Manual claim if needed, though we auto-complete mostly
  resetData: () => void;
  setCurrency: (c: Currency) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setTranslucent: (isTranslucent: boolean) => void;
  formatCurrency: (amount: number) => string;
  nextLevelXp: number;
  clearChallengeNotification: () => void;
  clearLevelUp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Level Definitions with Artifacts and Phases
// UPDATED: Steepened XP curve significantly
export const LEVELS: LevelDef[] = [
  // Phase 1: Foundations
  { level: 1, name: 'Novice', minXp: 0, artifact: 'Coin', artifactIcon: 'monetization_on', phase: 'Foundations' },
  { level: 2, name: 'Learner', minXp: 300, artifact: 'Wallet', artifactIcon: 'account_balance_wallet', phase: 'Foundations' },
  { level: 3, name: 'Apprentice', minXp: 750, artifact: 'Piggy Bank', artifactIcon: 'savings', phase: 'Foundations' },
  { level: 4, name: 'Explorer', minXp: 1300, artifact: 'Ledger', artifactIcon: 'receipt_long', phase: 'Foundations' },
  { level: 5, name: 'Saver', minXp: 2000, artifact: 'Balance', artifactIcon: 'balance', phase: 'Foundations' },

  // Phase 2: Growth
  { level: 6, name: 'Planner', minXp: 2800, artifact: 'Budget', artifactIcon: 'pie_chart', phase: 'Growth' },
  { level: 7, name: 'Keeper', minXp: 3800, artifact: 'Plan', artifactIcon: 'assignment_turned_in', phase: 'Growth' },
  { level: 8, name: 'Builder', minXp: 5000, artifact: 'Chart', artifactIcon: 'monitoring', phase: 'Growth' },
  { level: 9, name: 'Strategist', minXp: 6400, artifact: 'Streak', artifactIcon: 'local_fire_department', phase: 'Growth' },
  { level: 10, name: 'Analyst', minXp: 8000, artifact: 'Goal', artifactIcon: 'flag', phase: 'Growth' },

  // Phase 3: Wealth Building
  { level: 11, name: 'Controller', minXp: 9800, artifact: 'Vault', artifactIcon: 'lock', phase: 'Wealth Building' },
  { level: 12, name: 'Optimizer', minXp: 11800, artifact: 'Key', artifactIcon: 'vpn_key', phase: 'Wealth Building' },
  { level: 13, name: 'Specialist', minXp: 14000, artifact: 'Crown', artifactIcon: 'emoji_events', phase: 'Wealth Building' },
  { level: 14, name: 'Expert', minXp: 16500, artifact: 'Gem', artifactIcon: 'diamond', phase: 'Wealth Building' },
  { level: 15, name: 'Master', minXp: 19500, artifact: 'Treasure', artifactIcon: 'inventory_2', phase: 'Wealth Building' },

  // Phase 4: Freedom
  { level: 16, name: 'Guru', minXp: 23000, artifact: 'Path', artifactIcon: 'alt_route', phase: 'Freedom' },
  { level: 17, name: 'Commander', minXp: 27000, artifact: 'Bridge', artifactIcon: 'architecture', phase: 'Freedom' },
  { level: 18, name: 'Visionary', minXp: 31500, artifact: 'Horizon', artifactIcon: 'wb_twilight', phase: 'Freedom' },
  { level: 19, name: 'Architect', minXp: 36500, artifact: 'Estate', artifactIcon: 'domain', phase: 'Freedom' },
  { level: 20, name: 'Legend', minXp: 42000, artifact: 'Legacy', artifactIcon: 'auto_awesome', phase: 'Freedom' },
];

const defaultStats: UserStats = {
  currentBalance: 0,
  monthlyExpenses: 0,
  totalSavings: 0,
  savingsGoals: [],
  streakDays: 0,
  xp: 0,
  level: 1,
  levelTitle: 'Novice'
};

const getLocalStorage = <T,>(key: string, initialValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return initialValue;
  }
};

const setLocalStorage = <T,>(key: string, value: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving localStorage key "${key}":`, error);
  }
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const CURRENCY_FORMATS: Record<Currency, string> = {
  USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP', INR: 'en-IN', MYR: 'en-MY'
};

const CURRENCY_CODES: Record<Currency, string> = {
  USD: 'USD', EUR: 'EUR', GBP: 'GBP', JPY: 'JPY', INR: 'INR', MYR: 'MYR'
};

const getNextDate = (dateStr: string, interval: RecurrenceInterval): string => {
    const date = new Date(dateStr);
    switch (interval) {
        case 'daily': date.setDate(date.getDate() + 1); break;
        case 'weekly': date.setDate(date.getDate() + 7); break;
        case 'monthly': date.setMonth(date.getMonth() + 1); break;
        case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    }
    return date.toISOString().split('T')[0];
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>(() => getLocalStorage('ecobudget_stats_v3', defaultStats));
  const [capsules, setCapsules] = useState<Capsule[]>(() => getLocalStorage('ecobudget_capsules_v2', []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getLocalStorage('ecobudget_transactions_v2', []));
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => getLocalStorage('ecobudget_recurring_v2', []));
  
  // Initialize challenges with locked status for specific ones
  const [challengeStates, setChallengeStates] = useState<Record<string, ChallengeState>>(() => {
    const stored = getLocalStorage<Record<string, ChallengeState>>('ecobudget_challenges_v2', {});
    // Merge with defaults if empty or missing
    const initial: Record<string, ChallengeState> = { ...stored };
    CHALLENGES.forEach(c => {
        if (!initial[c.id]) {
            initial[c.id] = { 
                status: INITIAL_LOCKED.includes(c.id) ? 'locked' : 'available' 
            };
        }
    });
    return initial;
  });
  
  const [currency, setCurrencyState] = useState<Currency>(() => getLocalStorage('ecobudget_currency_v2', 'USD'));
  const [isTranslucent, setTranslucentState] = useState<boolean>(() => getLocalStorage('ecobudget_theme_translucent', false));
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Animation States
  const [recentlyCompletedChallenge, setRecentlyCompletedChallenge] = useState<ChallengeDef | null>(null);
  const [newLevelData, setNewLevelData] = useState<LevelDef | null>(null);
  const prevLevelRef = useRef<number>(stats.level || 1);

  useEffect(() => { setLocalStorage('ecobudget_stats_v3', stats); }, [stats]);
  useEffect(() => { setLocalStorage('ecobudget_capsules_v2', capsules); }, [capsules]);
  useEffect(() => { setLocalStorage('ecobudget_transactions_v2', transactions); }, [transactions]);
  useEffect(() => { setLocalStorage('ecobudget_recurring_v2', recurringTransactions); }, [recurringTransactions]);
  useEffect(() => { setLocalStorage('ecobudget_challenges_v2', challengeStates); }, [challengeStates]);
  useEffect(() => { setLocalStorage('ecobudget_currency_v2', currency); }, [currency]);
  useEffect(() => { setLocalStorage('ecobudget_theme_translucent', isTranslucent); }, [isTranslucent]);

  const setCurrency = (c: Currency) => setCurrencyState(c);
  const setTranslucent = (t: boolean) => setTranslucentState(t);
  const clearChallengeNotification = () => setRecentlyCompletedChallenge(null);
  const clearLevelUp = () => setNewLevelData(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_FORMATS[currency], {
      style: 'currency',
      currency: CURRENCY_CODES[currency],
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
  };

  const calculateStreak = (txs: Transaction[]) => {
    const uniqueDates = Array.from(new Set(txs.map(t => t.date))).sort((a, b) => b.localeCompare(a));
    if (uniqueDates.length === 0) return 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
    let streak = 1;
    let currentDate = new Date(uniqueDates[0]);
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) { streak++; currentDate = prevDate; } else { break; }
    }
    return streak;
  };

  const calculateLevelData = (xp: number) => {
      const levelData = [...LEVELS].reverse().find(l => xp >= l.minXp) || LEVELS[0];
      return levelData;
  };

  // --- Auto-Detection & Challenge Logic ---

  // Check for auto-completions whenever stats/transactions change
  useEffect(() => {
      let hasChanges = false;
      const newStates = { ...challengeStates };
      let totalXpReward = 0;
      let completedId: string | null = null;

      CHALLENGES.forEach(challenge => {
          const currentState = newStates[challenge.id];
          
          // Only check 'active' challenges that have criteria functions
          if (currentState && currentState.status === 'active' && challenge.criteria) {
              const isMet = challenge.criteria(stats, transactions);
              if (isMet) {
                  hasChanges = true;
                  newStates[challenge.id] = { status: 'completed' };
                  totalXpReward += challenge.xpReward;
                  completedId = challenge.id;
                  
                  // Trigger Unlock Queue
                  scheduleUnlock(newStates);
              }
          }
      });

      if (hasChanges) {
          setChallengeStates(newStates);
          awardXp(totalXpReward);
          
          if (completedId) {
             setRecentlyCompletedChallenge(CHALLENGES.find(c => c.id === completedId) || null);
          }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, transactions]); // Check when data changes

  // Timer to process unlocks (1 minute delay)
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          let hasUnlocks = false;
          const newStates = { ...challengeStates };

          Object.keys(newStates).forEach(id => {
              const state = newStates[id];
              if (state.status === 'locked' && state.unlockTime && now >= state.unlockTime) {
                  newStates[id] = { status: 'available' }; // Clear unlockTime, make available
                  hasUnlocks = true;
              }
          });

          if (hasUnlocks) {
              setChallengeStates(newStates);
          }
      }, 5000); // Check every 5s

      return () => clearInterval(interval);
  }, [challengeStates]);

  const scheduleUnlock = (currentStates: Record<string, ChallengeState>) => {
      // Find the first challenge that is 'locked' and NOT scheduled
      const lockedId = Object.keys(currentStates).find(id => 
          currentStates[id].status === 'locked' && !currentStates[id].unlockTime
      );

      if (lockedId) {
          currentStates[lockedId] = {
              status: 'locked',
              unlockTime: Date.now() + 60000 // 1 minute from now for testing
          };
      }
  };

  const awardXp = (amount: number) => {
      if (amount <= 0) return;
      setStats(prev => {
          const newXp = (prev.xp || 0) + amount;
          const levelData = calculateLevelData(newXp);
          
          return {
              ...prev,
              xp: newXp,
              level: levelData.level,
              levelTitle: levelData.name
          };
      });
  };

  // Safe Level Up Detection
  useEffect(() => {
      if (stats.level && stats.level > prevLevelRef.current) {
          const newLvl = LEVELS.find(l => l.level === stats.level);
          if (newLvl) {
              setNewLevelData(newLvl);
          }
          prevLevelRef.current = stats.level;
      } else if (stats.level && stats.level < prevLevelRef.current) {
          // If level decreased (reset data), sync ref without animation
          prevLevelRef.current = stats.level;
      }
  }, [stats.level]);

  // ----------------------------------------

  const applyTransactionEffects = (tx: Transaction, currentStats: UserStats, currentCapsules: Capsule[], multiplier: 1 | -1): { newStats: UserStats, newCapsules: Capsule[] } => {
    const amount = tx.amount * multiplier;
    let newBalance = currentStats.currentBalance;
    let newMonthlyExpenses = currentStats.monthlyExpenses;
    let newTotalSavings = currentStats.totalSavings;
    let newGoals = [...currentStats.savingsGoals];

    if (tx.type === 'income') {
      newBalance += amount;
    } else if (tx.type === 'expense') {
      newBalance -= amount;
      newMonthlyExpenses += amount;
    } else if (tx.type === 'savings') {
      newBalance -= amount;
      newTotalSavings += amount;
      newGoals = newGoals.map(g => {
          if (g.name === tx.category) {
              return { ...g, current: Math.max(0, g.current + amount) };
          }
          return g;
      });
    }

    const newCapsules = currentCapsules.map(cap => {
      if (tx.type === 'expense' && (cap.name.toLowerCase() === tx.category.toLowerCase() || 
          tx.category.toLowerCase().includes(cap.name.toLowerCase()))) {
        return { ...cap, spent: Math.max(0, cap.spent + amount) };
      }
      return cap;
    });

    return {
      newStats: { ...currentStats, currentBalance: newBalance, monthlyExpenses: newMonthlyExpenses, totalSavings: newTotalSavings, savingsGoals: newGoals },
      newCapsules
    };
  };

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = { ...newTx, id: generateId() };
    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    const { newStats, newCapsules } = applyTransactionEffects(transaction, stats, capsules, 1);
    setStats({ ...newStats, streakDays: calculateStreak(updatedTransactions) });
    setCapsules(newCapsules);
  };

  const editTransaction = (id: string, updatedTxData: Omit<Transaction, 'id'>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;
    const reverted = applyTransactionEffects(oldTx, stats, capsules, -1);
    const newTx: Transaction = { ...updatedTxData, id };
    const applied = applyTransactionEffects(newTx, reverted.newStats, reverted.newCapsules, 1);
    const updatedTransactions = transactions.map(t => t.id === id ? newTx : t);
    setTransactions(updatedTransactions);
    setStats({ ...applied.newStats, streakDays: calculateStreak(updatedTransactions) });
    setCapsules(applied.newCapsules);
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const { newStats, newCapsules } = applyTransactionEffects(tx, stats, capsules, -1);
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    setStats({ ...newStats, streakDays: calculateStreak(updatedTransactions) });
    setCapsules(newCapsules);
  };

  const addCapsule = (newCap: Omit<Capsule, 'id'>) => {
    const capsule: Capsule = { ...newCap, id: generateId() };
    setCapsules(prev => [...prev, capsule]);
  };

  const editCapsule = (id: string, updatedCapsule: Partial<Capsule>) => {
    setCapsules(prev => prev.map(c => c.id === id ? { ...c, ...updatedCapsule } : c));
  };

  const deleteCapsule = (id: string) => {
    setCapsules(prev => prev.filter(c => c.id !== id));
  };

  const addSavingsGoal = (goal: { name: string; target: number; current?: number }) => {
    setStats(prev => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, { name: goal.name, target: goal.target, current: goal.current || 0 }]
    }));
  };

  const updateSavingsGoal = (goalName: string, amount: number) => {
    setStats(prev => {
      let addedAmount = 0;
      const updatedGoals = prev.savingsGoals.map(goal => {
        if (goal.name === goalName) {
          addedAmount = amount;
          return { ...goal, current: goal.current + amount };
        }
        return goal;
      });
      return { ...prev, savingsGoals: updatedGoals, totalSavings: prev.totalSavings + addedAmount };
    });
  };

  const editSavingsGoal = (oldName: string, updatedGoal: { name: string; target: number; current: number }) => {
    setStats(prev => {
        const updatedGoals = prev.savingsGoals.map(goal => {
            if (goal.name === oldName) return { ...updatedGoal };
            return goal;
        });
        const newTotalSavings = updatedGoals.reduce((sum, g) => sum + g.current, 0);
        return { ...prev, savingsGoals: updatedGoals, totalSavings: newTotalSavings };
    });
    if (oldName !== updatedGoal.name) {
        setTransactions(prev => prev.map(tx => {
            if (tx.type === 'savings' && tx.category === oldName) return { ...tx, category: updatedGoal.name };
            return tx;
        }));
    }
  };

  const deleteSavingsGoal = (goalName: string) => {
    setStats(prev => {
      const goalToDelete = prev.savingsGoals.find(g => g.name === goalName);
      const amountToRemove = goalToDelete ? goalToDelete.current : 0;
      return { ...prev, savingsGoals: prev.savingsGoals.filter(g => g.name !== goalName), totalSavings: Math.max(0, prev.totalSavings - amountToRemove) };
    });
  };

  const addRecurringTransaction = (recurring: Omit<RecurringTransaction, 'id' | 'nextDate'>) => {
      const newRecurring: RecurringTransaction = { ...recurring, id: generateId(), nextDate: recurring.startDate };
      setRecurringTransactions(prev => [...prev, newRecurring]);
      processRecurringTransactions([...recurringTransactions, newRecurring]);
  };

  const deleteRecurringTransaction = (id: string) => {
      setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
  };

  const acceptChallenge = (id: string) => {
      setChallengeStates(prev => ({ ...prev, [id]: { status: 'active' as ChallengeStatus } }));
  };

  const claimChallengeReward = (id: string) => {
      // Manual completion fallback
      const challenge = CHALLENGES.find(c => c.id === id);
      if (challenge) {
          setChallengeStates(prev => {
              const newStates: Record<string, ChallengeState> = { ...prev, [id]: { status: 'completed' as ChallengeStatus } };
              scheduleUnlock(newStates);
              return newStates;
          });
          awardXp(challenge.xpReward);
      }
  };

  const processRecurringTransactions = (currentRules: RecurringTransaction[]) => {
      const today = new Date().toISOString().split('T')[0];
      let hasChanges = false;
      let newTransactions: Transaction[] = [];
      let updatedStats = { ...stats };
      let updatedCapsules = [...capsules];
      
      const updatedRules = currentRules.map(rule => {
          let ruleChanged = false;
          let tempNextDate = rule.nextDate;
          while (tempNextDate <= today) {
              ruleChanged = true;
              hasChanges = true;
              const newTx: Transaction = {
                  id: generateId(),
                  type: rule.type,
                  amount: rule.amount,
                  category: rule.category,
                  date: tempNextDate,
                  icon: rule.icon,
                  note: rule.note ? `(Recurring) ${rule.note}` : '(Recurring)'
              };
              newTransactions.push(newTx);
              const result = applyTransactionEffects(newTx, updatedStats, updatedCapsules, 1);
              updatedStats = result.newStats;
              updatedCapsules = result.newCapsules;
              tempNextDate = getNextDate(tempNextDate, rule.interval);
          }
          if (ruleChanged) return { ...rule, nextDate: tempNextDate };
          return rule;
      });

      if (hasChanges) {
          setTransactions(prev => [...newTransactions.reverse(), ...prev]); 
          setStats({...updatedStats, streakDays: calculateStreak([...newTransactions, ...transactions])});
          setCapsules(updatedCapsules);
          setRecurringTransactions(updatedRules);
      }
  };

  useEffect(() => {
      if (recurringTransactions.length > 0) processRecurringTransactions(recurringTransactions);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const resetData = () => {
    if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      setStats(defaultStats);
      setCapsules([]);
      setTransactions([]);
      setRecurringTransactions([]);
      setChallengeStates({});
      setCurrency('USD');
      localStorage.removeItem('ecobudget_stats_v3');
      localStorage.removeItem('ecobudget_capsules_v2');
      localStorage.removeItem('ecobudget_transactions_v2');
      localStorage.removeItem('ecobudget_recurring_v2');
      localStorage.removeItem('ecobudget_challenges_v2');
      localStorage.removeItem('ecobudget_currency_v2');
      setSettingsOpen(false);
    }
  };

  const nextLevel = LEVELS.find(l => l.level === (stats.level || 1) + 1);
  const nextLevelXp = nextLevel ? nextLevel.minXp : (stats.level || 1) * 1000;

  return (
    <AppContext.Provider value={{ 
      stats, capsules, transactions, recurringTransactions, challengeStates, currency, isSettingsOpen, isTranslucent, challenges: CHALLENGES,
      recentlyCompletedChallenge, newLevelData,
      addTransaction, editTransaction, deleteTransaction, addCapsule, editCapsule, deleteCapsule,
      addSavingsGoal, updateSavingsGoal, editSavingsGoal, deleteSavingsGoal, addRecurringTransaction, deleteRecurringTransaction,
      acceptChallenge, claimChallengeReward, resetData, setCurrency, setSettingsOpen, setTranslucent, formatCurrency, nextLevelXp,
      clearChallengeNotification, clearLevelUp
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};