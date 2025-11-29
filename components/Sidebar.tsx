import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export const Sidebar: React.FC = () => {
  const { setSettingsOpen, isTranslucent } = useApp();
  
  const navItems = [
    { to: "/", icon: "dashboard", label: "Dashboard" },
    { to: "/capsules", icon: "savings", label: "Capsules" },
    { to: "/insights", icon: "insights", label: "Insights" },
    { to: "/add-transaction", icon: "add_card", label: "Add Transaction" }, 
  ];

  // LIQUID GLASS RECIPE:
  // - High blur (backdrop-blur-[40px])
  // - Saturation boost (backdrop-saturate-[180%]) for refraction
  // - Specular top highlight (shadow-[inset_0_1px...])
  const bgClass = isTranslucent 
    ? "bg-white/5 dark:bg-black/20 backdrop-blur-[40px] backdrop-saturate-[180%] border-r border-white/20 dark:border-white/10 shadow-[4px_0_30px_rgba(0,0,0,0.05)]"
    : "bg-background-light dark:bg-background-dark border-r border-gray-200 dark:border-white/5";

  return (
    <aside className={`hidden md:flex w-64 flex-col p-6 h-screen sticky top-0 transition-all duration-700 ease-out z-20 ${bgClass}`}>
      <div className="flex flex-col h-full justify-between relative">
        {/* Specular Light Edge (Top Shine) */}
        {isTranslucent && (
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)] rounded-r-none" />
        )}

        <div className="flex flex-col gap-10 relative z-10">
          <div className="flex items-center gap-3 px-2 group cursor-default">
            <div className={`relative flex items-center justify-center size-10 rounded-xl transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 ${isTranslucent ? 'bg-gradient-to-br from-gold/30 to-gold/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/10' : ''}`}>
               <span className="material-symbols-outlined text-gold text-3xl filled drop-shadow-md">
                 savings
               </span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-text-main tracking-wide drop-shadow-sm">EcoBudget</h1>
          </div>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-heading font-semibold transition-all duration-300 group relative overflow-hidden click-press ${
                    isActive
                      ? isTranslucent 
                        ? "bg-white/20 dark:bg-white/10 text-primary-dark dark:text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border border-white/10 backdrop-blur-sm" 
                        : "bg-primary/20 text-primary-dark dark:text-primary"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-text-main hover:pl-5 hover:bg-black/5 dark:hover:bg-white/5"
                  }`
                }
              >
                {/* Active State Glow for Liquid Mode */}
                {({ isActive }) => (
                  <>
                    {isActive && isTranslucent && <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />}
                    <span className={`material-symbols-outlined transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:rotate-6 group-hover:scale-110'}`}>{item.icon}</span>
                    <span className="relative z-10">{item.label}</span>
                    {isActive && <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full animate-pop-in" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="flex flex-col gap-4 relative z-10">
           {/* Settings Button */}
           <button 
             onClick={() => setSettingsOpen(true)}
             className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 w-full text-left group relative overflow-hidden click-press ${
               isTranslucent 
                ? "hover:bg-white/10 border border-transparent hover:border-white/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]" 
                : "hover:bg-gray-100 dark:hover:bg-white/5"
             }`}
           >
             <div className={`size-10 rounded-full flex items-center justify-center transition-all duration-700 group-hover:rotate-90 ${
               isTranslucent 
                 ? "bg-gradient-to-br from-white/20 to-white/5 text-gray-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:text-primary border border-white/5 backdrop-blur-md" 
                 : "bg-gray-200 dark:bg-surface-dark text-gray-500 dark:text-gray-400 group-hover:text-primary"
             }`}>
                <span className="material-symbols-outlined">settings</span>
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-heading font-bold text-gray-900 dark:text-text-main group-hover:translate-x-1 transition-transform">Settings</span>
               <span className="text-xs font-body text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">Currency & Data</span>
             </div>
          </button>
        </div>
      </div>
    </aside>
  );
};