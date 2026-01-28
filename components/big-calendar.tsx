'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Columns3, CalendarRange, List } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const formats = {
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: string, localizer: any) =>
    `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: string, localizer: any) =>
    `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
};

interface BigCalendarProps {
  events: any[];
  onSelectSlot?: (slotInfo: any) => void;
  onSelectEvent?: (event: any) => void;
  selectable?: boolean;
  counts?: { crew: number; volunteer: number; unassigned: number; availability: number };
  date?: Date;
  onNavigate?: (date: Date) => void;
  view?: View;
  onView?: (view: View) => void;
}

// Helper to get display text for shift assignment
const getAssignmentDisplay = (event: any): string => {
  if (event.isAvailability) {
    return event?.helper?.name || 'Available';
  }

  // Use new assignments array if available
  if (event.assignments && event.assignments.length > 0) {
    const responsible = event.assignments.find((a: any) => a.role === 'RESPONSIBLE');
    const helperCount = event.assignments.filter((a: any) => a.role === 'HELPER').length;
    const responsibleName = responsible?.user?.name || 'Unknown';

    if (helperCount > 0) {
      return `${responsibleName} +${helperCount}`;
    }
    return responsibleName;
  }

  // Fall back to legacy helper field
  return event?.helper?.name || 'Unassigned';
};

// Helper to get event badge display
const getEventBadge = (event: any): string | null => {
  if (event.isAvailability) return null;
  return event?.event?.name || null;
};

const CustomAgenda = ({ events, onSelectEvent }: { events: any[]; onSelectEvent?: (event: any) => void }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const groupedByDate: { [key: string]: any[] } = {};
  sortedEvents.forEach((event) => {
    const dateKey = format(new Date(event.start), 'yyyy-MM-dd');
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(event);
  });

  const getRoleColor = (event: any) => {
    if (event.isAvailability) return 'bg-green-500 opacity-60 border-2 border-dashed border-green-800';
    // Check assignments first
    if (event.assignments && event.assignments.length > 0) {
      const responsible = event.assignments.find((a: any) => a.role === 'RESPONSIBLE');
      if (responsible?.user?.role === 'CREW') return 'bg-sky-500';
      if (responsible?.user?.role === 'VOLUNTEER') return 'bg-amber-500';
    }
    // Fall back to legacy helper
    if (event?.helper?.role === 'CREW') return 'bg-sky-500';
    if (event?.helper?.role === 'VOLUNTEER') return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-slate-400">
        No events in this range.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 md:p-4 max-h-[600px] overflow-y-auto">
      {Object.entries(groupedByDate).map(([dateKey, dayEvents]) => (
        <div key={dateKey} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden shadow-sm">
          <div className="bg-sky-50 dark:bg-slate-700 px-3 md:px-4 py-3 border-b border-gray-200 dark:border-slate-600">
            <h3 className="font-semibold text-sm md:text-base text-sky-900 dark:text-white">
              {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-600">
            {dayEvents.map((event, idx) => {
              const eventBadge = getEventBadge(event);
              return (
                <div
                  key={event.id || idx}
                  onClick={() => onSelectEvent?.(event)}
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-3 md:px-4 py-4 min-h-[56px] hover:bg-amber-50 dark:hover:bg-slate-600 cursor-pointer transition-colors active:bg-amber-100 dark:active:bg-slate-500"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={`w-3 h-3 md:w-3 md:h-3 rounded-full flex-shrink-0 ${getRoleColor(event)}`} />
                    <div className="min-w-[110px] text-sm text-gray-600 dark:text-slate-300 font-medium">
                      {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1 md:gap-2 ml-6 md:ml-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {eventBadge && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {eventBadge}
                        </span>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{event.title}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-slate-400">
                      {getAssignmentDisplay(event)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function BigCalendar({
  events,
  onSelectSlot,
  onSelectEvent,
  selectable = true,
  counts,
  date: propDate,
  onNavigate: propOnNavigate,
  view: propView,
  onView: propOnView,
}: BigCalendarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [localDate, setLocalDate] = useState(propDate || new Date(2026, 6, 10));
  const [localView, setLocalView] = useState<View>(propView || 'week');
  const currentDate = propDate !== undefined ? propDate : localDate;
  const currentView = propView !== undefined ? propView : localView;
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && propView === undefined && localView !== 'agenda' && localView !== 'day') {
      setLocalView('agenda');
    }
  }, [isMobile, propView, localView]);

  const handleNavigate = useCallback((newDate: Date) => {
    if (propOnNavigate) {
      propOnNavigate(newDate);
    } else {
      setLocalDate(newDate);
    }
  }, [propOnNavigate]);

  const handleView = useCallback((newView: View) => {
    if (propOnView) {
      propOnView(newView);
    } else {
      setLocalView(newView);
    }
  }, [propOnView]);

  const handleSwipe = useCallback(() => {
    const minSwipeDistance = 50;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      let newDate: Date;

      if (currentView === 'day') {
        newDate = addDays(currentDate, isLeftSwipe ? 1 : -1);
      } else if (currentView === 'week' || currentView === 'agenda') {
        newDate = addWeeks(currentDate, isLeftSwipe ? 1 : -1);
      } else {
        return;
      }

      handleNavigate(newDate);
    }
  }, [currentView, currentDate, handleNavigate]);

  useEffect(() => {
    if (!isMobile || !calendarRef.current) return;

    const element = calendarRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      handleSwipe();
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleSwipe]);

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6';
    let opacity = 0.9;

    if (event.isAvailability) {
      // Availability slots - lighter, striped pattern
      backgroundColor = '#10b981'; // green for availability
      opacity = 0.6;
    } else {
      // Check assignments first for role
      let role = null;
      if (event.assignments && event.assignments.length > 0) {
        const responsible = event.assignments.find((a: any) => a.role === 'RESPONSIBLE');
        role = responsible?.user?.role;
      }
      // Fall back to legacy helper
      if (!role) {
        role = event?.helper?.role;
      }

      if (role === 'CREW') {
        backgroundColor = '#0ea5e9';
      } else if (role === 'VOLUNTEER') {
        backgroundColor = '#f59e0b';
      } else {
        backgroundColor = '#ef4444';
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity,
        color: 'white',
        border: event.isAvailability ? '2px dashed #065f46' : '0px',
        display: 'block',
        fontSize: '13px',
        padding: '4px 8px',
      },
    };
  };

  const CalendarComponent = Calendar as any;

  if (currentView === 'agenda') {
    return (
      <div ref={calendarRef}>
        <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-4 p-3 bg-amber-50 dark:bg-slate-700 rounded-lg border border-amber-100 dark:border-slate-600">
          <span className="text-sm font-medium text-sky-900 dark:text-white">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sky-500"></div>
            <span className="text-xs md:text-sm text-sky-800 dark:text-slate-200">Crew ({counts?.crew || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span className="text-xs md:text-sm text-sky-800 dark:text-slate-200">Volunteer ({counts?.volunteer || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-xs md:text-sm text-sky-800 dark:text-slate-200">Unassigned ({counts?.unassigned || 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 opacity-60 border-2 border-dashed border-green-800"></div>
            <span className="text-xs md:text-sm text-sky-800 dark:text-slate-200">Available ({counts?.availability || 0})</span>
          </div>
        </div>
        <div className="rbc-toolbar" style={{ padding: '16px 0', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div className="rbc-btn-group flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavigate(new Date())}
              className="min-h-[44px] md:min-h-auto px-3"
              title="Go to today"
            >
              {isMobile ? <CalendarDays className="w-5 h-5" /> : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
              className="min-h-[44px] min-w-[44px] md:min-h-auto flex items-center justify-center"
              title="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
              className="min-h-[44px] min-w-[44px] md:min-h-auto flex items-center justify-center"
              title="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <span className="rbc-toolbar-label font-semibold text-sm md:text-base">
            {format(currentDate, isMobile ? 'MMM yyyy' : 'MMMM yyyy')}
          </span>
          <div className="rbc-btn-group flex items-center gap-2">
            {!isMobile && <button type="button" onClick={() => handleView('month')}>Month</button>}
            {!isMobile && <button type="button" onClick={() => handleView('week')}>Week</button>}
            <button
              type="button"
              onClick={() => handleView('day')}
              className="min-h-[44px] md:min-h-auto px-3 flex items-center gap-2"
              title="Day view"
            >
              {isMobile ? <CalendarRange className="w-5 h-5" /> : 'Day'}
            </button>
            <button
              type="button"
              className="rbc-active min-h-[44px] md:min-h-auto px-3 flex items-center gap-2"
              onClick={() => handleView('agenda')}
              title="Agenda view"
            >
              {isMobile ? <List className="w-5 h-5" /> : 'Agenda'}
            </button>
          </div>
        </div>
        <CustomAgenda events={events} onSelectEvent={onSelectEvent} />
      </div>
    );
  }

  return (
    <div ref={calendarRef}>
      <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-4 p-3 bg-amber-50 dark:bg-slate-700 rounded-lg border border-amber-100 dark:border-slate-600">
        <span className="text-sm font-medium text-sky-900 dark:text-white">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sky-500"></div>
          <span className="text-xs md:text-sm text-sky-800 dark:text-slate-200">Crew ({counts?.crew || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-xs md:text-sm text-sky-800 dark:text-slate-200">Volunteer ({counts?.volunteer || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-xs md:text-sm text-sky-800 dark:text-slate-200">Unassigned ({counts?.unassigned || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500 opacity-60 border-2 border-dashed border-green-800"></div>
          <span className="text-xs md:text-sm text-sky-800 dark:text-slate-200">Available ({counts?.availability || 0})</span>
        </div>
      </div>
      <div style={{ height: isMobile ? '500px' : '700px' }}>
        <CalendarComponent
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          formats={formats}
          titleAccessor={(event: any) => {
            const assignmentDisplay = getAssignmentDisplay(event);
            return `${event?.title || 'Untitled'} - ${assignmentDisplay}`;
          }}
          onSelectSlot={selectable ? onSelectSlot : undefined}
          onSelectEvent={onSelectEvent}
          selectable={selectable}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          view={currentView}
          min={new Date(1970, 0, 1, 0, 0, 0)}
          max={new Date(1970, 0, 1, 23, 59, 59)}
          onView={handleView}
          date={currentDate}
          onNavigate={handleNavigate}
          step={60}
          showMultiDayTimes
          dayLayoutAlgorithm="no-overlap"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
