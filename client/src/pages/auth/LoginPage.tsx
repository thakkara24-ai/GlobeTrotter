import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      showToast('success', 'Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'USER' | 'ADMIN') => {
    const demoEmail = role === 'ADMIN' ? 'admin@globetrotter.com' : 'demo@globetrotter.com';
    const demoPassword = role === 'ADMIN' ? 'admin123' : 'password123';

    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    setError('');

    try {
      await login(demoEmail, demoPassword);
      showToast('success', role === 'ADMIN' ? 'Logged in as Demo Admin!' : 'Logged in as Demo Traveler!');
      navigate(role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login with demo credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F7F7F6]">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding with New Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-1">
            <img
              src="/logo.png"
              alt="GlobeTrotter Logo"
              className="w-16 h-16 rounded-2xl object-contain shadow-soft"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#2F2930] tracking-tight">
            Welcome to Globe<span className="text-[#714B67]">Trotter</span>
          </h1>
          <p className="text-xs text-[#6F6A70] font-medium">Sign in to organize your multi-city travel plans</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E1E4] shadow-soft space-y-6">
          {error && (
            <div className="p-3 bg-[#F9EFEF] border border-[#F0D1D1] text-[#B85C5C] text-xs font-bold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="demo@globetrotter.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-full font-bold mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick 1-Click Evaluation Logins */}
          <div className="pt-4 border-t border-[#E5E1E4] space-y-2.5">
            <div className="text-center">
              <p className="text-[11px] font-bold text-[#6F6A70] uppercase tracking-wider">
                1-Click Evaluation Access
              </p>
              <p className="text-[10px] text-[#6F6A70] mt-0.5">
                (Click either button to log in automatically)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('USER')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#F4EEF3] hover:bg-[#EAE1E8] text-[#714B67] text-xs font-bold transition border border-[#E5E1E4] cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" /> Demo Traveler
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#EAF5F5] hover:bg-[#D5ECEC] text-[#017E84] text-xs font-bold transition border border-[#B0DCDE] cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Demo Admin
              </button>
            </div>
            <p className="text-[10px] text-center text-[#6F6A70]">
              Credentials: <code className="text-[#714B67] font-semibold">demo@globetrotter.com</code> / <code className="text-[#714B67] font-semibold">password123</code> & <code className="text-[#017E84] font-semibold">admin@globetrotter.com</code> / <code className="text-[#017E84] font-semibold">admin123</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#6F6A70] font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#714B67] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
