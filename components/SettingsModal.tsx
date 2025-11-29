import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Currency } from '../types';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, 
    setSettingsOpen, 
    currency, 
    setCurrency, 
    resetData, 
    isTranslucent, 
    setTranslucent,
    recurringTransactions,
    deleteRecurringTransaction,
    formatCurrency
  } = useApp();

  if (!isSettingsOpen) return null;

  const currencies: { code: Currency; label: string; symbol: string }[] = [
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
    { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
    { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
    { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
  ];

  // Liquid Glass Modal: Highly reflective, deep blur
  const modalBgClass = isTranslucent 
    ? "bg-white/30 dark:bg-black/50 backdrop-blur-[80px] backdrop-saturate-[200%] border border-white/30 shadow-[0_40px_100px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]" 
    : "bg-white dark:bg-surface-dark border-gray-200 dark:border-white/10 shadow-2xl";

  const handleDeleteRecurring = (id: string, category: string) => {
      if (window.confirm(`Stop recurring transaction for "${category}"? Future payments will not be added automatically.`)) {
          deleteRecurringTransaction(id);
      }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 transition-all duration-700 ${isTranslucent ? 'bg-black/40 backdrop-blur-xl' : 'bg-black/60 backdrop-blur-sm'}`}
        onClick={() => setSettingsOpen(false)}
      />

      {/* Modal Content (Bottom Sheet on Mobile) */}
      <div className={`relative w-full md:w-auto md:max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] rounded-b-none overflow-hidden animate-fade-in-up transition-all duration-500 max-h-[85vh] md:max-h-[90vh] flex flex-col ${modalBgClass}`}>
        {/* Top Shine */}
        {isTranslucent && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />}
        
        <div className={`p-6 md:p-8 border-b flex justify-between items-center relative z-10 shrink-0 ${isTranslucent ? 'border-white/10' : 'border-gray-200 dark:border-white/10'}`}>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 dark:text-text-main drop-shadow-md">Settings</h2>
          <button 
            onClick={() => setSettingsOpen(false)}
            className={`p-2 rounded-full transition-colors click-press ${isTranslucent ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8 md:space-y-10 overflow-y-auto relative z-10 custom-scrollbar pb-safe-area">
          
          {/* Recurring Transactions Section */}
          <div className="space-y-4">
             <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest font-heading">Recurring Transactions</h3>
             <div className="flex flex-col gap-3">
                 {recurringTransactions.length === 0 ? (
                     <p className="text-sm text-gray-500 dark:text-gray-400 italic">No recurring transactions set up.</p>
                 ) : (
                     recurringTransactions.map((rt) => (
                         <div key={rt.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] ${isTranslucent ? 'bg-white/10 border-white/10 hover:bg-white/15' : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                             <div className="flex items-center gap-3">
                                 <div className={`flex items-center justify-center size-10 rounded-full ${rt.type === 'income' ? 'bg-primary/20 text-primary' : 'bg-expense/20 text-expense'}`}>
                                     <span className="material-symbols-outlined text-lg">{rt.icon}</span>
                                 </div>
                                 <div className="flex flex-col">
                                     <span className="font-bold text-sm text-gray-900 dark:text-text-main">{rt.category}</span>
                                     <span className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(rt.amount)} / {rt.interval}</span>
                                 </div>
                             </div>
                             <button 
                                onClick={() => handleDeleteRecurring(rt.id, rt.category)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors click-press"
                             >
                                 <span className="material-symbols-outlined">delete</span>
                             </button>
                         </div>
                     ))
                 )}
             </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
             <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest font-heading">Appearance</h3>
             <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${isTranslucent ? 'border-primary/30 bg-primary/10 shadow-[inset_0_1px_20px_rgba(168,159,133,0.1)]' : 'border-gray-200 dark:border-white/10'}`}>
                <div className="flex flex-col gap-1">
                  <span className="font-bold font-heading text-lg text-gray-900 dark:text-text-main">Liquid Glass</span>
                  <span className="text-xs text-gray-500 dark:text-gray-300 font-body">Enable premium transparency & depth</span>
                </div>
                <button 
                  onClick={() => setTranslucent(!isTranslucent)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-500 focus:outline-none shadow-inner border border-transparent click-press ${isTranslucent ? 'bg-primary border-primary/50' : 'bg-gray-300 dark:bg-black/50'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${isTranslucent ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
             </div>
          </div>

          {/* Currency Selection */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest font-heading">Currency</h3>
            <div className="grid grid-cols-1 gap-3">
              {currencies.map((c, idx) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group click-press animate-pop-in ${
                    currency === c.code 
                      ? isTranslucent 
                        ? 'border-primary bg-primary/20 text-white shadow-lg backdrop-blur-md scale-[1.02]'
                        : 'border-primary bg-primary/10 text-primary-dark dark:text-primary scale-[1.02]' 
                      : isTranslucent
                        ? 'border-transparent bg-white/5 hover:bg-white/10 text-gray-300 hover:scale-[1.01]'
                        : 'border-gray-200 dark:border-white/10 hover:border-primary/50 text-gray-700 dark:text-gray-300 hover:scale-[1.01]'
                  }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center justify-center size-10 rounded-xl font-bold text-sm font-numbers shadow-inner transition-transform group-hover:rotate-12 ${isTranslucent ? 'bg-black/20 text-gold' : 'bg-gray-100 dark:bg-background-dark'}`}>
                      {c.symbol}
                    </span>
                    <span className="font-medium font-body text-lg">{c.label}</span>
                  </div>
                  {currency === c.code && (
                    <span className="material-symbols-outlined text-primary drop-shadow-md animate-pop-in">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <button
              onClick={resetData}
              className={`w-full flex items-center justify-center gap-2 p-5 rounded-2xl border font-medium font-heading tracking-wide transition-all click-press hover:scale-[1.02] ${
                isTranslucent 
                  ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 shadow-lg backdrop-blur-sm'
                  : 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20'
              }`}
            >
              <span className="material-symbols-outlined">delete_forever</span>
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};