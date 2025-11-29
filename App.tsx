import React from 'react';
import { MemoryRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './pages/Dashboard';
import { AddTransaction } from './pages/AddTransaction';
import { Capsules } from './pages/Capsules';
import { Insights } from './pages/Insights';
import { SettingsModal } from './components/SettingsModal';
import { CelebrationOverlay } from './components/CelebrationOverlay';

const LiquidBackground = () => {
  const { isTranslucent } = useApp();
  
  if (!isTranslucent) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-1000">
      {/* 
        LIQUID GLASS AMBIENT FIELD
        These layers create the "breathing" color that shines through the UI glass.
        High saturation here pairs with backdrop-saturate on the UI for the refraction effect.
      */}

      {/* Primary Gold Flow - Main warmth */}
      <div className="absolute top-[-20%] left-[-10%] w-[90vw] h-[90vw] max-w-[1000px] max-h-[1000px] bg-gradient-to-br from-[#C9A646]/30 via-[#C9A646]/10 to-transparent rounded-full mix-blend-multiply dark:mix-blend-normal blur-[100px] animate-drift-slow" />
      
      {/* Secondary Beige/Earth - Grounding */}
      <div className="absolute bottom-[-10%] right-[-20%] w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] bg-gradient-to-tl from-[#A89F85]/40 via-[#8C846F]/20 to-transparent rounded-full mix-blend-multiply dark:mix-blend-normal blur-[80px] animate-drift-medium" />
      
      {/* Deep Tint - Depth & Contrast */}
      <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-purple-900/10 dark:bg-blue-900/20 rounded-full mix-blend-overlay dark:mix-blend-screen blur-[120px] animate-drift-fast" />
      
      {/* Specular Highlight Source - Simulates external light */}
      <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-white/20 dark:bg-white/5 rounded-full mix-blend-overlay blur-[90px] animate-drift-slow" />
    </div>
  );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-gray-900 dark:text-text-main font-body overflow-hidden selection:bg-gold selection:text-background-dark relative">
      <LiquidBackground />
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative scroll-smooth z-10 custom-scrollbar">
        {/* Key forces remount on route change to trigger animation */}
        <div key={location.pathname} className="animate-page-enter h-full">
          {children}
        </div>
      </main>
      <MobileNav />
      <SettingsModal />
      <CelebrationOverlay />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-transaction" element={<AddTransaction />} />
            <Route path="/capsules" element={<Capsules />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </AppLayout>
      </Router>
    </AppProvider>
  );
};

export default App;