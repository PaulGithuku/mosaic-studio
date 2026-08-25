import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Lock, Mail, User, AlertCircle, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Name is too long')
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(128, 'Password cannot exceed 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') || '';

  // Password strength indicators
  const hasMinLength = passwordValue.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(passwordValue);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please try again.');
    }
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
          to="/login"
          className="text-xs uppercase tracking-widest text-[#A0A0A0] hover:text-[#C9A86A] transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md">
          {/* Card Frame */}
          <div className="bg-[#101010] border border-[#222222] rounded-sm p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Subtle champagne accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A86A] to-transparent opacity-80" />

            <div className="mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A86A] font-semibold">
                Join the Platform
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#F7F5F0] mt-1 tracking-tight">
                Create Photographer Account
              </h1>
              <p className="text-xs text-[#A0A0A0] mt-2 leading-relaxed">
                Launch your editorial booking portal, present your portfolio, and automate appointments.
              </p>
            </div>

            {serverError && (
              <div className="mb-6 p-3 bg-red-950/30 border border-red-800/40 rounded-sm flex items-start gap-2.5 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="Full Name or Studio Name"
                error={errors.name?.message}
                required
              >
                <Input
                  type="text"
                  placeholder="e.g. Elena Vance Photography"
                  autoComplete="name"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  {...register('name')}
                />
              </FormField>

              <FormField
                label="Professional Email"
                error={errors.email?.message}
                required
              >
                <Input
                  type="email"
                  placeholder="elena@vancestudio.com"
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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  isPasswordToggle
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.password?.message}
                  {...register('password')}
                />
              </FormField>

              {/* Password strength checklist */}
              {passwordValue && (
                <div className="p-2.5 bg-[#141414] rounded-sm border border-[#222222] space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        hasMinLength ? 'bg-[#C9A86A] text-black font-bold' : 'bg-[#222222] text-[#666666]'
                      }`}
                    >
                      {hasMinLength && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className={hasMinLength ? 'text-[#F7F5F0]' : 'text-[#666666]'}>
                      At least 6 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        hasLetter ? 'bg-[#C9A86A] text-black font-bold' : 'bg-[#222222] text-[#666666]'
                      }`}
                    >
                      {hasLetter && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className={hasLetter ? 'text-[#F7F5F0]' : 'text-[#666666]'}>
                      Contains letters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        hasNumberOrSymbol ? 'bg-[#C9A86A] text-black font-bold' : 'bg-[#222222] text-[#666666]'
                      }`}
                    >
                      {hasNumberOrSymbol && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className={hasNumberOrSymbol ? 'text-[#F7F5F0]' : 'text-[#666666]'}>
                      Contains number or symbol
                    </span>
                  </div>
                </div>
              )}

              <FormField
                label="Confirm Password"
                error={errors.confirmPassword?.message}
                required
              >
                <Input
                  type="password"
                  placeholder="Re-type your password"
                  autoComplete="new-password"
                  isPasswordToggle
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
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
                  Create Studio Account
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-[#1C1C1C] text-center">
              <p className="text-xs text-[#A0A0A0]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#F7F5F0] hover:text-[#C9A86A] font-medium transition-colors underline underline-offset-4"
                >
                  Sign In
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
