'use client';

import { useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
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
}

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
    if (event?.helper?.role === 'CREW') return 'bg-sky-500';
    if (event?.helper?.role === 'VOLUNTEER') return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No events in this range.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-h-[600px] overflow-y-auto">
      {Object.entries(groupedByDate).map(([dateKey, dayEvents]) => (
        <div key={dateKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-sky-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-sky-900">
              {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {dayEvents.map((event, idx) => (
              <div
                key={event.id || idx}
                onClick={() => onSelectEvent?.(event)}
                className="flex items-center gap-4 px-4 py-3 hover:bg-amber-50 cursor-pointer transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${getRoleColor(event)}`} />
                <div className="w-32 text-sm text-gray-600 font-medium">
                  {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{event.title}</span>
                  <span className="text-gray-500 ml-2">
                    — {event?.helper?.name || 'Unassigned'}
                  </span>
                </div>
              </div>
            ))}
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
}: BigCalendarProps) {
  const [date, setDate] = useState(new Date(2026, 6, 10));
  const [view, setView] = useState<View>('week');

  const onNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const onView = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6';
    let opacity = 0.9;

    if (event.isAvailability) {
      // Availability slots - lighter, striped pattern
      backgroundColor = '#10b981'; // green for availability
      opacity = 0.6;
    } else {
      const role = event?.helper?.role;
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

  if (view === 'agenda') {
    return (
      <div>
        <div className="flex items-center gap-6 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <span className="text-sm font-medium text-sky-900">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sky-500"></div>
            <span className="text-sm text-sky-800">Crew</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500"></div>
            <span className="text-sm text-sky-800">Volunteer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-sky-800">Unassigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500 opacity-60 border-2 border-dashed border-green-800"></div>
            <span className="text-sm text-sky-800">Available</span>
          </div>
        </div>
        <div className="rbc-toolbar" style={{ padding: '16px 0', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div className="rbc-btn-group">
            <button type="button" onClick={() => setDate(new Date())}>Today</button>
            <button type="button" onClick={() => setDate(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000))}>Back</button>
            <button type="button" onClick={() => setDate(new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000))}>Next</button>
          </div>
          <span className="rbc-toolbar-label font-semibold">
            {format(date, 'MMMM yyyy')}
          </span>
          <div className="rbc-btn-group">
            <button type="button" onClick={() => setView('month')}>Month</button>
            <button type="button" onClick={() => setView('week')}>Week</button>
            <button type="button" onClick={() => setView('day')}>Day</button>
            <button type="button" className="rbc-active" onClick={() => setView('agenda')}>Agenda</button>
          </div>
        </div>
        <CustomAgenda events={events} onSelectEvent={onSelectEvent} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-6 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
        <span className="text-sm font-medium text-sky-900">Legend:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sky-500"></div>
          <span className="text-sm text-sky-800">Crew</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500"></div>
          <span className="text-sm text-sky-800">Volunteer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm text-sky-800">Unassigned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500 opacity-60 border-2 border-dashed border-green-800"></div>
          <span className="text-sm text-sky-800">Available</span>
        </div>
      </div>
      <div style={{ height: '700px' }}>
        <CalendarComponent
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          formats={formats}
          titleAccessor={(event: any) => {
            const helperName = event?.helper?.name || 'Unassigned';
            return `${event?.title || 'Untitled'} - ${helperName}`;
          }}
          onSelectSlot={selectable ? onSelectSlot : undefined}
          onSelectEvent={onSelectEvent}
          selectable={selectable}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          min={new Date(1970, 0, 1, 0, 0, 0)}
          max={new Date(1970, 0, 1, 23, 59, 59)}
          onView={onView}
          date={date}
          onNavigate={onNavigate}
          step={60}
          showMultiDayTimes
          dayLayoutAlgorithm="no-overlap"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
