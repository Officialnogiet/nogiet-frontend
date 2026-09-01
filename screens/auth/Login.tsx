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
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      <LoginHeroPanel />
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12 relative bg-white">
        <button type="button" onClick={() => onNavigate(AuthScreen.HOME)} className="absolute left-6 top-5 text-xs font-bold text-slate-500 hover:text-teal-700 md:left-8 md:top-7">← Back to homepage</button>
        <div className="w-full max-w-[390px]">
          <div className="md:hidden flex items-center justify-center mb-8">
            <div className="w-full"><img src={logoFull} alt="NOGIET" className="h-8 w-auto mx-auto" /><PartnerLogos /></div>
          </div>
          <div className="flex justify-center mb-8">
            <div className="hidden md:flex w-full flex-col items-center mb-8">
              <img src={logoFull} alt="NOGIET" className="h-10 w-auto" />
              <PartnerLogos />
            </div>
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
