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
    <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background">
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue to-purple rounded-xl flex items-center justify-center shadow-lg shadow-blue/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-foregroundPrimary dark:text-white">
                Event Crew Manager
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-foregroundSecondary hover:text-foregroundPrimary dark:text-foregroundSecondary dark:hover:text-white"
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
        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-tight text-foregroundPrimary dark:text-white mb-2">
            Welcome{session?.user?.name ? `, ${session.user.name}` : ''}!
          </h2>
          <p className="text-foregroundSecondary dark:text-foregroundTertiary">
            Manage your event crew and schedules
          </p>
        </div>

        {/* Stats Cards - Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue" />
              </div>
              <TrendingUp className="w-5 h-5 text-green" />
            </div>
            <h3 className="text-2xl font-bold text-foregroundPrimary dark:text-white">
              {loading ? '...' : stats.crewCount}
            </h3>
            <p className="text-sm text-foregroundSecondary dark:text-foregroundTertiary mt-1">Crew Members</p>
          </div>

          <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange" />
              </div>
              <TrendingUp className="w-5 h-5 text-green" />
            </div>
            <h3 className="text-2xl font-bold text-foregroundPrimary dark:text-white">
              {loading ? '...' : stats.volunteerCount}
            </h3>
            <p className="text-sm text-foregroundSecondary dark:text-foregroundTertiary mt-1">Volunteers</p>
          </div>

          <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple" />
              </div>
              <TrendingUp className="w-5 h-5 text-green" />
            </div>
            <h3 className="text-2xl font-bold text-foregroundPrimary dark:text-white">
              {loading ? '...' : stats.totalHelpers}
            </h3>
            <p className="text-sm text-foregroundSecondary dark:text-foregroundTertiary mt-1">Total Helpers</p>
          </div>
        </div>

        {/* Action Cards - Glassmorphism with colored accents */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/helpers" className="h-full group">
            <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-blue to-purple rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-blue/20 group-hover:shadow-blue/30 transition-shadow">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foregroundPrimary dark:text-white mb-2">
                Manage Helpers
              </h3>
              <p className="text-foregroundSecondary dark:text-foregroundTertiary text-sm leading-relaxed">
                View and manage crew members and volunteers
              </p>
            </div>
          </Link>

          <Link href="/admin/events" className="h-full group">
            <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-purple to-red rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-purple/20 group-hover:shadow-purple/30 transition-shadow">
                <CalendarDays className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foregroundPrimary dark:text-white mb-2">
                Events
              </h3>
              <p className="text-foregroundSecondary dark:text-foregroundTertiary text-sm leading-relaxed">
                Manage events, crew, schedules and requests
              </p>
            </div>
          </Link>

          <Link href="/shift-requests" className="h-full group">
            <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-orange to-red rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-orange/20 group-hover:shadow-orange/30 transition-shadow">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foregroundPrimary dark:text-white mb-2">
                Shift Requests
              </h3>
              <p className="text-foregroundSecondary dark:text-foregroundTertiary text-sm leading-relaxed">
                Monitor and manage requests across all events
              </p>
            </div>
          </Link>

          <Link href="/reports" className="h-full group">
            <div className="backdrop-blur-xl bg-background/70 dark:bg-backgroundTertiary/70 rounded-2xl p-8 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-green to-green rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-green/20 group-hover:shadow-green/30 transition-shadow">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foregroundPrimary dark:text-white mb-2">
                Hours Report
              </h3>
              <p className="text-foregroundSecondary dark:text-foregroundTertiary text-sm leading-relaxed">
                View working hours per helper
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
