'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Heart } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { FormFieldMessage, PasswordStrength } from '@/components/ui/form-fields';
import { FadeIn } from '@/components/ui/interactive';
import { toast } from 'sonner';

const volunteerSchema = z.object({
  name: z.string().min(2, { message: 'Name muss mindestens 2 Zeichen haben' }),
  email: z.string().email({ message: 'Ungültige E-Mail-Adresse' }),
  password: z.string().min(6, { message: 'Passwort muss mindestens 6 Zeichen haben' }),
});

type VolunteerFormValues = z.infer<typeof volunteerSchema>;

export default function SignupVolunteerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<VolunteerFormValues>({
    resolver: zodResolver(volunteerSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: VolunteerFormValues) => {
    setLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role: 'VOLUNTEER' }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const msg = responseData.error || 'Registrierung fehlgeschlagen';
        setServerError(msg);
        toast.error(msg);
        return;
      }

      toast.success('Registrierung erfolgreich!');

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Registrierung erfolgreich, aber Anmeldung fehlgeschlagen');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      const msg = 'Etwas ist schiefgelaufen';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-backgroundSecondary to-background px-4 relative overflow-hidden">
      {/* Background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple/10 dark:bg-purple/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue/10 dark:bg-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <FadeIn className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo + heading */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple to-pink rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foregroundPrimary">
            Helfer werden
          </h1>
          <p className="mt-2 text-sm text-foregroundSecondary">
            Mach unsere Festivals unvergesslich
          </p>
        </div>

        {/* Glassmorphism card */}
        <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl shadow-xl border border-border/50 p-8 transition-all duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foregroundPrimary font-medium">
                Vollständiger Name
              </Label>
              <Input
                id="name"
                {...register('name')}
                className={cn(
                  'h-12 rounded-xl border-border bg-backgroundSecondary/60 text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-purple/30 focus:border-purple transition-all duration-200',
                  errors.name ? 'border-destructive' : ''
                )}
                placeholder="Max Mustermann"
                required
              />
              <FormFieldMessage message={errors.name?.message} type="error" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foregroundPrimary font-medium">
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={cn(
                  'h-12 rounded-xl border-border bg-backgroundSecondary/60 text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-purple/30 focus:border-purple transition-all duration-200',
                  errors.email ? 'border-destructive' : ''
                )}
                placeholder="du@beispiel.de"
                required
              />
              <FormFieldMessage message={errors.email?.message} type="error" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foregroundPrimary font-medium">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={cn(
                  'h-12 rounded-xl border-border bg-backgroundSecondary/60 text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-purple/30 focus:border-purple transition-all duration-200',
                  errors.password ? 'border-destructive' : ''
                )}
                placeholder="••••••••"
                required
              />
              <FormFieldMessage message={errors.password?.message} type="error" />
              <PasswordStrength password={passwordValue} />
            </div>

            {serverError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || loading || !isValid}
              className="w-full h-11 bg-gradient-to-r from-purple to-pink hover:opacity-90 text-white font-semibold shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registriere...
                </>
              ) : (
                'Als Helfer registrieren'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-foregroundSecondary">
              Bereits ein Konto?{' '}
              <Link
                href="/login"
                className="font-semibold text-purple hover:opacity-80 transition-colors duration-200"
              >
                Anmelden
              </Link>
            </p>
          </div>
        </div>
      </FadeIn>
    </main>
  );
}
