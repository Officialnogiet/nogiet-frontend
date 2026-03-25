
import React, { useState, useEffect } from 'react';
import { AuthScreen } from '../types';
import { useDashboardStore } from '../src/stores/dashboard.store';
import { useLogout } from '../src/hooks/useAuth';
import { useAuthStore } from '../src/stores/auth.store';
import Sidebar from '../components/Sidebar';
import LiveMap from '../components/LiveMap';
import DataComparison from '../components/DataComparison';
import DataTabs from '../components/DataTabs';
import ManageData from '../components/ManageData';
import AlertsDashboard from '../components/AlertsDashboard';
import FilterPanel, { DEFAULT_FILTERS, type MapFilters } from '../components/FilterPanel';
import UserManagement from '../components/UserManagement';
import SettingsPage from '../components/SettingsPage';
import DashboardHome from '../components/DashboardHome';
import FieldDataForm from '../components/FieldDataForm';
import ScreenGuide from '../components/ScreenGuide';

interface DashboardProps {
  onNavigate: (screen: AuthScreen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { activeView, sidebarCollapsed, toggleSidebar, isFilterOpen, setFilterOpen, darkMode, toggleDarkMode, setActiveView } = useDashboardStore();
  const logoutMutation = useLogout();
  const [mapFilters, setMapFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const user = useAuthStore((s) => s.user);
  const isFacilityOwner = user?.role === 'facility_owner';

  useEffect(() => {
    if (isFacilityOwner && activeView !== 'FIELD_DATA') {
      setActiveView('FIELD_DATA');
    }
  }, [isFacilityOwner, activeView, setActiveView]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => onNavigate(AuthScreen.LOGIN),
    });
  };

  const renderContent = () => {
    switch (activeView) {
      case 'DASHBOARD_HOME':
        return <DashboardHome darkMode={darkMode} />;
      case 'LIVE_MAP':
        return <LiveMap onOpenFilters={() => setFilterOpen(true)} darkMode={darkMode} onNavigateAlerts={() => setActiveView('ALERTS')} filters={mapFilters} />;
      case 'DATA_COMPARISON':
        return <DataComparison darkMode={darkMode} />;
      case 'DATA_TABS':
        return <DataTabs darkMode={darkMode} />;
      case 'MANAGE_DATA':
        return <ManageData darkMode={darkMode} onNavigateAlerts={() => setActiveView('ALERTS')} />;
      case 'ALERTS':
        return <AlertsDashboard darkMode={darkMode} />;
      case 'FIELD_DATA':
        return <FieldDataForm darkMode={darkMode} />;
      case 'USER_MANAGEMENT':
        return <UserManagement darkMode={darkMode} />;
      case 'SETTINGS':
        return <SettingsPage darkMode={darkMode} />;
      default:
        return <DashboardHome darkMode={darkMode} />;
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
        <ScreenGuide darkMode={darkMode} screenKey={activeView} />
      </main>
    </div>
  );
};

export default Dashboard;
