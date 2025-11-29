import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { RecurrenceInterval } from '../types';

// Predefined Categories
const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant' },
  { id: 'groceries', label: 'Groceries', icon: 'shopping_cart' },
  { id: 'transport', label: 'Transport', icon: 'directions_car' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping_bag' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'receipt_long' },
  { id: 'health', label: 'Health', icon: 'medical_services' },
  { id: 'housing', label: 'Housing', icon: 'home' },
  { id: 'travel', label: 'Travel', icon: 'flight' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'personal', label: 'Personal Care', icon: 'spa' },
  { id: 'custom', label: 'Custom', icon: 'edit' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: 'payments' },
  { id: 'freelance', label: 'Freelance', icon: 'work' },
  { id: 'investments', label: 'Investments', icon: 'trending_up' },
  { id: 'gift', label: 'Gifts', icon: 'card_giftcard' },
  { id: 'refund', label: 'Refunds', icon: 'undo' },
  { id: 'custom', label: 'Custom', icon: 'edit' },
];

export const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const { addTransaction, editTransaction, addRecurringTransaction, transactions, currency, isTranslucent, stats } = useApp();
  
  const [type, setType] = useState<'expense' | 'income' | 'savings'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState(''); 
  const [selectedIcon, setSelectedIcon] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>('monthly');

  // Load existing transaction if in edit mode
  useEffect(() => {
    if (editId) {
      const tx = transactions.find(t => t.id === editId);
      if (tx) {
        setType(tx.type);
        setAmount(tx.amount.toString());
        setDate(tx.date);
        setNote(tx.note || '');
        
        // Check if category is standard
        const isStandardExpense = EXPENSE_CATEGORIES.some(c => c.label === tx.category);
        const isStandardIncome = INCOME_CATEGORIES.some(c => c.label === tx.category);
        
        if (tx.type === 'savings') {
            setCategory(tx.category); // Goal name
            setSelectedIcon('flag');
        } else if ((tx.type === 'expense' && isStandardExpense) || (tx.type === 'income' && isStandardIncome)) {
            setCategory(tx.category);
            setSelectedIcon(tx.icon || '');
        } else {
            setCategory('Custom');
            setCustomCategoryName(tx.category);
            setSelectedIcon('edit');
        }
      }
    }
  }, [editId, transactions]);

  // Reset category when type changes (only if not loading edit data initially)
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (isInitialized) {
        setCategory('');
        setCustomCategoryName('');
        setSelectedIcon('');
    } else {
        setIsInitialized(true);
    }
  }, [type]);

  // Map currency to symbol
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', MYR: 'RM'
  };
  const currencySymbol = symbols[currency] || '$';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine final category string
    const finalCategory = category === 'Custom' ? customCategoryName : category;

    if (!amount || !finalCategory) return;

    let icon = selectedIcon;
    if (!icon || category === 'Custom') {
        if (type === 'income') icon = 'payments';
        else if (type === 'expense') icon = 'shopping_bag';
        else if (type === 'savings') icon = 'savings';
        if (category === 'Custom') icon = 'edit'; 
    }

    const txData = {
      type,
      amount: parseFloat(amount),
      category: finalCategory,
      date,
      icon,
      note
    };

    if (editId) {
        // Recurring update is not supported for single transaction edit
        editTransaction(editId, txData);
    } else {
        if (isRecurring) {
            addRecurringTransaction({
                type: txData.type,
                amount: txData.amount,
                category: txData.category,
                icon: txData.icon,
                note: txData.note,
                startDate: date,
                interval: recurrenceInterval
            });
        } else {
            addTransaction(txData);
        }
    }

    navigate('/'); 
  };

  const handleCategorySelect = (catLabel: string, catIcon: string) => {
    setCategory(catLabel);
    setSelectedIcon(catIcon);
    if (catLabel !== 'Custom') {
        setCustomCategoryName('');
    }
  };

  // Carved Glass Input Style
  const inputBgClass = isTranslucent
    ? "bg-black/5 dark:bg-black/30 backdrop-blur-md border border-white/5 dark:border-white/5 text-gray-900 dark:text-text-main placeholder:text-gray-500/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.05)] focus:bg-black/10 dark:focus:bg-black/40 input-glow"
    : "bg-gray-50 dark:bg-surface-dark focus:bg-white dark:focus:bg-background-dark border border-transparent focus:ring-2 focus:ring-primary/20";

  const categoriesToDisplay = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-2rem)] w-full max-w-2xl mx-auto p-4 animate-fade-in pb-32">
      <div className="w-full space-y-8 relative">
        {/* Decorative blur behind form */}
        {isTranslucent && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/5 blur-3xl rounded-full pointer-events-none" />
        )}

        <div className="text-center relative z-10 mt-4 md:mt-0 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-gray-900 dark:text-text-main drop-shadow-md">
            {editId ? 'Edit Transaction' : 'New Transaction'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-body">Flow your finances</p>
          {editId && (
            <button onClick={() => navigate('/')} className="mt-4 text-primary font-bold hover:underline">Cancel Editing</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6 md:space-y-8 relative z-10">
          {/* Sliding Liquid Type Toggle (3-way) */}
          <div className={`relative flex w-full p-1.5 rounded-2xl overflow-hidden ${isTranslucent ? 'bg-black/10 backdrop-blur-xl border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' : 'bg-gray-200 dark:bg-surface-dark'}`}>
            
            {/* The Sliding Pill */}
            <div 
              className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(33.33%-4px)] rounded-xl shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                type === 'income' ? 'translate-x-[100%]' : type === 'savings' ? 'translate-x-[200%]' : 'translate-x-0'
              } ${
                type === 'expense' ? 'bg-expense/90' : type === 'income' ? 'bg-income/90' : 'bg-gold/90'
              } ${isTranslucent ? 'backdrop-blur-sm border border-white/20' : ''}`} 
            />

            <button
              type="button"
              onClick={() => setType('expense')}
              className={`relative z-10 flex-1 py-4 rounded-xl text-xs md:text-sm font-bold transition-colors duration-300 font-heading tracking-wide click-press ${
                type === 'expense'
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              EXPENSE
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`relative z-10 flex-1 py-4 rounded-xl text-xs md:text-sm font-bold transition-colors duration-300 font-heading tracking-wide click-press ${
                type === 'income'
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              INCOME
            </button>
            <button
              type="button"
              onClick={() => setType('savings')}
              className={`relative z-10 flex-1 py-4 rounded-xl text-xs md:text-sm font-bold transition-colors duration-300 font-heading tracking-wide click-press ${
                type === 'savings'
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              SAVINGS
            </button>
          </div>

          {/* Amount Display */}
          <div className="relative group text-center py-6">
            <div className="inline-flex items-center justify-center relative">
                <span className="text-3xl md:text-4xl font-numbers font-medium text-gray-400 dark:text-gray-600 mr-2 transition-colors group-focus-within:text-gold select-none">{currencySymbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full max-w-[240px] bg-transparent text-center text-6xl md:text-7xl font-numbers font-bold tracking-tighter text-gray-900 dark:text-text-main border-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-700 drop-shadow-lg transition-transform focus:scale-110 duration-300"
                  autoFocus={!editId}
                />
                {isTranslucent && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-gold/50 blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />}
            </div>
          </div>

          <div className="space-y-6">
            {/* Category Selection Grid OR Savings Goal Selection */}
            {type === 'savings' ? (
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Select Goal</label>
                        {stats.savingsGoals.length === 0 && (
                             <button type="button" onClick={() => navigate('/')} className="text-xs font-bold text-primary hover:underline click-press">
                                 + Create Goal
                             </button>
                        )}
                    </div>
                    {stats.savingsGoals.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {stats.savingsGoals.map((goal, idx) => {
                                const isSelected = category === goal.name;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleCategorySelect(goal.name, 'savings')}
                                        className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 border group text-left click-press ${
                                            isSelected
                                              ? isTranslucent
                                                ? 'bg-gold/20 border-gold text-gold shadow-[0_0_15px_rgba(201,166,70,0.3)] scale-[1.02]'
                                                : 'bg-gold text-white border-gold shadow-md scale-[1.02]'
                                              : isTranslucent
                                                ? 'bg-white/5 border-transparent hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:scale-[1.02]'
                                                : 'bg-gray-100 dark:bg-surface-dark border-transparent hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 hover:scale-[1.02]'
                                          }`}
                                    >
                                        <span className={`material-symbols-outlined text-2xl ${isSelected ? 'scale-110' : 'opacity-70 group-hover:opacity-100'} transition-all`}>
                                            flag
                                        </span>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium font-heading ${isSelected ? 'font-bold' : ''}`}>
                                                {goal.name}
                                            </span>
                                            <span className="text-xs opacity-70 font-numbers">{currencySymbol}{goal.target}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No savings goals found. Create one in the Dashboard first.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {categoriesToDisplay.map((cat, idx) => {
                        const isSelected = category === cat.label;
                        return (
                            <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategorySelect(cat.label, cat.icon)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border group text-left click-press animate-pop-in ${
                                isSelected
                                ? isTranslucent
                                    ? 'bg-primary/20 border-primary text-primary-dark dark:text-primary shadow-[0_0_15px_rgba(168,159,133,0.3)] scale-[1.03]'
                                    : 'bg-primary text-white border-primary shadow-md scale-[1.03]'
                                : isTranslucent
                                    ? 'bg-white/5 border-transparent hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:scale-105'
                                    : 'bg-gray-100 dark:bg-surface-dark border-transparent hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 hover:scale-105'
                            }`}
                            style={{ animationDelay: `${idx * 0.03}s` }}
                            >
                            <span className={`material-symbols-outlined text-2xl ${isSelected ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:rotate-12'} transition-all`}>
                                {cat.icon}
                            </span>
                            <span className={`text-sm font-medium font-heading ${isSelected ? 'font-bold' : ''}`}>
                                {cat.label}
                            </span>
                            </button>
                        );
                        })}
                    </div>
                </div>
            )}

            {/* Custom Category Input (Conditionally Rendered) */}
            {category === 'Custom' && type !== 'savings' && (
                <div className="space-y-2 animate-fade-in">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Custom Category</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined z-10">edit</span>
                        <input
                            type="text"
                            placeholder="e.g. Concert Tickets, Dog Food"
                            value={customCategoryName}
                            onChange={(e) => setCustomCategoryName(e.target.value)}
                            className={`w-full pl-12 pr-4 py-4 rounded-2xl transition-all duration-300 [color-scheme:dark] font-body outline-none ${inputBgClass}`}
                            autoFocus
                        />
                    </div>
                </div>
            )}

            {/* Note Field */}
            <div className="relative group">
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2 mb-2 block">Note (Optional)</label>
               <div className="relative">
                 <span className="absolute left-4 top-4 text-gray-400 material-symbols-outlined group-focus-within:text-primary transition-colors z-10 text-xl">
                    edit_note
                 </span>
                 <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add remarks..."
                    rows={2}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl transition-all duration-300 [color-scheme:dark] font-body outline-none resize-none ${inputBgClass}`}
                 />
               </div>
            </div>

            {/* Date */}
            <div className="relative group">
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2 mb-2 block">Date</label>
               <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined group-focus-within:text-primary transition-colors z-10 text-xl">
                    calendar_today
                </span>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl transition-all duration-300 [color-scheme:dark] font-numbers outline-none ${inputBgClass}`}
                />
              </div>
            </div>

            {/* Recurring Toggle (New Feature) - Only show when creating new */}
            {!editId && (
                <div className={`p-5 rounded-2xl border transition-all duration-300 ${isTranslucent ? 'bg-white/5 border-white/10' : 'bg-gray-100 dark:bg-surface-dark border-transparent'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center size-10 rounded-full transition-colors duration-300 ${isRecurring ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-black/30 text-gray-500'}`}>
                                <span className="material-symbols-outlined">update</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold font-heading text-sm text-gray-900 dark:text-text-main">Repeat Transaction</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Regular income or expenses</span>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsRecurring(!isRecurring)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 click-press ${isRecurring ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                             <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Frequency Dropdown */}
                    {isRecurring && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 animate-fade-in">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Frequency</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceInterval[]).map((interval) => (
                                    <button
                                        key={interval}
                                        type="button"
                                        onClick={() => setRecurrenceInterval(interval)}
                                        className={`py-2 px-1 rounded-lg text-xs font-bold uppercase transition-all click-press ${
                                            recurrenceInterval === interval 
                                                ? 'bg-primary text-white shadow-md' 
                                                : isTranslucent 
                                                    ? 'bg-white/5 hover:bg-white/10 text-gray-400' 
                                                    : 'bg-white dark:bg-black/20 hover:bg-gray-200 text-gray-500'
                                        }`}
                                    >
                                        {interval}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                Next transaction will be logged on <span className="text-primary font-bold">{date}</span>
                            </p>
                        </div>
                    )}
                </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!amount || !category || (category === 'Custom' && !customCategoryName)}
            className={`w-full font-bold text-lg py-5 rounded-2xl shadow-xl transition-all duration-300 click-press group relative overflow-hidden font-heading tracking-wide ${
              !amount || !category || (category === 'Custom' && !customCategoryName)
               ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
               : isTranslucent 
                 ? 'bg-gradient-to-r from-primary to-primary-dark backdrop-blur-xl border border-white/20 text-white shadow-[0_10px_30px_rgba(168,159,133,0.3)] hover:shadow-[0_15px_40px_rgba(168,159,133,0.4)]'
                 : 'bg-primary hover:bg-primary-dark text-background-dark shadow-primary/20'
            }`}
          >
            {/* Shimmer Effect on Button */}
            {!(!amount || !category || (category === 'Custom' && !customCategoryName)) && (
               <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none" />
            )}
            <span className="relative z-20">
            {editId 
                ? 'SAVE CHANGES' 
                : isRecurring 
                    ? `SET RECURRING ${recurrenceInterval.toUpperCase()}` 
                    : (type === 'savings' ? 'ADD TO SAVINGS' : 'ADD TRANSACTION')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};