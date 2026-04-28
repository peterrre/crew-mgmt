'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, Info, FileText, UserPlus } from 'lucide-react';
import EventCrewManagement from '@/components/event-crew-management';
import EventScheduleEditor from '@/components/event-schedule-editor';
import EventRequestsManager from '@/components/event-requests-manager';
import EventApplicationsManager from '@/components/event-applications-manager';
import { useEventData } from '@/contexts/event-data-context';

interface EventDetailTabsProps {
  event: {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    location: string | null;
    contactPerson: {
      id: string;
      name: string | null;
    } | null;
  };
}

export default function EventDetailTabs({ event }: EventDetailTabsProps) {
  const { crewCount, shiftsCount, pendingRequestsCount, pendingApplicationsCount, acceptingVolunteers } = useEventData();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  // Set initial tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'crew', 'schedule', 'requests', 'applications'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-6">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="crew" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Crew ({crewCount})
        </TabsTrigger>
        <TabsTrigger value="schedule" className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Schedule ({shiftsCount})
        </TabsTrigger>
        <TabsTrigger value="applications" className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Applications
          {pendingApplicationsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
              {pendingApplicationsCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="requests" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Requests
          {pendingRequestsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded-full">
              {pendingRequestsCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Description</h4>
                <p className="mt-1">{event.description}</p>
              </div>
            )}
            {event.location && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Location</h4>
                <p className="mt-1">{event.location}</p>
              </div>
            )}
            {event.contactPerson && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Contact Person</h4>
                <p className="mt-1">{event.contactPerson.name}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{crewCount}</div>
                <div className="text-sm text-muted-foreground">Crew Members</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{shiftsCount}</div>
                <div className="text-sm text-muted-foreground">Shifts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="crew">
        <Card>
          <CardContent className="pt-6">
            <EventCrewManagement eventId={event.id} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="schedule">
        <Card>
          <CardContent className="pt-6">
            <EventScheduleEditor
              eventId={event.id}
              eventStartDate={new Date(event.startDate)}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="applications">
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <EventApplicationsManager eventId={event.id} acceptingVolunteers={acceptingVolunteers} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="requests">
        <Card>
          <CardHeader>
            <CardTitle>Shift Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <EventRequestsManager eventId={event.id} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
