import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const sessionExpired = new URLSearchParams(location.search).get('session_expired') === 'true';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Invalid email or password');
    }
  };

  const handleQuickDemoFill = () => {
    setValue('email', 'alex.rivers@mosaic.studio');
    setValue('password', 'StudioPro2026!');
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-[#F7F5F0] flex flex-col justify-between selection:bg-[#C9A86A] selection:text-black">
      {/* Top Header */}
      <header className="p-6 sm:p-8 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-[#141414] border border-[#2B2B2B] flex items-center justify-center text-[#C9A86A]">
            <Camera className="w-4 h-4" />
          </div>
          <span className="font-serif text-lg tracking-wider font-semibold text-[#F7F5F0]">
            MOSAIC STUDIO
          </span>
        </Link>
        <Link
          to="/register"
          className="text-xs uppercase tracking-widest text-[#A0A0A0] hover:text-[#C9A86A] transition-colors"
        >
          Create Account
        </Link>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-md">
          {/* Card Frame */}
          <div className="bg-[#101010] border border-[#222222] rounded-sm p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Subtle champagne accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A86A] to-transparent opacity-80" />

            <div className="mb-8">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold">
                Photographer Access
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#F7F5F0] mt-1 tracking-tight">
                Sign In to Studio
              </h1>
              <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                Manage your appointments, photography portfolio, and client bookings.
              </p>
            </div>

            {sessionExpired && (
              <div className="mb-6 p-3 bg-amber-950/30 border border-amber-800/40 rounded-sm flex items-start gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Your session has expired. Please sign in again to continue.</span>
              </div>
            )}

            {serverError && (
              <div className="mb-6 p-3 bg-red-950/30 border border-red-800/40 rounded-sm flex items-start gap-2.5 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                label="Email Address"
                error={errors.email?.message}
                required
              >
                <Input
                  type="email"
                  placeholder="photographer@mosaic.studio"
                  autoComplete="email"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </FormField>

              <FormField
                label="Password"
                error={errors.password?.message}
                required
              >
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  isPasswordToggle
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />
              </FormField>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="champagne"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full justify-center"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[#1C1C1C] flex flex-col gap-4 text-center">
              <p className="text-xs text-[#A0A0A0]">
                Don't have a photographer account yet?{' '}
                <Link
                  to="/register"
                  className="text-[#F7F5F0] hover:text-[#C9A86A] font-medium transition-colors underline underline-offset-4"
                >
                  Register Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-[#555555]">
        MOSAIC STUDIO © {new Date().getFullYear()} — Premium Photographer Booking Platform
      </footer>
    </div>
  );
};
