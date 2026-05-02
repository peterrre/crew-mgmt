'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, LogOut, ArrowLeft, Clock, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/shift-requests/dashboard');
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
      ? 'text-green'
      : 'text-red';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background flex items-center justify-center">
        <Card className="bg-background rounded-2xl shadow-lg border border-border">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-foregroundSecondary">Failed to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-backgroundSecondary/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-foregroundSecondary hover:text-foregroundPrimary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-blue to-yellow rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foregroundPrimary">Shift Requests Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-blue hover:text-foregroundPrimary"
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
          <h2 className="text-2xl font-bold text-foregroundPrimary mb-2">Request Overview</h2>
          <p className="text-foregroundSecondary">
            Monitor and manage shift requests across all events
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-background rounded-2xl shadow-lg border border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foregroundSecondary">Pending</p>
                  <p className="text-3xl font-bold text-yellow mt-2">
                    {data.stats.pending}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow/10 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background rounded-2xl shadow-lg border border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foregroundSecondary">Today</p>
                  <p className="text-3xl font-bold text-blue mt-2">
                    {data.stats.today}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background rounded-2xl shadow-lg border border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foregroundSecondary">This Week</p>
                  <p className="text-3xl font-bold text-purple mt-2">
                    {data.stats.week}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events with Pending Requests */}
        <Card className="bg-background rounded-2xl shadow-lg border border-border mb-8">
          <CardHeader>
            <CardTitle className="text-foregroundPrimary">Events with Pending Requests</CardTitle>
            <CardDescription className="text-foregroundSecondary">
              Click on an event to view and manage its shift requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.eventsWithRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-green mb-4" />
                <p className="text-foregroundSecondary text-center">
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
                    <div className="flex items-center justify-between p-4 bg-backgroundSecondary rounded-2xl border border-border hover:border-yellow/40 transition-colors group">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-blue" />
                          <h3 className="font-semibold text-foregroundPrimary group-hover:text-blue transition-colors">
                            {event.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-foregroundSecondary">
                          <span>
                            {formatDate(event.startDate)} - {formatDate(event.endDate)}
                          </span>
                          {event.location && <span>• {event.location}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-yellow text-white text-sm font-medium rounded-full">
                            {event._count.shiftRequests} pending
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-foregroundTertiary group-hover:text-foregroundSecondary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-background rounded-2xl shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-foregroundPrimary">Recent Activity</CardTitle>
            <CardDescription className="text-foregroundSecondary">
              Last 10 processed requests across all events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-foregroundTertiary mb-4" />
                <p className="text-foregroundSecondary">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-4 bg-backgroundSecondary rounded-2xl border border-border"
                  >
                    <div className="text-2xl mt-1">{getTypeIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                        <span className="text-sm text-foregroundTertiary">•</span>
                        <span className="text-sm text-foregroundSecondary">
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-sm text-foregroundPrimary mb-1">
                        <span className="font-medium">{activity.shift.title}</span> -{' '}
                        <Link
                          href={`/admin/events/${activity.shift.event.id}`}
                          className="text-blue hover:underline"
                        >
                          {activity.shift.event.name}
                        </Link>
                      </p>
                      <p className="text-xs text-foregroundTertiary">
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
