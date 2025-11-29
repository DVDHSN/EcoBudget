import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export const MobileNav: React.FC = () => {
  const { isTranslucent } = useApp();

  const navItems = [
    { to: "/", icon: "dashboard", label: "Home" },
    { to: "/capsules", icon: "savings", label: "Capsules" },
    { to: "/add-transaction", icon: "add_circle", label: "Add" },
    { to: "/insights", icon: "insights", label: "Insights" },
  ];

  // Liquid Glass Mobile Bar
  const barClass = isTranslucent
    ? "bg-white/10 dark:bg-black/40 backdrop-blur-[30px] backdrop-saturate-[180%] border-t border-white/20 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
    : "bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-white/5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]";

  return (
    <div className={`md:hidden fixed bottom-0 left-0 w-full px-6 py-2 pb-safe-area flex justify-between items-end z-50 transition-all duration-500 ${barClass}`}>
      {/* Specular Highlight Top Edge */}
      {isTranslucent && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      )}

      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 group click-press ${
              isActive
                ? "text-primary -translate-y-1"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {/* Active Indicator Glow */}
              {isActive && isTranslucent && (
                 <div className="absolute inset-0 bg-primary/10 blur-md rounded-full -z-10" />
              )}
              
              <div className={`relative flex items-center justify-center transition-all duration-300 ${item.icon === 'add_circle' ? 'size-12 -mt-6' : ''}`}>
                 {item.icon === 'add_circle' ? (
                    // Floating Action Button Style for Add
                    <div className={`size-14 rounded-full flex items-center justify-center shadow-lg transition-transform ${isActive ? 'scale-110 bg-primary text-white' : 'bg-primary text-background-dark'} ${isTranslucent ? 'shadow-[0_0_15px_rgba(168,159,133,0.5)] border border-white/20' : ''}`}>
                       <span className="material-symbols-outlined text-3xl">add</span>
                    </div>
                 ) : (
                    <span className={`material-symbols-outlined ${isActive ? 'filled text-[26px]' : 'text-2xl'}`}>
                        {item.icon}
                    </span>
                 )}
              </div>
              
              {item.icon !== 'add_circle' && (
                  <span className={`text-[10px] font-medium font-body transition-opacity ${isActive ? 'opacity-100 font-bold' : 'opacity-80'}`}>
                    {item.label}
                  </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};