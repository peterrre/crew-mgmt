'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    } catch (_err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-backgroundSecondary px-4 relative overflow-hidden">
      {/* Subtle ambient background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo + Title */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-gradient-primary rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue/20 transition-transform duration-300 hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foregroundPrimary">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-foregroundSecondary">
            Sign in to manage your crew
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-background rounded-2xl shadow-lg border border-border/50 p-8 transition-shadow duration-300 hover:shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foregroundPrimary font-medium text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="h-12 rounded-xl border-border bg-backgroundSecondary text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foregroundPrimary font-medium text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="h-12 rounded-xl border-border bg-backgroundSecondary text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red bg-red/10 p-3 rounded-xl border border-red/20">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#0051D5] hover:bg-[#0044B5] text-white font-semibold shadow-md shadow-blue-500/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
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

          {/* CTA Links */}
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-foregroundSecondary">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-semibold text-[#0051D5] hover:text-[#0044B5] dark:text-[#0A84FF] dark:hover:text-[#409CFF] transition-colors duration-200"
              >
                Register
              </Link>
            </p>
            <p className="text-sm text-foregroundSecondary">
              Volunteer?{' '}
              <Link
                href="/signup-volunteer"
                className="font-semibold text-[#8A5300] hover:text-[#6B4100] transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Subtle footer */}
        <p className="text-center text-xs text-foregroundSecondary">
          By signing in, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
