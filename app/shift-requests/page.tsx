'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, LogOut, ArrowLeft, Clock, CheckCircle, XCircle, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { themeConfig } from '@/lib/theme-config';
import { toastLoadError } from '@/lib/toast-helpers';

interface EventWithRequests {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  _count: {
    shiftRequests: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'CANCEL' | 'SWAP' | 'MODIFY';
  status: 'APPROVED' | 'REJECTED';
  reviewedAt: string;
  shift: {
    title: string;
    event: {
      id: string;
      name: string;
    };
  };
  requester: {
    name: string | null;
    email: string;
  };
  reviewer: {
    name: string | null;
  } | null;
}

interface DashboardData {
  stats: {
    pending: number;
    today: number;
    week: number;
  };
  eventsWithRequests: EventWithRequests[];
  recentActivity: RecentActivity[];
}

export default function ShiftRequestsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/shift-requests/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        toastLoadError('dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toastLoadError('dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CANCEL':
        return '🚫';
      case 'SWAP':
        return '🔄';
      case 'MODIFY':
        return '✏️';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'APPROVED'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient} flex items-center justify-center`}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-slate-400">Failed to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-amber-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-amber-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="dark:text-slate-300 dark:hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className={`w-10 h-10 ${themeConfig.backgrounds.logo} rounded-xl flex items-center justify-center`}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-sky-900 dark:text-white">Shift Requests Dashboard</h1>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-sky-900 dark:text-white mb-2">Request Overview</h2>
          <p className="text-sky-700 dark:text-slate-400">
            Monitor and manage shift requests across all events
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Pending</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                    {data.stats.pending}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Today</p>
                  <p className="text-3xl font-bold text-sky-600 dark:text-sky-400 mt-2">
                    {data.stats.today}
                  </p>
                </div>
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">This Week</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {data.stats.week}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events with Pending Requests */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Events with Pending Requests</CardTitle>
            <CardDescription>
              Click on an event to view and manage its shift requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.eventsWithRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-gray-600 dark:text-slate-400 text-center">
                  All caught up! No pending requests at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.eventsWithRequests.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}?tab=requests`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-slate-800 rounded-lg border border-amber-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-slate-600 transition-colors group">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                          <h3 className="font-semibold text-sky-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300">
                            {event.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
                          <span>
                            {formatDate(event.startDate)} - {formatDate(event.endDate)}
                          </span>
                          {event.location && <span>• {event.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-amber-500 text-white text-sm font-medium rounded-full">
                            {event._count.shiftRequests} pending
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Last 10 processed requests across all events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-slate-400">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="text-2xl mt-1">{getTypeIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-slate-500">•</span>
                        <span className="text-sm text-gray-600 dark:text-slate-400">
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mb-1">
                        <span className="font-medium">{activity.shift.title}</span> -{' '}
                        <Link
                          href={`/admin/events/${activity.shift.event.id}`}
                          className="text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          {activity.shift.event.name}
                        </Link>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500">
                        Requested by {activity.requester.name || activity.requester.email} •{' '}
                        {activity.status.toLowerCase()} by{' '}
                        {activity.reviewer?.name || 'Admin'} •{' '}
                        {formatDateTime(activity.reviewedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
