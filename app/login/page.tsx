'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2 } from 'lucide-react';
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-backgroundSecondary to-background px-4 relative overflow-hidden">
      {/* Background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue/10 dark:bg-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple/10 dark:bg-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo + heading */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue to-purple rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foregroundPrimary">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-foregroundSecondary">
            Sign in to manage your event crew
          </p>
        </div>

        {/* Glassmorphism card */}
        <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl shadow-xl border border-border/50 p-8 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-foregroundPrimary font-medium"
              >
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
                className="h-12 rounded-xl border-border bg-backgroundSecondary/60 text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-foregroundPrimary font-medium"
              >
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
                className="h-12 rounded-xl border-border bg-backgroundSecondary/60 text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red bg-red/10 p-3 rounded-xl border border-red/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0051D5] hover:bg-[#0044B5] text-white font-semibold shadow-md transition-all duration-300"
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

          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-foregroundSecondary">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-semibold text-blue hover:opacity-80 transition-colors duration-200"
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
      </div>
    </main>
  );
}
