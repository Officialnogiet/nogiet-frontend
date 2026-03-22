import React from 'react';

interface LoginFormProps {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  rememberMe: boolean; setRememberMe: (v: boolean) => void;
  isPending: boolean;
  errorMessage?: string;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  email, setEmail, password, setPassword, showPassword, setShowPassword,
  rememberMe, setRememberMe, isPending, errorMessage, onSubmit, onForgotPassword,
}) => (
  <div className="space-y-8">
    <div className="space-y-2">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome</h2>
      <p className="text-gray-500 text-sm">Sign in to your dashboard</p>
    </div>
    {errorMessage && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{errorMessage}</p>}
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-500">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border outline-none bg-white border-gray-200 text-gray-900 placeholder-gray-300 focus:ring-1 focus:ring-[#009688]"
          placeholder="name@mail.com" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-500">Password</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border outline-none tracking-widest bg-white border-gray-200 text-gray-900 placeholder-gray-300"
            placeholder="••••••••" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" className="sr-only" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          <div className={`w-4 h-4 rounded border flex items-center justify-center ${rememberMe ? 'bg-[#009688] border-[#009688]' : 'bg-gray-100 border-gray-300'}`}>
            {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <span className="text-sm font-medium text-gray-900">Keep me logged in</span>
        </label>
        <button type="button" onClick={onForgotPassword} className="text-sm text-[#006E66] font-bold hover:underline">Forgot Password?</button>
      </div>
      <button type="submit" disabled={isPending}
        className="w-full bg-[#009688] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#00796b] transition-all disabled:opacity-60">
        {isPending ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  </div>
);

export default LoginForm;
