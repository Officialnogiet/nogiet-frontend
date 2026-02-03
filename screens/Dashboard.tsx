
import React, { useState } from 'react';
import { AuthScreen, DashboardView } from '../types';
import Sidebar from '../components/Sidebar';
import LiveMap from '../components/LiveMap';
import DataComparison from '../components/DataComparison';
import FilterPanel from '../components/FilterPanel';

interface DashboardProps {
  onNavigate: (screen: AuthScreen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [activeView, setActiveView] = useState<DashboardView>('LIVE_MAP');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={() => onNavigate(AuthScreen.LOGIN)}
      />
      
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeView === 'LIVE_MAP' ? (
          <LiveMap onOpenFilters={() => setIsFilterOpen(true)} />
        ) : (
          <DataComparison />
        )}

        {/* Filter Panel Drawer Overlay */}
        {isFilterOpen && (
          <FilterPanel onClose={() => setIsFilterOpen(false)} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
