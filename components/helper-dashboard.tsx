'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, LogOut, Edit, User, ClipboardList, CalendarDays, MapPin, Search, FileText } from 'lucide-react';
import PersonalCalendar from '@/components/personal-calendar';
import EditAvailability from '@/components/edit-availability';
import { ThemeToggle } from '@/components/theme-toggle';
import AvailableEvents from '@/components/available-events';
import MyApplications from '@/components/my-applications';

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

export default function HelperDashboard() {
  const { data: session } = useSession() || {};
  const [showEditAvailability, setShowEditAvailability] = useState(false);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const userRole = (session?.user as any)?.role;
  const isVolunteer = userRole === 'VOLUNTEER';

  useEffect(() => {
    fetchMyEvents();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {session?.user?.name || 'User'}
                </h1>
                <p className="text-xs text-gray-600 dark:text-slate-400">{userRole}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link href="/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sky-600 border-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-400 dark:hover:bg-slate-800"
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
                  className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-slate-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Availability
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white"
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Schedule</h2>
          <p className="text-gray-600 dark:text-slate-400">View your assigned shifts</p>
        </div>

        <PersonalCalendar />

        {/* Available Events Section - For volunteers to apply */}
        {isVolunteer && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Available Events
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              Browse events accepting volunteers and submit your application
            </p>
            <AvailableEvents />
          </div>
        )}

        {/* My Events Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            My Events
          </h3>
          {eventsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-600 dark:text-slate-400">Loading events...</p>
              </CardContent>
            </Card>
          ) : myEvents.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-gray-600 dark:text-slate-400">You are not assigned to any events yet</p>
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
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              My Applications
            </h3>
            <MyApplications />
          </div>
        )}

        {isVolunteer && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
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
                      <p className="text-gray-600 dark:text-slate-400">No pending shift requests</p>
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
                      <p className="text-gray-600 dark:text-slate-400">No approved shift requests</p>
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
