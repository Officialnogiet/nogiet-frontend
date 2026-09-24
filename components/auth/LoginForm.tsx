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
      <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Welcome to NOGIET</h2>
      <p className="text-neutral-500 text-sm">Sign in to your dashboard</p>
    </div>
    {errorMessage && <p role="alert" className="text-neutral-800 text-sm bg-neutral-100 border border-neutral-300 p-3 rounded-lg">{errorMessage}</p>}
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-500">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-5 py-3 rounded-full border outline-none bg-white border-neutral-200 text-neutral-900 placeholder-neutral-300 focus:ring-1 focus:ring-primary"
          placeholder="name@mail.com" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-500">Password</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-3 rounded-full border outline-none pr-12 tracking-widest bg-white border-neutral-200 text-neutral-900 placeholder-neutral-300"
            placeholder="••••••••" />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}
            className="password-visibility-toggle absolute inset-y-0 right-3 flex w-10 items-center justify-center text-neutral-400 hover:text-neutral-600">
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
          <div className={`w-4 h-4 rounded border flex items-center justify-center ${rememberMe ? 'bg-primary border-primary' : 'bg-neutral-100 border-neutral-300'}`}>
            {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <span className="text-sm font-medium text-neutral-900">Keep me logged in</span>
        </label>
        <button type="button" onClick={onForgotPassword} className="text-sm text-primary-dark font-bold hover:underline">Forgot Password?</button>
      </div>
      <button type="submit" disabled={isPending}
        className="nogiet-button nogiet-button-primary inline-flex w-full">
        {isPending ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  </div>
);

export default LoginForm;
