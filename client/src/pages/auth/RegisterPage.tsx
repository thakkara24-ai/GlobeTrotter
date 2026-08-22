import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await register(name.trim(), email.trim(), password, confirmPassword);
      showToast('success', 'Account created! Welcome to GlobeTrotter.');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
            Create Your Account
          </h1>
          <p className="text-xs text-[#6F6A70] font-medium">Join GlobeTrotter to plan smarter and travel better</p>
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
              label="Full Name"
              type="text"
              placeholder="Aarav Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-full font-bold mt-2"
              isLoading={isLoading}
            >
              Get Started
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#6F6A70] font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#714B67] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
