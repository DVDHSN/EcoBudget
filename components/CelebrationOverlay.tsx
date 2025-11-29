import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';

export const CelebrationOverlay: React.FC = () => {
  const { 
    recentlyCompletedChallenge, 
    newLevelData, 
    clearChallengeNotification, 
    clearLevelUp,
    isTranslucent 
  } = useApp();

  const [confetti, setConfetti] = useState<number[]>([]);

  // Generate Confetti on Level Up with more particles
  useEffect(() => {
    if (newLevelData) {
      setConfetti(Array.from({ length: 80 }).map((_, i) => i));
    } else {
      setConfetti([]);
    }
  }, [newLevelData]);

  // Auto-dismiss challenge notification
  useEffect(() => {
    if (recentlyCompletedChallenge) {
      const timer = setTimeout(() => clearChallengeNotification(), 6000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentlyCompletedChallenge]);

  if (!recentlyCompletedChallenge && !newLevelData) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex flex-col items-center justify-center overflow-hidden">
      
      {/* --- CHALLENGE COMPLETED TOAST --- */}
      {recentlyCompletedChallenge && !newLevelData && (
        <div className="absolute top-12 left-4 right-4 md:left-auto md:right-auto md:w-96 pointer-events-auto animate-slide-down">
          <div className={`relative p-5 rounded-3xl flex items-center gap-5 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform ${
             isTranslucent 
               ? 'bg-black/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/20 text-white' 
               : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white'
          }`}>
             {/* Progress Bar Loader for dismiss */}
             <div className="absolute bottom-0 left-0 h-1.5 bg-green-500 animate-[grow-up_6s_linear_reverse_forwards] w-full origin-left opacity-80" />
             
             {/* Decorative glow behind icon */}
             <div className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-green-500/40 blur-xl rounded-full" />

             <div className="size-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center shrink-0 shadow-lg relative z-10 animate-zoom-in-bounce">
                <span className="material-symbols-outlined text-3xl">emoji_events</span>
             </div>
             
             <div className="flex-1 relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5 animate-fade-in">Mission Accomplished</p>
                <h3 className="font-heading font-bold text-lg leading-tight animate-text-pop">{recentlyCompletedChallenge.title}</h3>
                <div className="flex items-center gap-1 mt-1 animate-fade-in-up">
                    <span className="material-symbols-outlined text-gold text-sm filled">bolt</span>
                    <p className="text-xs text-gold font-bold uppercase tracking-wide">+{recentlyCompletedChallenge.xpReward} XP Earned</p>
                </div>
             </div>
             
             <button onClick={clearChallengeNotification} className="opacity-50 hover:opacity-100 p-2 relative z-10 click-press">
                <span className="material-symbols-outlined">close</span>
             </button>
          </div>
        </div>
      )}

      {/* --- GRAND LEVEL UP OVERLAY --- */}
      {newLevelData && (
        <div className="absolute inset-0 z-[210] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl pointer-events-auto animate-fade-in text-white overflow-hidden">
           
           {/* Background Rotating Rays - Grand Effect */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 mix-blend-screen">
               <div className="w-[150vmax] h-[150vmax] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(201,166,70,0.4)_15deg,transparent_30deg,rgba(201,166,70,0.4)_45deg,transparent_60deg,rgba(201,166,70,0.4)_75deg,transparent_90deg,rgba(201,166,70,0.4)_105deg,transparent_120deg,rgba(201,166,70,0.4)_135deg,transparent_150deg,rgba(201,166,70,0.4)_165deg,transparent_180deg,rgba(201,166,70,0.4)_195deg,transparent_210deg,rgba(201,166,70,0.4)_225deg,transparent_240deg,rgba(201,166,70,0.4)_255deg,transparent_270deg,rgba(201,166,70,0.4)_285deg,transparent_300deg,rgba(201,166,70,0.4)_315deg,transparent_330deg,rgba(201,166,70,0.4)_345deg,transparent_360deg)] animate-rotate-slow" />
           </div>

           {/* Radial Burst Behind */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/20 blur-[100px] rounded-full animate-pulse-slow pointer-events-none" />

           {/* Confetti Particles */}
           {confetti.map((i) => (
             <div 
               key={i}
               className="absolute top-0 w-3 h-3 rounded-sm animate-confetti-fall"
               style={{
                 left: `${Math.random() * 100}%`,
                 backgroundColor: ['#C9A646', '#E57373', '#FFFFFF', '#A89F85', '#FFD700'][Math.floor(Math.random() * 5)],
                 animationDelay: `${Math.random() * 1.5}s`,
                 animationDuration: `${2.5 + Math.random() * 2}s`,
                 opacity: 0,
               }}
             />
           ))}

           {/* Main Content */}
           <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-md w-full animate-zoom-in-bounce">
               <div className="mb-2 px-4 py-1 rounded-full border border-gold/30 bg-gold/10 backdrop-blur-md animate-fade-in-up">
                  <p className="text-gold font-bold tracking-[0.3em] uppercase text-xs">Level Up Achieved</p>
               </div>
               
               <div className="relative mb-10 mt-6 group perspective-1000">
                  <div className="absolute inset-0 bg-gold blur-[60px] opacity-60 animate-pulse-slow" />
                  
                  {/* Rotating Card Artifact */}
                  <div className="size-48 rounded-[3rem] bg-gradient-to-br from-gold via-yellow-500 to-yellow-700 flex items-center justify-center shadow-[0_0_60px_rgba(201,166,70,0.6)] relative z-10 border-[6px] border-white/20 transform transition-transform duration-700 hover:rotate-y-12">
                      <span className="material-symbols-outlined text-[6rem] text-white drop-shadow-xl animate-float">{newLevelData.artifactIcon}</span>
                      
                      {/* Shine reflection */}
                      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-50" />
                  </div>
                  
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white text-black font-black text-xl px-6 py-2 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] whitespace-nowrap border-4 border-black/10 z-20 animate-pop-in">
                      Level {newLevelData.level}
                  </div>
               </div>

               <h2 className="text-5xl md:text-6xl font-heading font-black mb-3 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 animate-text-pop">
                  {newLevelData.artifact}
               </h2>
               <p className="text-xl text-white/90 font-medium mb-10 animate-fade-in-up max-w-xs mx-auto leading-relaxed">
                  You have unlocked the <span className="text-gold font-bold">{newLevelData.name}</span> rank in the <span className="underline decoration-gold/50 underline-offset-4">{newLevelData.phase}</span> phase.
               </p>

               <button 
                 onClick={clearLevelUp}
                 className="w-full py-5 bg-white text-black font-black text-lg rounded-2xl hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300 shadow-2xl click-press relative overflow-hidden group"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent -translate-x-full group-hover:animate-shimmer" />
                 <span className="relative z-10 flex items-center justify-center gap-2">
                    CONTINUE JOURNEY
                    <span className="material-symbols-outlined">arrow_forward</span>
                 </span>
               </button>
           </div>
        </div>
      )}
    </div>
  );
};