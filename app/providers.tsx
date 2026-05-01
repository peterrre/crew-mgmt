'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';

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
        <TooltipProvider delayDuration={300}>
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
