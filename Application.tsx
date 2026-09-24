
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
import Home from './screens/Home';

const pathForScreen = (screen: AuthScreen) => {
  if (screen === AuthScreen.HOME) return '/';
  if (screen === AuthScreen.LOGIN) return '/login';
  if (screen === AuthScreen.FORGOT_PASSWORD) return '/forgot-password';
  if (screen === AuthScreen.VERIFY_CODE) return '/verify-code';
  if (screen === AuthScreen.NEW_PASSWORD) return '/new-password';
  if (screen === AuthScreen.SUCCESS) return '/password-updated';
  return '/app';
};

const screenForPath = (isAuthenticated: boolean) => {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/') return AuthScreen.HOME;
  if (path === '/forgot-password') return AuthScreen.FORGOT_PASSWORD;
  if (path === '/verify-code') return AuthScreen.VERIFY_CODE;
  if (path === '/new-password') return AuthScreen.NEW_PASSWORD;
  if (path === '/password-updated') return AuthScreen.SUCCESS;
  if (path === '/app' && isAuthenticated) return AuthScreen.DASHBOARD;
  return isAuthenticated ? AuthScreen.DASHBOARD : AuthScreen.LOGIN;
};

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const darkMode = useDashboardStore((s) => s.darkMode);
  const [currentScreen, setCurrentScreen] = React.useState<AuthScreen>(
    () => screenForPath(isAuthenticated)
  );

  const navigate = React.useCallback((screen: AuthScreen) => {
    setCurrentScreen(screen);
    const path = pathForScreen(screen);
    if (window.location.pathname !== path) window.history.pushState({ screen }, '', path);
  }, []);

  React.useEffect(() => {
    const handleBack = () => setCurrentScreen(screenForPath(useAuthStore.getState().isAuthenticated));
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case AuthScreen.HOME:
        return <Home isAuthenticated={isAuthenticated} onNavigate={navigate} />;
      case AuthScreen.LOGIN:
        return <Login onNavigate={navigate} />;
      case AuthScreen.FORGOT_PASSWORD:
        return <ForgotPassword onNavigate={navigate} />;
      case AuthScreen.VERIFY_CODE:
        return <VerifyCode onNavigate={navigate} />;
      case AuthScreen.NEW_PASSWORD:
        return <NewPassword onNavigate={navigate} />;
      case AuthScreen.SUCCESS:
        return <Success onNavigate={navigate} />;
      case AuthScreen.DASHBOARD:
        return <Dashboard onNavigate={navigate} />;
      default:
        return <Home isAuthenticated={isAuthenticated} onNavigate={navigate} />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden transition-colors duration-300 ${currentScreen === AuthScreen.DASHBOARD && darkMode ? 'bg-[#0b0e14]' : 'bg-white'}`}>
      {renderScreen()}
    </div>
  );
};

export default App;
