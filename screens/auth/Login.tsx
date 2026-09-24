import React, { useState } from 'react';
import { AuthScreen } from '../../types';
import { useLogin } from '../../src/hooks/useAuth';
import { loginSchema } from '../../src/validations/auth.schema';
import logoFull from '../../assets/logo-full.png';
import LoginHeroPanel from '../../components/auth/LoginHeroPanel';
import LoginForm from '../../components/auth/LoginForm';
import PartnerLogos from '../../components/auth/PartnerLogos';

interface LoginProps {
  onNavigate: (screen: AuthScreen) => void;
}

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string>();
  const loginMutation = useLogin();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(undefined);
    const result = loginSchema.safeParse({ email, password, rememberMe });
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message);
      return;
    }
    loginMutation.mutate(result.data, {
      onSuccess: () => onNavigate(AuthScreen.DASHBOARD),
    });
  };

  const errorMessage = validationError ?? (loginMutation.isError ? loginMutation.error?.message : undefined);

  return (
    <div className="nogiet-public-theme flex flex-col md:flex-row min-h-screen bg-white">
      <LoginHeroPanel />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 pt-16 md:px-8 md:pb-8 md:pt-20 lg:px-12 lg:pb-12 relative bg-white">
        <button type="button" onClick={() => onNavigate(AuthScreen.HOME)} className="absolute left-6 top-5 text-xs font-bold text-neutral-500 hover:text-primary-dark md:left-8 md:top-7">← Back to homepage</button>
        <div className="w-full max-w-[390px]">
          <div className="mb-9 flex w-full flex-col items-center">
            <img src={logoFull} alt="NOGIET" className="h-9 w-auto" />
            <p className="mt-4 text-center text-xs leading-5 text-neutral-500 md:hidden">The Nigerian Oil and Gas Industry Emission Tracker</p>
            <PartnerLogos />
          </div>
          <LoginForm
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPassword={showPassword} setShowPassword={setShowPassword}
            rememberMe={rememberMe} setRememberMe={setRememberMe}
            isPending={loginMutation.isPending}
            errorMessage={errorMessage}
            onSubmit={handleSignIn}
            onForgotPassword={() => onNavigate(AuthScreen.FORGOT_PASSWORD)}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
