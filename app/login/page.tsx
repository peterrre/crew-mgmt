'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { themeConfig } from '@/lib/theme-config';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [fieldValidation, setFieldValidation] = useState({
    email: false,
    password: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${themeConfig.backgrounds.pageGradient} px-4`}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-sky-900 dark:text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-sky-700 dark:text-slate-400">
            Sign in to manage your event crew
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-amber-100 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-slate-200">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, email: value });
                    // Simple email validation
                    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                    setFieldValidation({ ...fieldValidation, email: isValid });
                  }}
                  required
                  className={`h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white pr-10 ${
                    fieldValidation.email ? 'border-green-500 dark:border-green-500' : ''
                  }`}
                  placeholder="you@example.com"
                />
                {fieldValidation.email && (
                  <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-slate-200">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, password: value });
                    // Minimum password length validation
                    const isValid = value.length >= 6;
                    setFieldValidation({ ...fieldValidation, password: isValid });
                  }}
                  required
                  className={`h-11 dark:bg-slate-700 dark:border-slate-600 dark:text-white pr-10 ${
                    fieldValidation.password ? 'border-green-500 dark:border-green-500' : ''
                  }`}
                  placeholder="••••••••"
                />
                {fieldValidation.password && (
                  <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-green-500" />
                )}
              </div>
              {formData.password.length > 0 && formData.password.length < 6 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-amber-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-sky-700 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                Register
              </Link>
            </p>
            <p className="mt-2 text-sm text-sky-700 dark:text-slate-400">
              Volunteer?{' '}
              <Link
                href="/signup-volunteer"
                className="font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
