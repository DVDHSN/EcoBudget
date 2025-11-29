import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { LEVELS } from '../contexts/AppContext';
import { Transaction } from '../types';

export const Dashboard: React.FC = () => {
  const { stats, transactions, currency, formatCurrency, isTranslucent, addSavingsGoal, updateSavingsGoal, editSavingsGoal, deleteTransaction, addTransaction, editTransaction, deleteSavingsGoal, nextLevelXp } = useApp();
  const navigate = useNavigate();
  
  // Create/Edit Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalName, setEditingGoalName] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');

  // Add Funds Modal State
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [fundsAmount, setFundsAmount] = useState('');

  // Level Info Modal State
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);

  // Undo Delete State
  const [undoTx, setUndoTx] = useState<Transaction | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Calculations for Dashboard
  const { monthlyIncome, cashFlow } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const income = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return { monthlyIncome: income, cashFlow: income - stats.monthlyExpenses };
  }, [transactions, stats.monthlyExpenses]);

  // Styles - LIQUID GLASS
  // High blur, high saturation, distinct specular edges
  const cardClass = isTranslucent 
    ? "bg-white/5 dark:bg-black/20 backdrop-blur-[50px] backdrop-saturate-[180%] border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] relative overflow-hidden group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] hover-lift"
    : "bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 shadow-sm rounded-3xl hover-lift";
    
  const glassInput = isTranslucent
    ? "bg-black/5 dark:bg-black/30 border border-white/10 text-gray-900 dark:text-text-main placeholder:text-gray-500/50 shadow-inner backdrop-blur-sm input-glow"
    : "bg-gray-50 dark:bg-background-dark border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none";

  const modalBgClass = isTranslucent 
    ? "bg-white/30 dark:bg-black/50 backdrop-blur-[80px] backdrop-saturate-[200%] border border-white/30 shadow-[0_40px_100px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]" 
    : "bg-white dark:bg-surface-dark border-gray-200 dark:border-white/10 shadow-2xl";

  // XP Progress Calculation
  const currentLevelData = LEVELS.find(l => l.level === (stats.level || 1)) || LEVELS[0];
  const nextLevelData = LEVELS.find(l => l.level === (stats.level || 1) + 1);
  const currentLevelMinXp = currentLevelData.minXp;
  const xpInLevel = (stats.xp || 0) - currentLevelMinXp;
  const xpNeededForLevel = nextLevelXp - currentLevelMinXp;
  const xpPercentage = Math.min(100, Math.max(0, (xpInLevel / xpNeededForLevel) * 100));

  // Handlers
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget);
    const current = parseFloat(goalCurrent) || 0;
    
    if (!goalName || isNaN(target) || target <= 0) return;

    if (editingGoalName) {
        editSavingsGoal(editingGoalName, { name: goalName, target, current });
    } else {
        addSavingsGoal({ name: goalName, target, current });
    }
    closeGoalModal();
  };

  const openNewGoalModal = () => {
    setEditingGoalName(null);
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('');
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (goal: {name: string, target: number, current: number}) => {
    setEditingGoalName(goal.name);
    setGoalName(goal.name);
    setGoalTarget(goal.target.toString());
    setGoalCurrent(goal.current.toString());
    setIsGoalModalOpen(true);
  };

  const closeGoalModal = () => {
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('');
    setEditingGoalName(null);
    setIsGoalModalOpen(false);
  }

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fundsAmount);
    if (!selectedGoal || isNaN(amount) || amount <= 0) return;

    updateSavingsGoal(selectedGoal, amount);
    setFundsAmount('');
    setSelectedGoal(null);
    setIsAddFundsOpen(false);
  };

  const openAddFundsModal = (goalName: string) => {
    setSelectedGoal(goalName);
    setFundsAmount('');
    setIsAddFundsOpen(true);
  }

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (undoTimeout) clearTimeout(undoTimeout);

    setUndoTx(tx);
    deleteTransaction(id);
    setShowUndo(true);

    const timer = setTimeout(() => {
        setShowUndo(false);
        setUndoTx(null);
    }, 4000); // 4 seconds to undo
    setUndoTimeout(timer);
  }

  const handleUndoDelete = () => {
      if (undoTx) {
          const { id, ...rest } = undoTx;
          // Re-add transaction (will generate new ID but keeps data)
          addTransaction(rest);
          setShowUndo(false);
          setUndoTx(null);
          if (undoTimeout) clearTimeout(undoTimeout);
      }
  }

  const handleEditTransaction = (id: string) => {
    navigate(`/add-transaction?edit=${id}`);
  }

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }
    const headers = ["Date", "Type", "Category", "Amount", "Currency", "Note"];
    const csvRows = [headers.join(",")];
    for (const t of transactions) {
      const safeCategory = `"${t.category.replace(/"/g, '""')}"`;
      const safeNote = t.note ? `"${t.note.replace(/"/g, '""')}"` : "";
      const row = [t.date, t.type, safeCategory, t.amount.toFixed(2), currency, safeNote];
      csvRows.push(row.join(","));
    }
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ecobudget_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-12 pb-32 space-y-6 md:space-y-8 relative">
      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className={`flex items-center gap-4 px-6 py-3 rounded-full shadow-2xl ${isTranslucent ? 'bg-black/70 backdrop-blur-xl text-white border border-white/20' : 'bg-gray-900 text-white'}`}>
                <span className="text-sm font-medium">Transaction deleted</span>
                <button onClick={handleUndoDelete} className="text-sm font-bold text-primary hover:text-white transition-colors uppercase tracking-wide">UNDO</button>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-text-main drop-shadow-md">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-body">Overview of your wealth.</p>
        </div>
        <div className="flex gap-3">
             {/* Mobile Level Indicator */}
            <div 
                onClick={() => setIsLevelModalOpen(true)}
                className={`md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer click-press ${isTranslucent ? 'bg-white/10 border border-white/20 text-white backdrop-blur-md shadow-lg' : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10'}`}
            >
                <span className="material-symbols-outlined text-gold text-lg">{currentLevelData.artifactIcon}</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Lvl {stats.level}</span>
                <div className="w-12 h-1 bg-gray-200 dark:bg-black/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gold" style={{ width: `${xpPercentage}%` }} />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in-up">
        
        {/* --- LEFT COLUMN (Main Feed) --- */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
            
            {/* 1. Hero Balance Card - Premium Glass */}
            <div className={`p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden transition-transform duration-500 hover:scale-[1.01] hover:shadow-2xl group ${isTranslucent ? 'bg-gradient-to-br from-primary/80 to-primary-dark/60 text-white backdrop-blur-[60px] backdrop-saturate-[180%] border border-white/30 shadow-[0_20px_60px_rgba(0,0,0,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]' : 'bg-primary text-background-dark shadow-xl shadow-primary/20'}`}>
                {isTranslucent && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
                
                <div className="relative z-10 flex flex-col gap-4 md:gap-6">
                    <div>
                        <p className="text-primary-dark/70 dark:text-white/70 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-1 md:mb-2">Total Net Balance</p>
                        <h2 className="text-4xl md:text-6xl font-numbers font-bold tracking-tight drop-shadow-sm group-hover:tracking-normal transition-all duration-500">{formatCurrency(stats.currentBalance)}</h2>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 md:gap-16 pt-4 md:pt-6 border-t border-black/10 dark:border-white/20">
                         <div className="group/stat cursor-default">
                            <p className="text-[9px] md:text-xs font-bold uppercase tracking-wide opacity-60 mb-1 group-hover/stat:opacity-100 transition-opacity truncate">Income</p>
                            <p className="text-sm md:text-xl font-numbers font-bold flex items-center gap-1 group-hover/stat:scale-110 origin-left transition-transform">
                                <span className="material-symbols-outlined text-xs md:text-sm">arrow_upward</span>
                                {formatCurrency(monthlyIncome)}
                            </p>
                         </div>
                         <div className="group/stat cursor-default">
                            <p className="text-[9px] md:text-xs font-bold uppercase tracking-wide opacity-60 mb-1 group-hover/stat:opacity-100 transition-opacity truncate">Expense</p>
                            <p className="text-sm md:text-xl font-numbers font-bold flex items-center gap-1 group-hover/stat:scale-110 origin-left transition-transform">
                                <span className="material-symbols-outlined text-xs md:text-sm">arrow_downward</span>
                                {formatCurrency(stats.monthlyExpenses)}
                            </p>
                         </div>
                         <div className="group/stat cursor-default">
                            <p className="text-[9px] md:text-xs font-bold uppercase tracking-wide opacity-60 mb-1 group-hover/stat:opacity-100 transition-opacity truncate">Cash Flow</p>
                            <p className={`text-sm md:text-xl font-numbers font-bold group-hover/stat:scale-110 origin-left transition-transform ${cashFlow >= 0 ? '' : 'text-red-800 dark:text-red-200'}`}>
                                {cashFlow > 0 ? '+' : ''}{formatCurrency(cashFlow)}
                            </p>
                         </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
            </div>

            {/* 3. Recent Transactions Feed */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg md:text-xl font-heading font-bold text-gray-900 dark:text-text-main">Recent Activity</h3>
                    <button 
                        onClick={handleExportCSV} 
                        className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 click-press px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export CSV
                    </button>
                </div>

                <div className={`flex flex-col gap-3`}>
                    {transactions.slice(0, 10).map((tx, index) => (
                        <div 
                            key={tx.id} 
                            className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all duration-300 group cursor-default ${cardClass} hover:translate-x-2 animate-pop-in`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className={`size-10 md:size-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300 ${
                                tx.type === 'income' 
                                ? 'bg-primary/20 text-primary' 
                                : tx.type === 'savings'
                                ? 'bg-gold/20 text-gold'
                                : 'bg-expense/20 text-expense'
                            } ${isTranslucent ? 'backdrop-blur-md' : ''}`}>
                                <span className="material-symbols-outlined text-lg md:text-xl">{tx.icon || 'receipt'}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <p className="text-gray-900 dark:text-text-main font-bold font-heading truncate group-hover:text-primary transition-colors text-sm md:text-base">{tx.category}</p>
                                    <p className={`font-bold font-numbers text-sm md:text-base ${
                                        tx.type === 'income' ? 'text-primary' : tx.type === 'savings' ? 'text-gold' : 'text-gray-900 dark:text-text-main'
                                    }`}>
                                        {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <p className="text-[10px] md:text-xs text-gray-400 font-numbers">{tx.date}</p>
                                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform md:translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => handleEditTransaction(tx.id)} className="text-gray-400 hover:text-primary text-[10px] uppercase font-bold tracking-wider hover:underline">Edit</button>
                                        <button onClick={() => handleDeleteTransaction(tx.id)} className="text-gray-400 hover:text-red-500 text-[10px] uppercase font-bold tracking-wider hover:underline">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className={`p-12 text-center border border-dashed rounded-3xl ${isTranslucent ? 'border-white/20 bg-white/5 backdrop-blur-md' : 'border-gray-300 dark:border-white/10'}`}>
                             <p className="text-gray-400 animate-pulse-slow">No transactions recorded yet.</p>
                             <button onClick={() => navigate('/add-transaction')} className="mt-2 text-primary font-bold hover:underline click-press">Add your first one</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN (Sidebar Stats) --- */}
        <div className="space-y-6">
            
            {/* 1. Level & XP Card (Clickable) */}
            <div 
                onClick={() => setIsLevelModalOpen(true)}
                className={`p-6 rounded-[2rem] cursor-pointer relative overflow-hidden group/level ${cardClass} hover:ring-2 hover:ring-gold/30`}
            >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/level:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-4">
                     <div className="size-14 rounded-2xl bg-gradient-to-br from-gold to-yellow-600 shadow-lg text-white flex items-center justify-center relative overflow-hidden ring-1 ring-white/20 group-hover/level:rotate-3 transition-transform duration-300">
                         <span className="material-symbols-outlined text-3xl z-10 drop-shadow-md">{currentLevelData.artifactIcon}</span>
                         <div className="absolute inset-0 bg-black/10 z-0" />
                     </div>
                     <div>
                         <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Level {stats.level}</p>
                         <p className="text-lg font-heading font-bold text-gray-900 dark:text-text-main flex items-center gap-2 group-hover/level:text-gold transition-colors">
                             {stats.levelTitle}
                         </p>
                         {/* Phase Indicator */}
                         <div className="inline-block mt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${isTranslucent ? 'bg-primary/10 border-primary/20 text-primary-dark dark:text-primary' : 'bg-gray-100 dark:bg-white/10 border-transparent text-gray-600 dark:text-gray-300'}`}>
                                {currentLevelData.phase}
                            </span>
                         </div>
                     </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>XP Progress</span>
                        <span>{Math.round(xpInLevel)} / {xpNeededForLevel}</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-black/30 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gold rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_#C9A646] group-hover/level:shadow-[0_0_15px_#C9A646]" style={{ width: `${xpPercentage}%` }}>
                             <div className="absolute inset-0 bg-white/30" />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-1 group-hover/level:text-gray-600 dark:group-hover/level:text-gray-300 transition-colors">
                        Collect artifacts by earning XP.
                    </p>
                </div>
            </div>

            {/* 2. Streak Card */}
            <div className={`p-6 rounded-[2rem] flex items-center gap-4 ${cardClass} group`}>
                 <div className={`size-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${stats.streakDays > 0 ? 'bg-orange-500/10 text-orange-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                     <span className={`material-symbols-outlined ${stats.streakDays > 0 ? 'animate-pulse' : ''}`}>local_fire_department</span>
                 </div>
                 <div>
                     <p className="text-2xl font-numbers font-bold text-gray-900 dark:text-text-main group-hover:text-orange-500 transition-colors">{stats.streakDays} <span className="text-sm font-body font-normal text-gray-500">days</span></p>
                     <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1">
                        Activity Streak
                        <span className="material-symbols-outlined text-[10px] cursor-help" title="Log a transaction daily to increase streak">info</span>
                     </p>
                 </div>
            </div>

            {/* 3. Savings Goals Sidebar Widget */}
            <div className={`p-6 rounded-[2rem] flex flex-col gap-6 ${cardClass}`}>
                <div className="flex justify-between items-center">
                     <h3 className="font-heading font-bold text-gray-900 dark:text-text-main">Savings Goals</h3>
                     <button onClick={openNewGoalModal} className={`size-8 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors click-press ${isTranslucent ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                         <span className="material-symbols-outlined text-lg">add</span>
                     </button>
                </div>
                
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {stats.savingsGoals.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-4 italic">No goals set.</p>
                    ) : (
                        stats.savingsGoals.map((goal, idx) => {
                            const percent = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
                            return (
                                <div key={idx} className="group/goal p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200 group-hover/goal:text-primary transition-colors">{goal.name}</span>
                                        <span className="text-xs font-numbers text-primary font-bold">{Math.round(percent)}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-black/30 rounded-full overflow-hidden mb-2 shadow-inner">
                                        <div className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(168,159,133,0.6)] animate-grow-up" style={{ width: `${percent}%` }} />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400">{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
                                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover/goal:opacity-100 transition-opacity">
                                             <button onClick={() => openAddFundsModal(goal.name)} className="text-[10px] font-bold text-primary hover:underline click-press">Add</button>
                                             <button onClick={() => openEditGoalModal(goal)} className="text-[10px] text-gray-400 hover:text-gray-600 click-press">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                    <div className="flex justify-between items-center group cursor-default">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Saved</span>
                        <span className="font-numbers font-bold text-lg text-gray-900 dark:text-text-main group-hover:scale-110 transition-transform origin-right">{formatCurrency(stats.totalSavings)}</span>
                    </div>
                </div>
            </div>

        </div>
      </div>

       {/* Create/Edit Goal Modal (Bottom Sheet on Mobile) */}
       {isGoalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
          <div 
            className={`absolute inset-0 transition-all duration-700 ${isTranslucent ? 'bg-black/40 backdrop-blur-xl' : 'bg-black/60 backdrop-blur-sm'}`}
            onClick={closeGoalModal}
          />
          <div className={`relative w-full md:w-auto md:max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] rounded-b-none overflow-hidden animate-fade-in-up transition-all duration-500 ${modalBgClass}`}>
             {isTranslucent && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />}
             
             <div className={`p-6 border-b flex justify-between items-center relative z-10 ${isTranslucent ? 'border-white/10' : 'border-gray-200 dark:border-white/10'}`}>
                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-text-main drop-shadow-md">{editingGoalName ? 'Edit Savings Goal' : 'New Savings Goal'}</h2>
                <button 
                  onClick={closeGoalModal}
                  className={`p-2 rounded-full transition-colors click-press ${isTranslucent ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <form onSubmit={handleSaveGoal} className="p-8 space-y-6 relative z-10 pb-safe-area">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Goal Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., New Car, Holiday"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className={`w-full p-4 rounded-xl border focus:outline-none transition-all ${glassInput}`}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Target Amount</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className={`w-full p-4 rounded-xl border focus:outline-none transition-all font-numbers ${glassInput}`}
                  />
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Saved (Optional)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    className={`w-full p-4 rounded-xl border focus:outline-none transition-all font-numbers ${glassInput}`}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!goalName || !goalTarget}
                  className={`w-full py-4 rounded-xl font-bold font-heading tracking-wide shadow-lg click-press ${!goalName || !goalTarget ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-primary text-background-dark hover:bg-primary-dark'}`}
                >
                  {editingGoalName ? 'Save Changes' : 'Create Goal'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal (Bottom Sheet on Mobile) */}
      {isAddFundsOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
          <div 
            className={`absolute inset-0 transition-all duration-700 ${isTranslucent ? 'bg-black/40 backdrop-blur-xl' : 'bg-black/60 backdrop-blur-sm'}`}
            onClick={() => setIsAddFundsOpen(false)}
          />
          <div className={`relative w-full md:w-auto md:max-w-sm rounded-t-[2rem] md:rounded-[2rem] rounded-b-none overflow-hidden animate-fade-in-up transition-all duration-500 ${modalBgClass}`}>
             <div className={`p-6 border-b flex justify-between items-center relative z-10 ${isTranslucent ? 'border-white/10' : 'border-gray-200 dark:border-white/10'}`}>
                <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-text-main drop-shadow-md">Add Funds to {selectedGoal}</h2>
                <button 
                  onClick={() => setIsAddFundsOpen(false)}
                  className={`p-2 rounded-full transition-colors click-press ${isTranslucent ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <form onSubmit={handleAddFunds} className="p-6 space-y-6 relative z-10 pb-safe-area">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount to Add</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={fundsAmount}
                    onChange={(e) => setFundsAmount(e.target.value)}
                    className={`w-full p-4 rounded-xl border focus:outline-none transition-all font-numbers text-2xl text-center font-bold ${glassInput}`}
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!fundsAmount}
                  className={`w-full py-4 rounded-xl font-bold font-heading tracking-wide shadow-lg click-press ${!fundsAmount ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-primary text-background-dark hover:bg-primary-dark'}`}
                >
                  Add Funds
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Level Info Modal (Bottom Sheet on Mobile) */}
      {isLevelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
            <div 
                className={`absolute inset-0 transition-all duration-700 ${isTranslucent ? 'bg-black/40 backdrop-blur-xl' : 'bg-black/60 backdrop-blur-sm'}`}
                onClick={() => setIsLevelModalOpen(false)}
            />
            <div className={`relative w-full md:w-auto max-w-4xl rounded-t-[3rem] md:rounded-[3rem] rounded-b-none overflow-hidden animate-fade-in-up transition-all duration-500 flex flex-col max-h-[85vh] md:max-h-[90vh] ${modalBgClass}`}>
                {/* Header */}
                <div className={`p-6 border-b flex justify-between items-center relative z-10 shrink-0 ${isTranslucent ? 'border-white/10' : 'border-gray-200 dark:border-white/10'}`}>
                    <div>
                         <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 dark:text-text-main drop-shadow-md">Journey Artifacts</h2>
                         <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Level {stats.level}: <span className="text-gold font-bold">{stats.levelTitle}</span></p>
                    </div>
                    <button 
                      onClick={() => setIsLevelModalOpen(false)}
                      className={`p-2 rounded-full transition-colors click-press ${isTranslucent ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar relative z-10 space-y-12 pb-safe-area">
                    
                    {/* Current Artifact Showcase */}
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gold/40 blur-[60px] rounded-full group-hover:bg-gold/60 transition-colors duration-1000" />
                            <div className={`size-32 bg-gradient-to-br from-gold to-yellow-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 border-[6px] animate-float ${isTranslucent ? 'border-white/20' : 'border-white'}`}>
                                <span className="material-symbols-outlined text-[5rem] text-white drop-shadow-lg group-hover:scale-110 transition-transform">{currentLevelData.artifactIcon}</span>
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-white dark:bg-black text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-gray-200 dark:border-white/20 z-20 animate-pop-in">
                                Current
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-text-main">The {currentLevelData.artifact}</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-2 font-medium text-sm md:text-base">
                                You have earned the {currentLevelData.artifact}. This symbol represents your mastery over the <span className="text-gold font-bold">{currentLevelData.phase}</span> phase.
                            </p>
                            
                            {/* XP Progress Bar Small */}
                            <div className="max-w-xs mx-auto mt-6">
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                                    <span>XP Progress</span>
                                    <span>{Math.round(xpPercentage)}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-gold transition-all duration-500 shadow-[0_0_10px_#C9A646]" style={{ width: `${xpPercentage}%` }} />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Next: {nextLevelData ? nextLevelData.artifact : 'Max Level'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Meta Challenge Hint */}
                    {stats.level >= 6 && (
                        <div className={`p-4 rounded-2xl flex items-center gap-4 max-w-2xl mx-auto hover:scale-[1.02] transition-transform ${isTranslucent ? 'bg-white/10 border border-white/10 shadow-lg backdrop-blur-md' : 'bg-gray-100 dark:bg-white/5'}`}>
                            <span className="material-symbols-outlined text-gold animate-pulse">psychology</span>
                            <div className="text-sm">
                                <p className="font-bold text-gray-900 dark:text-text-main">Meta-Challenge Unlocked</p>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {currentLevelData.phase === 'Growth' && "Maintain a 7-day streak to solidify your habits."}
                                    {currentLevelData.phase === 'Wealth Building' && "Keep your monthly expenses below 80% of income."}
                                    {currentLevelData.phase === 'Freedom' && "Help someone else start their financial journey."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Artifact Gallery Grid */}
                    <div className="space-y-8">
                        {['Foundations', 'Growth', 'Wealth Building', 'Freedom'].map((phase) => (
                            <div key={phase} className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 pl-2 border-l-2 border-gold/50">{phase}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {LEVELS.filter(l => l.phase === phase).map((lvl) => {
                                        const isUnlocked = lvl.level <= stats.level;
                                        const isCurrent = lvl.level === stats.level;

                                        return (
                                            <div 
                                                key={lvl.level} 
                                                className={`p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 relative overflow-hidden group hover:scale-105 ${
                                                    isCurrent 
                                                        ? 'bg-gold/10 border border-gold/50 shadow-[0_0_20px_rgba(201,166,70,0.3)]' 
                                                        : isUnlocked 
                                                            ? isTranslucent 
                                                                ? 'bg-white/5 border border-white/10 hover:bg-white/10 shadow-sm' 
                                                                : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 shadow-sm'
                                                            : 'bg-gray-50 dark:bg-black/20 opacity-50 grayscale border border-transparent'
                                                }`}
                                            >
                                                {/* Number Badge */}
                                                <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isUnlocked ? 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300' : 'bg-gray-200 text-gray-400'}`}>
                                                    {lvl.level}
                                                </span>

                                                <div className={`size-12 rounded-full flex items-center justify-center text-2xl mb-1 transition-transform group-hover:scale-110 group-hover:rotate-12 ${
                                                    isCurrent 
                                                        ? 'bg-gold text-white shadow-lg scale-110' 
                                                        : isUnlocked 
                                                            ? 'bg-primary/10 text-primary dark:text-primary-dark' 
                                                            : 'bg-gray-200 dark:bg-white/5 text-gray-400'
                                                }`}>
                                                    <span className="material-symbols-outlined">{lvl.artifactIcon}</span>
                                                </div>
                                                
                                                <div className="text-center">
                                                    <p className={`text-sm font-bold ${isUnlocked ? 'text-gray-900 dark:text-text-main' : 'text-gray-400'}`}>{lvl.artifact}</p>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{lvl.name}</p>
                                                </div>

                                                {/* Locked Icon Overlay */}
                                                {!isUnlocked && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="material-symbols-outlined text-gray-500">lock</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};