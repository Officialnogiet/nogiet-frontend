
import React, { useState } from 'react';
import { AuthScreen } from '../types';
import { useDashboardStore } from '../src/stores/dashboard.store';
import { useLogout } from '../src/hooks/useAuth';
import Sidebar from '../components/Sidebar';
import LiveMap from '../components/LiveMap';
import DataComparison from '../components/DataComparison';
import ManageData from '../components/ManageData';
import AlertsDashboard from '../components/AlertsDashboard';
import FilterPanel, { DEFAULT_FILTERS, type MapFilters } from '../components/FilterPanel';
import UserManagement from '../components/UserManagement';
import SettingsPage from '../components/SettingsPage';

interface DashboardProps {
  onNavigate: (screen: AuthScreen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { activeView, sidebarCollapsed, toggleSidebar, isFilterOpen, setFilterOpen, darkMode, toggleDarkMode, setActiveView } = useDashboardStore();
  const logoutMutation = useLogout();
  const [mapFilters, setMapFilters] = useState<MapFilters>(DEFAULT_FILTERS);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => onNavigate(AuthScreen.LOGIN),
    });
  };

  const renderContent = () => {
    switch (activeView) {
      case 'LIVE_MAP':
        return <LiveMap onOpenFilters={() => setFilterOpen(true)} darkMode={darkMode} onNavigateAlerts={() => setActiveView('ALERTS')} filters={mapFilters} />;
      case 'DATA_COMPARISON':
        return <DataComparison darkMode={darkMode} />;
      case 'MANAGE_DATA':
        return <ManageData darkMode={darkMode} onNavigateAlerts={() => setActiveView('ALERTS')} />;
      case 'ALERTS':
        return <AlertsDashboard darkMode={darkMode} />;
      case 'USER_MANAGEMENT':
        return <UserManagement darkMode={darkMode} />;
      case 'SETTINGS':
        return <SettingsPage darkMode={darkMode} />;
      default:
        return <LiveMap onOpenFilters={() => setFilterOpen(true)} darkMode={darkMode} onNavigateAlerts={() => setActiveView('ALERTS')} filters={mapFilters} />;
    }
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'} overflow-hidden`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {renderContent()}
        {isFilterOpen && <FilterPanel onClose={() => setFilterOpen(false)} darkMode={darkMode} filters={mapFilters} onApply={setMapFilters} />}
      </main>
    </div>
  );
};

export default Dashboard;
