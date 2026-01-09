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

interface BigCalendarProps {
  events: any[];
  onSelectSlot?: (slotInfo: any) => void;
  onSelectEvent?: (event: any) => void;
  selectable?: boolean;
}

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
    const role = event?.helper?.role;
    let backgroundColor = '#3b82f6';

    if (role === 'CREW') {
      backgroundColor = '#0ea5e9';
    } else if (role === 'VOLUNTEER') {
      backgroundColor = '#f59e0b';
    } else {
      backgroundColor = '#ef4444';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '13px',
        padding: '4px 8px',
      },
    };
  };

  const CalendarComponent = Calendar as any;

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
      </div>
      <div style={{ height: '700px' }}>
        <CalendarComponent
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
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
          onView={onView}
          date={date}
          onNavigate={onNavigate}
          step={60}
          showMultiDayTimes
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
