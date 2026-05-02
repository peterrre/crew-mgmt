'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NotificationProvider } from '@/components/NotificationContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SessionProvider>
        <NotificationProvider>
          <TooltipProvider delayDuration={300}>
            <AnimatePresence mode="wait">
              <div key={pathname}>{children}</div>
            </AnimatePresence>
          </TooltipProvider>
        </NotificationProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
