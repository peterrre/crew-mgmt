'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Calendar } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

const routeLabels: Record<string, string> = {
  '': 'Home',
  admin: 'Admin',
  events: 'Events',
  helpers: 'Helfer',
  schedules: 'Schichtplan',
  'shift-requests': 'Schicht-Anfragen',
  profile: 'Profil',
  reports: 'Berichte',
  login: 'Anmelden',
  register: 'Registrieren',
  'signup-volunteer': 'Helfer werden',
  create: 'Erstellen',
};

function buildBreadcrumbs(pathname: string | null) {
  const path = pathname ?? '/';
  const segments = path.split('/').filter(Boolean);
  const crumbs: { label: string; href: string; isCurrent: boolean }[] = [
    { label: 'Home', href: '/', isCurrent: segments.length === 0 },
  ];

  let accumulated = '';
  for (let i = 0; i < segments.length; i++) {
    accumulated += `/${segments[i]}`;
    const isCurrent = i === segments.length - 1;
    crumbs.push({
      label: routeLabels[segments[i]] || decodeURIComponent(segments[i]),
      href: accumulated,
      isCurrent,
    });
  }

  return crumbs;
}

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  // Don't show breadcrumbs on landing or auth pages
  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/signup-volunteer') {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isCurrent ? (
                <BreadcrumbPage className="text-foregroundPrimary font-medium text-sm">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={crumb.href}
                    className="text-foregroundSecondary text-sm hover:text-foregroundPrimary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {i < crumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppTopBar() {
  const pathname = usePathname();

  // Hide top bar on public pages
  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/signup-volunteer') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 backdrop-blur-xl bg-background/80">
      <div className="flex h-14 items-center px-6 gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-blue to-purple rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foregroundPrimary text-sm hidden sm:inline">
            Crew Mgmt
          </span>
        </Link>
        <AppBreadcrumbs />
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
