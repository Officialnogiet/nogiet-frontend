
import React from 'react';
import { AuthScreen } from './types';
import { useAuthStore } from './src/stores/auth.store';
import Login from './screens/auth/Login';
import ForgotPassword from './screens/auth/ForgotPassword';
import VerifyCode from './screens/auth/VerifyCode';
import NewPassword from './screens/auth/NewPassword';
import Success from './screens/auth/Success';
import Dashboard from './screens/Dashboard';
import { useDashboardStore } from './src/stores/dashboard.store';

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const darkMode = useDashboardStore((s) => s.darkMode);
  const [currentScreen, setCurrentScreen] = React.useState<AuthScreen>(
    isAuthenticated ? AuthScreen.DASHBOARD : AuthScreen.LOGIN
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case AuthScreen.LOGIN:
        return <Login onNavigate={setCurrentScreen} />;
      case AuthScreen.FORGOT_PASSWORD:
        return <ForgotPassword onNavigate={setCurrentScreen} />;
      case AuthScreen.VERIFY_CODE:
        return <VerifyCode onNavigate={setCurrentScreen} />;
      case AuthScreen.NEW_PASSWORD:
        return <NewPassword onNavigate={setCurrentScreen} />;
      case AuthScreen.SUCCESS:
        return <Success onNavigate={setCurrentScreen} />;
      case AuthScreen.DASHBOARD:
        return <Dashboard onNavigate={setCurrentScreen} />;
      default:
        return <Login onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${currentScreen === AuthScreen.DASHBOARD && darkMode ? 'bg-[#0b0e14]' : 'bg-white'}`}>
      {renderScreen()}
    </div>
  );
};

export default App;
