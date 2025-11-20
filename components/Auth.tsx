
import React, { useState } from 'react';
import { Icons } from './Icons';
import { authService } from '../services/auth';
import { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError("Please enter both email and password.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      let user;
      if (isLogin) {
        user = await authService.login(email, password);
      } else {
        user = await authService.signup(email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const user = await authService.loginWithGoogle();
      onLogin(user);
    } catch (err: any) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-4 font-['Inter']">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 animate-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4 shadow-lg">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-gray-500 text-sm mt-2 text-center">
            {isLogin ? 'Enter your details to access your strategy.' : 'Start generating high-ticket strategies today.'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-3.5 px-4 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 relative overflow-hidden"
          >
             {googleLoading ? (
               <Icons.Loader2 className="w-5 h-5 animate-spin text-gray-400" />
             ) : (
               <>
                <Icons.Google className="w-5 h-5" />
                <span>Sign in with Google</span>
               </>
             )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 animate-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 rounded-2xl bg-black text-white font-bold text-lg shadow-lg hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Icons.Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Get Started'}
                  <Icons.ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setPassword('');
              }}
              className="ml-2 font-bold text-blue-600 hover:underline"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
