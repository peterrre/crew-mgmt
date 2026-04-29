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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                Event Crew Manager
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
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
          <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
            Welcome{session?.user?.name ? `, ${session.user.name}` : ''}!
          </h2>
          <p className="text-muted-foreground">
            Manage your event crew and schedules
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card/70 backdrop-blur rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              {loading ? '...' : stats.crewCount}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Crew Members</p>
          </div>

          <div className="bg-card/70 backdrop-blur rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              {loading ? '...' : stats.volunteerCount}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Volunteers</p>
          </div>

          <div className="bg-card/70 backdrop-blur rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              {loading ? '...' : stats.totalHelpers}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Total Helpers</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/helpers" className="h-full group">
            <div className="bg-card/70 backdrop-blur rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:shadow transition-shadow">
                <Users className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Manage Helpers
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                View and manage crew members and volunteers
              </p>
            </div>
          </Link>

          <Link href="/admin/events" className="h-full group">
            <div className="bg-card/70 backdrop-blur rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:shadow transition-shadow">
                <CalendarDays className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Events
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Manage events, crew, schedules and requests
              </p>
            </div>
          </Link>

          <Link href="/shift-requests" className="h-full group">
            <div className="bg-card/70 backdrop-blur rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:shadow transition-shadow">
                <ClipboardList className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Shift Requests
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Monitor and manage requests across all events
              </p>
            </div>
          </Link>

          <Link href="/reports" className="h-full group">
            <div className="bg-card/70 backdrop-blur rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:shadow transition-shadow">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Hours Report
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                View working hours per helper
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
