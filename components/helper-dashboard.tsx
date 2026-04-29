'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  LogOut,
  Edit,
  User,
  ClipboardList,
  CalendarDays,
  MapPin,
  Search,
  FileText,
} from 'lucide-react';
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
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isVolunteer = userRole === 'VOLUNTEER';

  useEffect(() => {
    fetchMyEvents();
    if (isVolunteer) {
      fetchRequests();
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
        setMyEvents((data.events as MyEvent[]) || []);
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
        setRequests((data.requests as ShiftRequest[]) || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0D0D0F] relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/15 dark:bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-400/15 dark:bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-green-400/10 dark:bg-green-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Apple-Style Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/60 dark:bg-white/5 border-b border-[#E5E5EA]/60 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
                  {session?.user?.name || 'User'}
                </h1>
                <p className="text-[11px] text-[#6E6E73] dark:text-[#AEAEB2]">
                  {userRole || 'Crew'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link href="/profile">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
              {isVolunteer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditAvailability(true)}
                  className="border-[#E5E5EA] dark:border-white/10 text-[#1D1D1F] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Availability
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-[#6E6E73] hover:text-[#1D1D1F] dark:text-[#AEAEB2] dark:hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <h2 className="text-[32px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white leading-tight">
            My Schedule
          </h2>
          <p className="text-[15px] text-[#6E6E73] dark:text-[#AEAEB2] mt-1">
            View your assigned shifts and upcoming events
          </p>
        </div>

        <PersonalCalendar />

        {/* Available Events - For volunteers */}
        {isVolunteer && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-white mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-[#007AFF]" />
              Available Events
            </h3>
            <p className="text-[13px] text-[#6E6E73] dark:text-[#AEAEB2] mb-4">
              Browse events accepting volunteers and submit your application
            </p>
            <AvailableEvents />
          </div>
        )}

        {/* My Events */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-white mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-[#34C759]" />
            My Events
          </h3>
          {eventsLoading ? (
            <Card className="backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-3xl">
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-[#6E6E73] dark:text-[#AEAEB2]">Loading events...</p>
              </CardContent>
            </Card>
          ) : myEvents.length === 0 ? (
            <Card className="backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-3xl">
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-[#6E6E73] dark:text-[#AEAEB2]">
                  You are not assigned to any events yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myEvents.map((event) => (
                <Card
                  key={event.id}
                  className="backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-3xl hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-[#1D1D1F] dark:text-white">
                      {event.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-[#6E6E73] dark:text-[#AEAEB2]">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.startDate).toLocaleDateString()} -{' '}
                      {new Date(event.endDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {event.location && (
                      <p className="text-sm text-[#6E6E73] dark:text-[#AEAEB2] mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-sm text-[#AEAEB2] dark:text-[#6E6E73] mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-[#007AFF] border-[#007AFF]/30 bg-[#007AFF]/5"
                      >
                        {event.myShiftsCount} of {event.totalShiftsCount} shifts
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* My Applications */}
        {isVolunteer && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-[#AF52DE]" />
              My Applications
            </h3>
            <MyApplications />
          </div>
        )}

        {/* My Shift Requests */}
        {isVolunteer && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-white mb-4 flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-[#FF9500]" />
              My Shift Requests
            </h3>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/60 dark:bg-white/5 border border-[#E5E5EA] dark:border-white/10 rounded-xl">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-white rounded-lg transition-all"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-white rounded-lg transition-all"
                >
                  Approved
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending">
                {requests.filter((r) => r.status === 'PENDING').length === 0 ? (
                  <Card className="backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-3xl mt-4">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-[#6E6E73] dark:text-[#AEAEB2]">
                        No pending shift requests
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4 mt-4">
                    {requests
                      .filter((r) => r.status === 'PENDING')
                      .map((request) => (
                        <RequestCard key={request.id} request={request} />
                      ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="approved">
                {requests.filter((r) => r.status === 'APPROVED').length === 0 ? (
                  <Card className="backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-3xl mt-4">
                    <CardContent className="flex items-center justify-center py-8">
                      <p className="text-[#6E6E73] dark:text-[#AEAEB2]">
                        No approved shift requests
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4 mt-4">
                    {requests
                      .filter((r) => r.status === 'APPROVED')
                      .map((request) => (
                        <RequestCard key={request.id} request={request} />
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

// Extracted sub-component to reduce nesting and improve readability
function RequestCard({ request }: { request: ShiftRequest }) {
  return (
    <Card className="backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-3xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-[#1D1D1F] dark:text-white">
              {request.shift.title}
            </CardTitle>
            <CardDescription className="text-[#6E6E73] dark:text-[#AEAEB2]">
              {new Date(request.shift.start).toLocaleString()} -{' '}
              {new Date(request.shift.end).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/20">
              {request.status}
            </Badge>
            <Badge
              className={`
              ${
                request.type === 'CANCEL'
                  ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                  : request.type === 'SWAP'
                    ? 'bg-[#007AFF]/10 text-[#007AFF]'
                    : 'bg-[#AF52DE]/10 text-[#AF52DE]'
              }
            `}
            >
              {request.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[#6E6E73] dark:text-[#AEAEB2] mb-2">
          <strong>Reason:</strong> {request.reason}
        </p>
        <p className="text-xs text-[#AEAEB2] dark:text-[#6E6E73]">
          Requested: {new Date(request.createdAt).toLocaleString()}
          {request.reviewedAt && (
            <>
              {' '}
              • Approved: {new Date(request.reviewedAt).toLocaleString()}
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
