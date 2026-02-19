import React, { useState, useEffect } from 'react';
import { ProjectProvider, useProject } from './services/projectContext';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';

// Views
import Auth from './views/Auth';
import PortfolioView from './views/PortfolioView';
import DashboardView from './views/DashboardView';
import ProjectDataView from './views/ProjectDataView';
import EconomicIndicesView from './views/EconomicIndicesView';
import RevenueView from './views/RevenueView';
import CostsView from './views/CostsView';
import CashFlowView from './views/CashFlowView';
import DREView from './views/DREView';
import ScenariosView from './views/ScenariosView';
import LibraryView from './views/LibraryView';

// Components
import Sidebar from './components/Sidebar';

const AppContent = () => {
  const { currentView } = useProject();

  const renderView = () => {
    switch (currentView) {
      case 'PORTFOLIO': return <PortfolioView />;
      case 'DASHBOARD': return <DashboardView />;
      case 'PROJECT_DATA': return <ProjectDataView />;
      case 'ECONOMIC_INDICES': return <EconomicIndicesView />;
      case 'REVENUE': return <RevenueView />;
      case 'COSTS': return <CostsView />;
      case 'CASH_FLOW': return <CashFlowView />;
      case 'DRE': return <DREView />;
      case 'SCENARIOS': return <ScenariosView />;
      case 'LIBRARY': return <LibraryView />;
      default: return <PortfolioView />;
    }
  };

  return (
    <div className="flex bg-slate-100 min-h-screen font-sans">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
        {renderView()}
      </main>
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};

export default App;