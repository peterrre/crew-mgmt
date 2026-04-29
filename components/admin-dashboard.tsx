'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Calendar, Users, LogOut, TrendingUp, ClipboardList, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

interface Stats {
  crewCount: number;
  volunteerCount: number;
  totalHelpers: number;
}

interface Helper {
  role: 'ADMIN' | 'CREW' | 'VOLUNTEER';
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    crewCount: 0,
    volunteerCount: 0,
    totalHelpers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/helpers');
      if (response.ok) {
        const data = await response.json();
        const helpers = data?.helpers || [];
        const crewCount = helpers.filter((h: Helper) => h?.role === 'CREW')?.length || 0;
        const volunteerCount = helpers.filter((h: Helper) => h?.role === 'VOLUNTEER')?.length || 0;
        setStats({
          crewCount,
          volunteerCount,
          totalHelpers: helpers.length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 dark:bg-background/80 backdrop-blur-md border-b border-amber-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foregroundPrimary dark:text-foregroundSecondary">Event Crew Manager</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-sky-700 hover:text-sky-900 dark:text-slate-300 dark:hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-sky-900 dark:text-white mb-2">
            Welcome{session?.user?.name ? `, ${session.user.name}` : ''}!
          </h2>
          <p className="text-foregroundSecondary dark:text-foregroundTertiary">Manage your event crew and schedules</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-background dark:bg-backgroundSecondary rounded-xl p-6 shadow hover:shadowMedium transition-shadow border border-border dark:border-borderLight">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blueForeground dark:bg-blue rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue dark:text-blueForeground" />
              </div>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-foregroundPrimary dark:text-foregroundPrimary">
              {loading ? '...' : stats.crewCount}
            </h3>
            <p className="text-sm text-foregroundSecondary dark:text-foregroundTertiary mt-1">Crew Members</p>
          </div>

          <div className="bg-background dark:bg-backgroundSecondary rounded-xl p-6 shadow hover:shadowMedium transition-shadow border border-border dark:border-borderLight">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-backgroundSecondary dark:bg-background rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-yellow dark:text-yellowForeground" />
              </div>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-foregroundPrimary dark:text-foregroundPrimary">
              {loading ? '...' : stats.volunteerCount}
            </h3>
            <p className="text-sm text-foregroundSecondary dark:text-foregroundTertiary mt-1">Volunteers</p>
          </div>

          <div className="bg-background dark:bg-backgroundSecondary rounded-xl p-6 shadow hover:shadowMedium transition-shadow border border-border dark:border-borderLight">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-backgroundSecondary dark:bg-background rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange dark:text-orangeForeground" />
              </div>
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-foregroundPrimary dark:text-foregroundPrimary">
              {loading ? '...' : stats.totalHelpers}
            </h3>
            <p className="text-sm text-foregroundSecondary dark:text-foregroundTertiary mt-1">Total Helpers</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/helpers" className="h-full">
            <div className="bg-gradient-primary rounded-xl p-8 shadow hover:shadowLarge transition-all hover:scale-105 cursor-pointer h-full">
              <div className="w-14 h-14 bg-background/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foregroundPrimary mb-2">Manage Helpers</h3>
              <p className="text-foregroundSecondary">
                View and manage crew members and volunteers
              </p>
            </div>
          </Link>

          <Link href="/admin/events" className="h-full">
            <div className="bg-gradient-secondary rounded-xl p-8 shadow hover:shadowLarge transition-all hover:scale-105 cursor-pointer h-full">
              <div className="w-14 h-14 bg-background/20 rounded-xl flex items-center justify-center mb-4">
                <CalendarDays className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foregroundPrimary mb-2">Events</h3>
              <p className="text-foregroundSecondary">
                Manage events, crew, schedules and requests
              </p>
            </div>
          </Link>

          <Link href="/shift-requests" className="h-full">
            <div className="bg-gradient-secondary rounded-xl p-8 shadow hover:shadowLarge transition-all hover:scale-105 cursor-pointer h-full">
              <div className="w-14 h-14 bg-background/20 rounded-xl flex items-center justify-center mb-4">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foregroundPrimary mb-2">Shift Requests</h3>
              <p className="text-foregroundSecondary">
                Monitor and manage requests across all events
              </p>
            </div>
          </Link>

          <Link href="/reports" className="h-full">
            <div className="bg-gradient-secondary rounded-xl p-8 shadow hover:shadowLarge transition-all hover:scale-105 cursor-pointer h-full">
              <div className="w-14 h-14 bg-background/20 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foregroundPrimary mb-2">Hours Report</h3>
              <p className="text-foregroundSecondary">
                View working hours per helper
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
