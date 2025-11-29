import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

// Predefined Capsule Presets
const CAPSULE_PRESETS = [
  { id: 'groceries', label: 'Groceries', icon: 'shopping_cart' },
  { id: 'transport', label: 'Transport', icon: 'directions_car' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { id: 'dining', label: 'Dining Out', icon: 'restaurant' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping_bag' },
  { id: 'utilities', label: 'Utilities', icon: 'bolt' },
  { id: 'rent', label: 'Rent/Housing', icon: 'home' },
  { id: 'health', label: 'Health', icon: 'medical_services' },
  { id: 'tech', label: 'Tech & Subs', icon: 'devices' },
  { id: 'travel', label: 'Travel', icon: 'flight' },
  { id: 'education', label: 'Education', icon: 'school' },
  { id: 'custom', label: 'Custom', icon: 'edit' },
];

export const Capsules: React.FC = () => {
  const { capsules, addCapsule, editCapsule, deleteCapsule, formatCurrency, isTranslucent } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCapsuleId, setEditingCapsuleId] = useState<string | null>(null);
  
  // Form State
  const [selectedPreset, setSelectedPreset] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [customName, setCustomName] = useState('');
  const [newCapLimit, setNewCapLimit] = useState('');

  const totalBudget = capsules.reduce((acc, curr) => acc + curr.total, 0);
  const totalSpent = capsules.reduce((acc, curr) => acc + curr.spent, 0);
  const remaining = totalBudget - totalSpent;

  const headerBg = isTranslucent 
    ? "bg-transparent backdrop-blur-none" 
    : "bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5";

  // Liquid Glass Summary Card
  const summaryCardBg = isTranslucent
    ? "bg-gradient-to-br from-primary/30 to-transparent dark:from-primary/20 dark:to-transparent backdrop-blur-[60px] backdrop-saturate-[180%] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] hover-lift"
    : "bg-primary/10 dark:bg-primary/5 border border-primary/20 hover-lift";

  // Liquid Glass Capsule Card
  const cardBg = isTranslucent
    ? "bg-white/5 dark:bg-black/20 backdrop-blur-[40px] backdrop-saturate-[180%] border border-white/20 dark:border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.1)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
    : "border border-gray-200 dark:border-white/5 bg-white dark:bg-surface-dark shadow-sm";

  const modalBgClass = isTranslucent 
    ? "bg-white/30 dark:bg-black/50 backdrop-blur-[80px] backdrop-saturate-[200%] border border-white/30 shadow-[0_40px_100px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]" 
    : "bg-white dark:bg-surface-dark border-gray-200 dark:border-white/10 shadow-2xl";

  const inputClass = isTranslucent
    ? "bg-black/10 dark:bg-black/30 border border-white/10 text-gray-900 dark:text-text-main placeholder:text-gray-500/50 backdrop-blur-sm input-glow"
    : "bg-gray-50 dark:bg-background-dark border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/20 outline-none";

  const handlePresetSelect = (preset: typeof CAPSULE_PRESETS[0]) => {
    setSelectedPreset(preset.label);
    setSelectedIcon(preset.icon);
    if (preset.id !== 'custom') {
        setCustomName('');
    }
  };

  const handleAddOrEditCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(newCapLimit);
    
    // Determine final name
    const finalName = selectedPreset === 'Custom' ? customName : selectedPreset;

    if (!finalName || isNaN(limit) || limit <= 0) return;

    if (editingCapsuleId) {
        editCapsule(editingCapsuleId, {
            name: finalName,
            total: limit,
            icon: selectedIcon || 'savings'
        });
    } else {
        addCapsule({
            name: finalName,
            total: limit,
            spent: 0,
            icon: selectedIcon || 'savings'
        });
    }
    
    closeModal();
  };

  const handleDeleteCapsule = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the "${name}" capsule?`)) {
      deleteCapsule(id);
    }
  }

  const openNewModal = () => {
    setEditingCapsuleId(null);
    setSelectedPreset('');
    setSelectedIcon('');
    setCustomName('');
    setNewCapLimit('');
    setIsModalOpen(true);
  }

  const openEditModal = (capsule: {id: string, name: string, total: number, icon: string}) => {
    setEditingCapsuleId(capsule.id);
    setNewCapLimit(capsule.total.toString());
    
    // Check if name matches a preset
    const preset = CAPSULE_PRESETS.find(p => p.label === capsule.name);
    if (preset) {
        setSelectedPreset(preset.label);
        setSelectedIcon(preset.icon);
        setCustomName('');
    } else {
        setSelectedPreset('Custom');
        setCustomName(capsule.name);
        setSelectedIcon(capsule.icon);
    }
    
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setSelectedPreset('');
    setSelectedIcon('');
    setCustomName('');
    setNewCapLimit('');
    setEditingCapsuleId(null);
    setIsModalOpen(false);
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Sticky Header */}
      <header className={`sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:px-6 md:py-4 transition-all ${headerBg}`}>
        <h2 className="text-lg md:text-xl font-heading font-bold text-gray-900 dark:text-text-main drop-shadow-sm">Capsules</h2>
        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium border shadow-sm transition-all hover:scale-105 click-press ${isTranslucent ? 'bg-white/10 dark:bg-black/20 backdrop-blur-lg border-white/20 text-white hover:bg-white/20' : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-white/5'}`}>
            <span className="font-body text-gray-700 dark:text-gray-300">This Month</span>
          </button>
        </div>
      </header>

      <div className="p-4 md:p-10 space-y-6 md:space-y-8 pb-32">
        {/* Summary Card */}
        <div className={`w-full rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 relative overflow-hidden group ${summaryCardBg}`}>
           {/* Moving light shimmer */}
           {isTranslucent && <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-in-out" />}
           
           <div className="relative z-10 flex flex-col gap-1 text-center md:text-left">
             <p className="text-gray-500 dark:text-primary font-bold font-heading uppercase tracking-widest text-xs">Total Monthly Budget</p>
             <p className="text-4xl md:text-6xl font-numbers font-bold text-gray-900 dark:text-primary drop-shadow-lg">{formatCurrency(totalBudget)}</p>
           </div>
           
           <div className="flex-1 w-full max-w-lg relative z-10">
             <div className="flex justify-between text-xs md:text-sm mb-2 md:mb-3 text-gray-600 dark:text-gray-300 font-numbers tracking-wide">
               <span>Spent {formatCurrency(totalSpent)}</span>
               <span className="text-primary font-bold">{formatCurrency(remaining)} Remaining</span>
             </div>
             {/* Main Liquid Bar */}
             <div className={`h-4 w-full rounded-full overflow-hidden ${isTranslucent ? 'bg-black/20 shadow-inner' : 'bg-gray-200 dark:bg-background-dark'}`}>
               <div 
                 className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-700 shadow-[0_0_20px_rgba(168,159,133,0.5)] relative animate-grow-up origin-left" 
                 style={{ width: totalBudget > 0 ? `${Math.min((totalSpent / totalBudget) * 100, 100)}%` : '0%' }} 
               >
                 {isTranslucent && <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full" />}
               </div>
             </div>
           </div>

           <button 
             onClick={openNewModal}
             className={`px-6 py-3 md:px-8 md:py-4 font-bold rounded-2xl flex items-center gap-2 md:gap-3 transition-all font-heading tracking-wide shadow-xl relative z-10 click-press overflow-hidden group/btn text-sm md:text-base ${
               isTranslucent 
                 ? 'bg-primary/80 backdrop-blur-md text-white border border-white/20 hover:bg-primary/90' 
                 : 'bg-primary text-background-dark hover:bg-primary-dark shadow-primary/20'
             }`}
           >
             {/* Button internal shimmer */}
             <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none" />
             <span className="material-symbols-outlined relative z-20 text-xl">add_circle</span>
             <span className="relative z-20">New Capsule</span>
           </button>
        </div>

        {/* Empty State */}
        {capsules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-60">
            <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-surface-dark mb-4 animate-float-slow">savings</span>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-text-main">No capsules found</p>
            <p className="text-gray-500 dark:text-gray-400 font-body mt-2">Initialize a budget capsule to begin.</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {capsules.map((capsule, idx) => {
             const percent = capsule.total > 0 ? Math.min((capsule.spent / capsule.total) * 100, 100) : 0;
             const isNearLimit = percent > 90;
             const colorClass = isNearLimit ? 'bg-orange-500' : 'bg-gold';
             const textClass = isNearLimit ? 'text-orange-500' : 'text-gold';
             
             return (
              <div key={capsule.id} className={`group flex flex-col gap-5 rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden ${cardBg} ${isTranslucent ? 'hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-white/20' : 'hover:shadow-lg dark:hover:shadow-black/50 hover:border-primary/50'} animate-fade-in-up`} style={{ animationDelay: `${idx * 0.05}s` }}>
                
                {/* Internal Glow on Hover */}
                {isTranslucent && <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />}

                {/* Edit/Delete Buttons (Visible on Hover/Focus) */}
                <div className="absolute top-6 right-6 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                    onClick={() => openEditModal(capsule)}
                    className="p-2 rounded-full text-gray-400 hover:text-primary hover:bg-gray-500/10 transition-colors click-press"
                    title="Edit Capsule"
                    >
                    <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button 
                    onClick={() => handleDeleteCapsule(capsule.id, capsule.name)}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors click-press"
                    title="Delete Capsule"
                    >
                    <span className="material-symbols-outlined">delete</span>
                    </button>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ${isNearLimit ? 'bg-orange-500/10' : 'bg-gold/10'} backdrop-blur-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                    <span className={`material-symbols-outlined text-3xl ${textClass} drop-shadow-sm`}>{capsule.icon}</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-text-main tracking-tight pr-12 group-hover:text-primary transition-colors truncate">{capsule.name}</h3>
                </div>
                
                <div className="flex flex-col gap-3 mt-auto relative z-10">
                  <div className="flex justify-between text-sm font-numbers">
                    <span className="text-gray-500 dark:text-gray-400">Spent <strong className="text-gray-900 dark:text-text-main">{formatCurrency(capsule.spent)}</strong></span>
                    <span className="text-gray-500 dark:text-gray-400">Total <strong className="text-gray-900 dark:text-text-main">{formatCurrency(capsule.total)}</strong></span>
                  </div>
                  
                  <div className={`h-3 w-full rounded-full overflow-hidden ${isTranslucent ? 'bg-black/20 shadow-inner' : 'bg-gray-100 dark:bg-background-dark'}`}>
                    <div 
                      className={`h-full rounded-full ${colorClass} transition-all duration-700 shadow-[0_0_10px_currentColor] animate-grow-up origin-left`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-sm font-bold font-numbers ${textClass}`}>
                      Remaining: {formatCurrency(capsule.total - capsule.spent)}
                    </p>
                    {isNearLimit && (
                      <div className="flex items-center gap-1 text-orange-500 text-xs font-bold px-2 py-1 bg-orange-500/10 rounded-lg font-body border border-orange-500/20 animate-pulse">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        <span>Near Limit</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
             );
          })}
        </div>
      </div>

      {/* Add/Edit Capsule Modal (Bottom Sheet on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
          <div 
            className={`absolute inset-0 transition-all duration-700 ${isTranslucent ? 'bg-black/40 backdrop-blur-xl' : 'bg-black/60 backdrop-blur-sm'}`}
            onClick={closeModal}
          />
          <div className={`relative w-full md:w-auto md:max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] rounded-b-none overflow-hidden animate-fade-in-up transition-all duration-500 max-h-[85vh] md:max-h-[90vh] flex flex-col ${modalBgClass}`}>
             {isTranslucent && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />}
             
             <div className={`p-6 border-b flex justify-between items-center relative z-10 shrink-0 ${isTranslucent ? 'border-white/10' : 'border-gray-200 dark:border-white/10'}`}>
                <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-text-main">{editingCapsuleId ? 'Edit Capsule' : 'New Capsule'}</h2>
                <button 
                  onClick={closeModal}
                  className={`p-2 rounded-full transition-colors click-press ${isTranslucent ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
             </div>

             <form onSubmit={handleAddOrEditCapsule} className="p-8 space-y-6 relative z-10 overflow-y-auto custom-scrollbar pb-safe-area">
                
                {/* 1. Preset Grid */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Capsule Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {CAPSULE_PRESETS.map((preset, idx) => {
                            const isSelected = selectedPreset === preset.label;
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => handlePresetSelect(preset)}
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
                                        {preset.icon}
                                    </span>
                                    <span className={`text-sm font-medium font-heading ${isSelected ? 'font-bold' : ''}`}>
                                        {preset.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Custom Name Input (Only if 'Custom' is selected) */}
                {selectedPreset === 'Custom' && (
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Custom Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Ski Trip, New Laptop"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className={`w-full p-4 rounded-xl border focus:outline-none transition-all ${inputClass}`}
                            autoFocus
                        />
                    </div>
                )}

                {/* 3. Limit Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-2">Monthly Limit</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={newCapLimit}
                    onChange={(e) => setNewCapLimit(e.target.value)}
                    className={`w-full p-4 rounded-xl border focus:outline-none transition-all font-numbers text-xl ${inputClass}`}
                    required
                    min="1"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={(!selectedPreset) || (selectedPreset === 'Custom' && !customName) || !newCapLimit}
                  className={`w-full py-4 rounded-xl font-bold font-heading tracking-wide shadow-lg transition-transform hover:scale-[1.02] click-press ${(!selectedPreset) || (selectedPreset === 'Custom' && !customName) || !newCapLimit ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-primary text-background-dark hover:bg-primary-dark'}`}
                >
                  {editingCapsuleId ? 'Save Changes' : 'Create Capsule'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};