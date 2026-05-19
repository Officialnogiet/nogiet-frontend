
import React, { useState, useEffect } from 'react';
import { AuthScreen } from '../types';
import { useDashboardStore } from '../src/stores/dashboard.store';
import { useLogout } from '../src/hooks/useAuth';
import { useAuthStore } from '../src/stores/auth.store';
import Sidebar from '../components/Sidebar';
import MobileBottomNav from '../components/MobileBottomNav';
import LiveMap from '../components/LiveMap';
import MethaneTrends from '../components/MethaneTrends';
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
import ErrorBoundary from '../components/ErrorBoundary';
import Docs from './docs/Docs';

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
    let content: React.ReactNode;
    let label = 'Screen';

    switch (activeView) {
      case 'DASHBOARD_HOME':
        content = <DashboardHome darkMode={darkMode} onNavigate={(v) => setActiveView(v as any)} />;
        label = 'Dashboard';
        break;
      case 'LIVE_MAP':
        content = <LiveMap onOpenFilters={() => setFilterOpen(true)} darkMode={darkMode} onNavigateAlerts={() => setActiveView('ALERTS')} filters={mapFilters} />;
        label = 'Live Map';
        break;
      case 'METHANE_TRENDS':
        content = <MethaneTrends darkMode={darkMode} />;
        label = 'Methane Trends';
        break;
      case 'DATA_COMPARISON':
        content = <DataComparison darkMode={darkMode} />;
        label = 'Data Comparison';
        break;
      case 'DATA_TABS':
        content = <DataTabs darkMode={darkMode} />;
        label = 'Data Tabs';
        break;
      case 'MANAGE_DATA':
        content = <ManageData darkMode={darkMode} onNavigateAlerts={() => setActiveView('ALERTS')} />;
        label = 'Manage Data';
        break;
      case 'ALERTS':
        content = <AlertsDashboard darkMode={darkMode} />;
        label = 'Alerts';
        break;
      case 'FIELD_DATA':
        content = <FieldDataForm darkMode={darkMode} />;
        label = 'Field Data';
        break;
      case 'USER_MANAGEMENT':
        content = <UserManagement darkMode={darkMode} />;
        label = 'User Management';
        break;
      case 'SETTINGS':
        content = <SettingsPage darkMode={darkMode} onClose={() => setActiveView('DASHBOARD_HOME')} />;
        label = 'Settings';
        break;
      case 'DOCS':
        content = <Docs darkMode={darkMode} />;
        label = 'Documentation';
        break;
      default:
        content = <DashboardHome darkMode={darkMode} onNavigate={(v) => setActiveView(v as any)} />;
        label = 'Dashboard';
    }

    return (
      <ErrorBoundary darkMode={darkMode} screenName={label}>
        {content}
      </ErrorBoundary>
    );
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'} overflow-hidden`}>
      <div className="hidden md:flex">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </div>
      <main className="flex-1 relative overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom)] md:pb-0">
        <div className={`flex-1 overflow-hidden flex flex-col ${activeView !== 'LIVE_MAP' ? 'pb-16 md:pb-0' : ''}`}>
          {renderContent()}
        </div>
        {isFilterOpen && <FilterPanel onClose={() => setFilterOpen(false)} darkMode={darkMode} filters={mapFilters} onApply={setMapFilters} />}
        <ScreenGuide darkMode={darkMode} screenKey={activeView} />
      </main>
      <div className="md:hidden">
        <MobileBottomNav
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={handleLogout}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

export default Dashboard;
