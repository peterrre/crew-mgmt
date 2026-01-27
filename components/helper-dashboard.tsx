'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, LogOut, Edit, User, ClipboardList, CalendarDays, MapPin, Search, FileText, Menu, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import PersonalCalendar from '@/components/personal-calendar';
import EditAvailability from '@/components/edit-availability';
import { ThemeToggle } from '@/components/theme-toggle';
import AvailableEvents from '@/components/available-events';
import MyApplications from '@/components/my-applications';
import { themeConfig } from '@/lib/theme-config';
import { AreaChart } from '@/components/charts/area-chart';
import { StatsSkeleton } from '@/components/ui/skeleton-loaders';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ShiftRequest {
  id: string;
  type: 'SWAP' | 'CANCEL' | 'MODIFY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  createdAt: string;
  reviewedAt?: string;
  shift: {
    title: string;
    start: string;
    end: string;
  };
}

interface MyEvent {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  totalShiftsCount: number;
  myShiftsCount: number;
}

interface HelperDashboardStats {
  totalShifts: number;
  upcomingShifts: number;
  shiftsThisMonth: number;
  hoursThisMonth: number;
  applicationStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  } | null;
  shiftsActivity: Array<{ month: string; shifts: number }>;
}

export default function HelperDashboard() {
  const { data: session } = useSession() || {};
  const [showEditAvailability, setShowEditAvailability] = useState(false);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<HelperDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const userRole = (session?.user as any)?.role;
  const isVolunteer = userRole === 'VOLUNTEER';

  useEffect(() => {
    fetchMyEvents();
    fetchDashboardStats();
    if (isVolunteer) {
      fetchRequests();
      // Refresh requests every 30 seconds to show updates
      const interval = setInterval(fetchRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [isVolunteer]);

  const fetchMyEvents = async () => {
    try {
      setEventsLoading(true);
      const response = await fetch('/api/my-events');
      if (response.ok) {
        const data = await response.json();
        setMyEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching my events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/helper/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/shift-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
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
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {session?.user?.name || 'User'}
                </h1>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link href="/profile" className="hidden md:block">
                <Button
                  variant="outline"
                  size="sm"
                >
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              {isVolunteer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditAvailability(true)}
                  className="hidden md:flex"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Availability
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:flex"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      Access your profile and settings
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Edit Profile</span>
                    </Link>
                    {isVolunteer && (
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setShowEditAvailability(true);
                        }}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors w-full text-left"
                      >
                        <Edit className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Edit Availability</span>
                      </button>
                    )}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Personal Stats Section */}
        {statsLoading ? (
          <div className="mb-8">
            <StatsSkeleton cards={4} />
          </div>
        ) : dashboardStats && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">My Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Upcoming Shifts
                    </CardTitle>
                    <Calendar className="w-4 h-4 text-sky-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.upcomingShifts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboardStats.totalShifts} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      This Month
                    </CardTitle>
                    <CalendarDays className="w-4 h-4 text-amber-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.shiftsThisMonth}</div>
                  <p className="text-xs text-muted-foreground mt-1">shifts scheduled</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Hours This Month
                    </CardTitle>
                    <Clock className="w-4 h-4 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.hoursThisMonth}</div>
                  <p className="text-xs text-muted-foreground mt-1">hours worked</p>
                </CardContent>
              </Card>

              {isVolunteer && dashboardStats.applicationStats && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Applications
                      </CardTitle>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.applicationStats.approved}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dashboardStats.applicationStats.pending} pending
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Activity Chart */}
            {dashboardStats.shiftsActivity.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Activity Trend</CardTitle>
                  <CardDescription>Your shifts over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <AreaChart
                    data={dashboardStats.shiftsActivity}
                    dataKey="shifts"
                    xAxisKey="month"
                    color="#10b981"
                    gradientId="colorHelperActivity"
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link href="/profile">
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              {isVolunteer && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowEditAvailability(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Availability
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="#available-events">
                      <Search className="w-4 h-4 mr-2" />
                      Browse Events
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <a href="#my-applications">
                      <FileText className="w-4 h-4 mr-2" />
                      My Applications
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">My Schedule</h2>
          <p className="text-muted-foreground">View your assigned shifts</p>
        </div>

        <PersonalCalendar />

        {/* Available Events Section - For volunteers to apply */}
        {isVolunteer && (
          <div className="mt-8" id="available-events">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Available Events
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse events accepting volunteers and submit your application
            </p>
            <AvailableEvents />
          </div>
        )}

        {/* My Events Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            My Events
          </h3>
          {eventsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading events...</p>
              </CardContent>
            </Card>
          ) : myEvents.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">You are not assigned to any events yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {event.location && (
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-500 dark:text-slate-500 mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sky-600 border-sky-600">
                        {event.myShiftsCount} of {event.totalShiftsCount} shifts
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* My Applications Section - For volunteers to track their event applications */}
        {isVolunteer && (
          <div className="mt-8" id="my-applications">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              My Applications
            </h3>
            <MyApplications />
          </div>
        )}

        {isVolunteer && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              My Shift Requests
            </h3>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
              </TabsList>
              <TabsContent value="pending">
                {requests.filter(r => r.status === 'PENDING').length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No pending shift requests</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {requests.filter(r => r.status === 'PENDING').map((request) => (
                      <Card key={request.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{request.shift.title}</CardTitle>
                              <CardDescription>
                                {new Date(request.shift.start).toLocaleString()} - {new Date(request.shift.end).toLocaleString()}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={`${
                                request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status}
                              </Badge>
                              <Badge className={`${
                                request.type === 'CANCEL' ? 'bg-red-100 text-red-800' :
                                request.type === 'SWAP' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {request.type}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">
                            Requested: {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="approved">
                {requests.filter(r => r.status === 'APPROVED').length === 0 ? (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">No approved shift requests</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {requests.filter(r => r.status === 'APPROVED').map((request) => (
                      <Card key={request.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{request.shift.title}</CardTitle>
                              <CardDescription>
                                {new Date(request.shift.start).toLocaleString()} - {new Date(request.shift.end).toLocaleString()}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                {request.status}
                              </Badge>
                              <Badge className={`${
                                request.type === 'CANCEL' ? 'bg-red-100 text-red-800' :
                                request.type === 'SWAP' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {request.type}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-500">
                            Requested: {new Date(request.createdAt).toLocaleString()}
                            {request.reviewedAt && (
                              <> • Approved: {new Date(request.reviewedAt).toLocaleString()}</>
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {showEditAvailability && (
        <EditAvailability onClose={() => setShowEditAvailability(false)} />
      )}
    </div>
  );
}
