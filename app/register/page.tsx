'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        setServerError(responseData.error || 'Registration failed');
        return;
      }

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError('Registration successful but login failed');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setServerError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-md">
              <Calendar className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Create account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join our event management platform
          </p>
        </div>

        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Full Name
              </Label>
              <Input
                id="name"
                {...register('name')}
                className={cn(
                  'h-11 bg-background border-input',
                  errors.name ? 'border-destructive' : ''
                )}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                {...register('email')}
                className={cn(
                  'h-11 bg-background border-input',
                  errors.email ? 'border-destructive' : ''
                )}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={cn(
                  'h-11 bg-background border-input',
                  errors.password ? 'border-destructive' : ''
                )}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}