'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Calendar, Users, LogOut, TrendingUp, ClipboardList, CalendarDays, Menu } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { themeConfig } from '@/lib/theme-config';
import { StatsSkeleton } from '@/components/ui/skeleton-loaders';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DonutChart } from '@/components/charts/donut-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { AreaChart } from '@/components/charts/area-chart';
import { format } from 'date-fns';

interface Stats {
  crewCount: number;
  volunteerCount: number;
  totalHelpers: number;
}

interface Helper {
  role: 'ADMIN' | 'CREW' | 'VOLUNTEER';
}

interface DashboardStats {
  applications: Array<{ status: string; count: number }>;
  roles: Array<{ role: string; count: number }>;
  requests: Array<{ status: string; count: number }>;
  activity: Array<{ date: string; assignments: number }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    crewCount: number;
    shiftsCount: number;
  }>;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    crewCount: 0,
    volunteerCount: 0,
    totalHelpers: 0,
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchDashboardStats();
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

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${themeConfig.backgrounds.logo} rounded-xl flex items-center justify-center`}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground hidden sm:block">Event Crew Manager</h1>
              <h1 className="text-lg font-bold text-foreground sm:hidden">ECM</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden sm:flex"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="sm:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription>
                      Access key features and actions
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2">
                    <Link
                      href="/helpers"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Manage Helpers</span>
                    </Link>
                    <Link
                      href="/admin/events"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <CalendarDays className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Events</span>
                    </Link>
                    <Link
                      href="/shift-requests"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ClipboardList className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Shift Requests</span>
                    </Link>
                    <Link
                      href="/reports"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <TrendingUp className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Hours Report</span>
                    </Link>
                    <div className="border-t border-border my-4" />
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors w-full text-left"
                    >
                      <LogOut className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome{session?.user?.name ? `, ${session.user.name}` : ''}!
          </h2>
          <p className="text-muted-foreground">Manage your event crew and schedules</p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="mb-12">
            <StatsSkeleton cards={3} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.crewCount}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Crew Members</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.volunteerCount}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Volunteers</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.totalHelpers}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Total Helpers</p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {chartsLoading ? (
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatsSkeleton cards={2} />
            </div>
          </div>
        ) : dashboardStats && (
          <div className="mb-12 space-y-6">
            {/* Row 1: Application Status & Upcoming Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                  <CardDescription>Breakdown of volunteer applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardStats.applications.length > 0 ? (
                    <DonutChart
                      data={dashboardStats.applications.map((item) => ({
                        name: item.status,
                        value: item.count,
                        color:
                          item.status === 'PENDING'
                            ? '#f59e0b'
                            : item.status === 'APPROVED'
                            ? '#10b981'
                            : item.status === 'REJECTED'
                            ? '#ef4444'
                            : '#6b7280',
                      }))}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No application data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Events in the next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardStats.upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {dashboardStats.upcomingEvents.slice(0, 5).map((event) => (
                        <Link
                          key={event.id}
                          href={`/admin/events/${event.id}`}
                          className="block p-4 rounded-lg border border-border hover:border-primary transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">{event.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.startDate), 'MMM d')} -{' '}
                                {format(new Date(event.endDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {event.crewCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {event.shiftsCount}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No upcoming events
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Row 2: Request Status & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shift Requests</CardTitle>
                  <CardDescription>Status distribution of shift requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardStats.requests.length > 0 ? (
                    <BarChart
                      data={dashboardStats.requests.map((item) => ({
                        status: item.status,
                        count: item.count,
                      }))}
                      dataKey="count"
                      xAxisKey="status"
                      color="#3b82f6"
                      label="Requests"
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No request data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Shift assignments in the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardStats.activity.length > 0 ? (
                    <AreaChart
                      data={dashboardStats.activity.map((item) => ({
                        date: format(new Date(item.date), 'MMM d'),
                        assignments: item.assignments,
                      }))}
                      dataKey="assignments"
                      xAxisKey="date"
                      color="#8b5cf6"
                      gradientId="colorActivity"
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/helpers" className="h-full">
            <div className="bg-primary text-primary-foreground rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer h-full">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Manage Helpers</h3>
              <p className="text-white/90">
                View and manage crew members and volunteers
              </p>
            </div>
          </Link>

          <Link href="/admin/events" className="h-full">
            <div className="bg-secondary text-secondary-foreground rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer h-full">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <CalendarDays className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Events</h3>
              <p className="text-white/90">
                Manage events, crew, schedules and requests
              </p>
            </div>
          </Link>

          <Link href="/shift-requests" className="h-full">
            <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer h-full">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <ClipboardList className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Shift Requests</h3>
              <p className="text-white/90">
                Monitor and manage requests across all events
              </p>
            </div>
          </Link>

          <Link href="/reports" className="h-full">
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer h-full">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Hours Report</h3>
              <p className="text-white/90">
                View working hours per helper
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
