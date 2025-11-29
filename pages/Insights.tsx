import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export const Insights: React.FC = () => {
  const { transactions, isTranslucent, formatCurrency, challengeStates, challenges, acceptChallenge } = useApp();

  // Force re-render periodically to update countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
      const timer = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(timer);
  }, []);

  // Calculations for 6-Month Chart (Financial History)
  const sixMonthData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    // Generate last 6 months buckets (current + 5 prev)
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        months.push({ 
            label: monthName, 
            month: d.getMonth(), 
            year: d.getFullYear(), 
            income: 0, 
            expense: 0 
        });
    }

    transactions.forEach(t => {
        const tDate = new Date(t.date);
        const tMonth = tDate.getMonth();
        const tYear = tDate.getFullYear();
        
        const bucket = months.find(m => m.month === tMonth && m.year === tYear);
        if (bucket) {
            if (t.type === 'income') bucket.income += t.amount;
            if (t.type === 'expense') bucket.expense += t.amount;
        }
    });

    // Find max value for scaling
    const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 100);

    return { months, maxVal };
  }, [transactions]);


  // --- Logic for Category Spotlight ---
  const spotlightData = useMemo(() => {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(today.getDate() - 14);

    const getExpensesForPeriod = (start: Date, end: Date) => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' && tDate >= start && tDate < end;
        }).reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);
    };

    const thisWeekExpenses = getExpensesForPeriod(oneWeekAgo, today);
    const lastWeekExpenses = getExpensesForPeriod(twoWeeksAgo, oneWeekAgo);

    let maxChangeCategory = '';
    let maxChangeAmount = 0;
    let maxChangePercent = 0;
    let isIncrease = false;

    // Compare categories present in this week
    for (const [category, amount] of Object.entries(thisWeekExpenses)) {
        const prevAmount = lastWeekExpenses[category] || 0;
        const diff = amount - prevAmount;
        
        // We look for significant changes (absolute value)
        if (Math.abs(diff) > Math.abs(maxChangeAmount)) {
            maxChangeAmount = diff;
            maxChangeCategory = category;
            isIncrease = diff > 0;
            maxChangePercent = prevAmount > 0 ? (diff / prevAmount) * 100 : 100;
        }
    }

    // Also check categories that dropped to zero (present last week, not this week)
    for (const [category, prevAmount] of Object.entries(lastWeekExpenses)) {
        if (!thisWeekExpenses[category]) {
             const diff = -prevAmount;
             if (Math.abs(diff) > Math.abs(maxChangeAmount)) {
                maxChangeAmount = diff;
                maxChangeCategory = category;
                isIncrease = false;
                maxChangePercent = -100;
             }
        }
    }

    return { category: maxChangeCategory, amount: maxChangeAmount, percent: maxChangePercent, isIncrease };
  }, [transactions]);

  // --- Logic for Heatmap ---
  const heatmapData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    
    // Get total days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days = [];
    // Pad empty days at start
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ day: 0, amount: 0, hasData: false });
    }

    let maxSpend = 0;
    const dailySpends: Record<number, number> = {};

    transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (t.type === 'expense' && tDate.getMonth() === month && tDate.getFullYear() === year) {
            const d = tDate.getDate();
            dailySpends[d] = (dailySpends[d] || 0) + t.amount;
            if (dailySpends[d] > maxSpend) maxSpend = dailySpends[d];
        }
    });

    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, amount: dailySpends[i] || 0, hasData: true });
    }

    return { days, maxSpend, monthName: today.toLocaleString('default', { month: 'long' }) };
  }, [transactions]);


  // Styles
  const cardClass = isTranslucent 
    ? "bg-white/5 dark:bg-black/20 backdrop-blur-[50px] backdrop-saturate-[180%] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] hover-lift"
    : "bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 shadow-sm hover-lift";

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto p-4 md:p-10 gap-10 pb-24">
       <div className="animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 dark:text-text-main tracking-tight drop-shadow-lg">Financial Pulse</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-body text-lg">Trends, patterns, and challenges.</p>
        </div>

        {/* Financial History (Bar Chart) - Moved from Dashboard */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
             <div className={`p-6 rounded-[2rem] ${cardClass}`}>
                <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-text-main mb-6 pl-2">Financial History</h3>
                <div className="w-full h-48 md:h-64 flex items-end justify-between gap-2 md:gap-4 relative px-2">
                    {/* Y-Axis Grid Lines (Simplified) */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                         <div className="w-full h-px bg-gray-400 dark:bg-white" />
                         <div className="w-full h-px bg-gray-400 dark:bg-white" />
                         <div className="w-full h-px bg-gray-400 dark:bg-white" />
                    </div>

                    {sixMonthData.months.map((m, idx) => {
                        const incomeHeight = (m.income / sixMonthData.maxVal) * 100;
                        const expenseHeight = (m.expense / sixMonthData.maxVal) * 100;
                        
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end z-10 group/bar">
                                <div className="w-full max-w-[40px] flex items-end justify-center gap-1 h-full relative">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] p-2 rounded opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-xl transform translate-y-2 group-hover/bar:translate-y-0">
                                        <p className="font-bold">{m.label} {m.year}</p>
                                        <p className="text-green-400">In: {formatCurrency(m.income)}</p>
                                        <p className="text-red-400">Out: {formatCurrency(m.expense)}</p>
                                    </div>
                                    
                                    {/* Income Bar */}
                                    <div 
                                        style={{ height: `${Math.max(incomeHeight, 2)}%`, animationDelay: `${idx * 0.1}s` }} 
                                        className="w-1/2 bg-gold rounded-t-sm md:rounded-t-md opacity-90 group-hover/bar:opacity-100 transition-all shadow-[0_0_10px_rgba(201,166,70,0.3)] animate-grow-up origin-bottom"
                                    />
                                    {/* Expense Bar */}
                                    <div 
                                        style={{ height: `${Math.max(expenseHeight, 2)}%`, animationDelay: `${idx * 0.1 + 0.05}s` }} 
                                        className="w-1/2 bg-expense rounded-t-sm md:rounded-t-md opacity-90 group-hover/bar:opacity-100 transition-all shadow-[0_0_10px_rgba(229,115,115,0.3)] animate-grow-up origin-bottom"
                                    />
                                </div>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{m.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>

        {/* 1. Category Spotlight */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-heading font-semibold text-gray-900 dark:text-text-main mb-4 pl-2">Category Spotlight</h2>
            <div className={`rounded-[2rem] p-8 md:p-10 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500 ${cardClass}`}>
                {spotlightData.category ? (
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                         <div className={`size-24 rounded-full flex items-center justify-center shrink-0 shadow-xl animate-pop-in ${spotlightData.isIncrease ? 'bg-expense text-white' : 'bg-green-500 text-white'}`}>
                            <span className="material-symbols-outlined text-5xl">
                                {spotlightData.isIncrease ? 'trending_up' : 'trending_down'}
                            </span>
                         </div>
                         <div className="flex flex-col text-center md:text-left">
                            <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Weekly Change</h3>
                            <p className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-text-main leading-tight">
                                <span className="text-primary">{spotlightData.category}</span> {spotlightData.isIncrease ? 'jumped' : 'dropped'} <span className={spotlightData.isIncrease ? 'text-expense' : 'text-green-500'}>
                                    {Math.round(Math.abs(spotlightData.percent))}%
                                </span> compared to last week.
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                That's a difference of <strong>{formatCurrency(Math.abs(spotlightData.amount))}</strong>. 
                                {spotlightData.isIncrease ? " Watch out for lifestyle inflation!" : " Great job keeping costs down!"}
                            </p>
                         </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                        <span className="material-symbols-outlined text-5xl mb-2">search</span>
                        <p className="text-lg">Not enough data to calculate weekly changes yet.</p>
                    </div>
                )}
                {/* Background Decor */}
                {isTranslucent && <div className={`absolute -right-20 -bottom-40 w-80 h-80 rounded-full blur-[100px] opacity-40 pointer-events-none group-hover:scale-125 transition-transform duration-1000 ${spotlightData.isIncrease ? 'bg-expense' : 'bg-green-500'}`} />}
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* 2. Spending Heatmap */}
            <section className="flex flex-col gap-4">
                 <h2 className="text-2xl font-heading font-semibold text-gray-900 dark:text-text-main pl-2">Spending Heatmap ({heatmapData.monthName})</h2>
                 <div className={`p-6 rounded-[2rem] h-full flex flex-col items-center justify-center ${cardClass}`}>
                    <div className="grid grid-cols-7 gap-2 md:gap-3 w-full max-w-sm mx-auto">
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                            <div key={i} className="text-center text-xs font-bold text-gray-400">{d}</div>
                        ))}
                        
                        {heatmapData.days.map((d, idx) => {
                            if (!d.hasData) return <div key={idx} />; // Spacer
                            
                            // Calculate intensity (0.1 to 1.0)
                            const intensity = heatmapData.maxSpend > 0 ? (d.amount / heatmapData.maxSpend) : 0;
                            const isZero = d.amount === 0;

                            return (
                                <div 
                                    key={idx} 
                                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 relative group hover:scale-125 z-0 hover:z-10
                                        ${isZero 
                                            ? (isTranslucent ? 'bg-white/5 text-gray-600' : 'bg-gray-100 dark:bg-white/5 text-gray-400') 
                                            : 'bg-expense text-white shadow-md'
                                        }`}
                                    style={{ opacity: isZero ? 1 : Math.max(0.3, intensity) }}
                                    title={d.hasData ? `Day ${d.day}: ${formatCurrency(d.amount)}` : ''}
                                >
                                    {d.day}
                                    {!isZero && (
                                        <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transform translate-y-1 group-hover:translate-y-0 transition-all">
                                            {formatCurrency(d.amount)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between w-full max-w-sm mt-6 text-xs text-gray-400 px-2">
                        <span>Low Spend</span>
                        <span>High Spend</span>
                    </div>
                 </div>
            </section>

            {/* 3. Budget Challenges */}
            <section className="flex flex-col gap-4">
                <h2 className="text-2xl font-heading font-semibold text-gray-900 dark:text-text-main pl-2">Budget Challenges</h2>
                <div className="flex flex-col gap-4">
                    {challenges.map((challenge) => {
                        const state = challengeStates[challenge.id] || { status: 'locked' };
                        const { status, unlockTime } = state;
                        const isActive = status === 'active';
                        const isCompleted = status === 'completed';
                        const isAvailable = status === 'available';
                        const isLocked = status === 'locked';
                        
                        // Calculate Time Remaining if locked
                        const now = Date.now();
                        const timeRemaining = unlockTime && unlockTime > now ? Math.ceil((unlockTime - now) / 1000) : 0;

                        if (isLocked && !unlockTime) return null; // Fully hidden

                        return (
                            <div key={challenge.id} className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] ${
                                isCompleted 
                                    ? 'bg-green-500/10 border-green-500/30' 
                                    : isActive 
                                        ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(168,159,133,0.1)]' 
                                        : isLocked
                                            ? 'bg-gray-100 dark:bg-black/20 opacity-70 border-dashed border-gray-300 dark:border-white/10'
                                            : isTranslucent 
                                                ? 'bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md' 
                                                : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5'
                            }`}>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                                        isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-white' : isLocked ? 'bg-gray-300 dark:bg-white/5 text-gray-400' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                                    }`}>
                                        <span className="material-symbols-outlined">
                                            {isCompleted ? 'check_circle' : isLocked ? 'lock_clock' : challenge.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold font-heading ${isCompleted ? 'text-green-600 dark:text-green-400 line-through' : isLocked ? 'text-gray-400' : 'text-gray-900 dark:text-text-main'}`}>
                                                {isLocked ? 'New Challenge Arriving...' : challenge.title}
                                            </h3>
                                            {!isCompleted && !isLocked && <span className="text-[10px] font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded-full border border-gold/30">+{challenge.xpReward} XP</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                            {isLocked ? `Unlocks in ${timeRemaining}s` : challenge.description}
                                        </p>
                                    </div>
                                    
                                    {isAvailable && (
                                        <button 
                                            onClick={() => acceptChallenge(challenge.id)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-900 dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity click-press"
                                        >
                                            Accept
                                        </button>
                                    )}
                                    
                                    {isActive && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                            </span>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Tracking</span>
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <span className="text-xs font-bold text-green-500 border border-green-500/30 px-2 py-1 rounded-lg">Completed</span>
                                    )}
                                </div>
                                
                                {/* Active State Progress Visual */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 h-1 bg-primary/30 w-full">
                                        <div className="h-full bg-primary w-1/3 animate-[shimmer_2s_infinite]" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    </div>
  );
};