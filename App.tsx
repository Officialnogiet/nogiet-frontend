
import React, { useState } from 'react';
import { AuthScreen } from './types';
import Login from './screens/auth/Login';
import ForgotPassword from './screens/auth/ForgotPassword';
import VerifyCode from './screens/auth/VerifyCode';
import NewPassword from './screens/auth/NewPassword';
import Success from './screens/auth/Success';
import Dashboard from './screens/Dashboard';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>(AuthScreen.LOGIN);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);

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
        return <Dashboard onNavigate={setCurrentScreen} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />;
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
