'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { LiveRegion } from '@/components/ui/live-region';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SessionProvider>
        {children}
        <Toaster />
        <LiveRegion />
      </SessionProvider>
    </ThemeProvider>
  );
}
