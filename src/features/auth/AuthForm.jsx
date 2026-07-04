import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useResume } from '../../context/ResumeContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, HelpCircle, FileText, ArrowRight } from 'lucide-react';

export const AuthForm = () => {
  const navigate = useNavigate();
  const { mockAuthAction, sandboxMode } = useResume();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [statusMessage, setStatusMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const passwordValue = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      if (authMode === 'login' || authMode === 'signup') {
        const result = await mockAuthAction(authMode, data.email, data.password);
        if (result.success) {
          setStatusMessage({ type: 'success', text: authMode === 'login' ? 'Successfully logged in!' : 'Successfully signed up!' });
          setTimeout(() => navigate('/'), 1000);
        } else {
          setStatusMessage({ type: 'error', text: result.message || 'Authentication failed.' });
        }
      } else if (authMode === 'forgot') {
        // Mock sending reset link
        await new Promise(r => setTimeout(r, 1000));
        setStatusMessage({ type: 'success', text: 'Password reset link sent to your email.' });
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSandboxEnter = () => {
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Brand Banner */}
        <div className="p-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">Welcome to ResumeCraft AI</h2>
          <p className="text-xs text-primary-100 text-center leading-relaxed">
            Craft beautiful, ATS-optimized resumes in minutes with advanced Groq AI intelligence.
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Tabs */}
          {authMode !== 'forgot' && (
            <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </button>
            </div>
          )}

          {authMode === 'forgot' && (
            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Reset Password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              id="email"
              type="email"
              error={errors.email}
              required
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />

            {authMode !== 'forgot' && (
              <Input
                label="Password"
                id="password"
                type="password"
                error={errors.password}
                required
                placeholder="••••••••"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
            )}

            {authMode === 'signup' && (
              <Input
                label="Confirm Password"
                id="confirmPassword"
                type="password"
                error={errors.confirmPassword}
                required
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === passwordValue || 'Passwords do not match'
                })}
              />
            )}

            {authMode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {statusMessage && (
              <div className={`p-3 rounded-lg text-xs font-medium border ${
                statusMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/40'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/40'
              }`}>
                {statusMessage.text}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              {authMode === 'login' && 'Sign In'}
              {authMode === 'signup' && 'Create Account'}
              {authMode === 'forgot' && 'Send Reset Link'}
            </Button>
          </form>

          {authMode === 'forgot' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Back to Sign In
              </button>
            </div>
          )}

          {/* Sandbox Bypass Option */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleSandboxEnter}
            className="w-full flex items-center justify-center gap-1.5 border-dashed"
          >
            Continue in Sandbox Mode
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
