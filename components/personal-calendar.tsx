'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const BigCalendar = dynamic(() => import('@/components/big-calendar'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  helper?: {
    name: string | null;
    role: string;
  } | null;
}

export default function PersonalCalendar() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/shifts');
      if (response.ok) {
        const data = await response.json();
        const shiftsData = (data?.shifts || []).map((shift: any) => ({
          ...shift,
          start: new Date(shift.start),
          end: new Date(shift.end),
        }));
        setShifts(shiftsData);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No shifts assigned yet</p>
        </div>
      ) : (
        <BigCalendar
          events={shifts}
          selectable={false}
          onSelectEvent={(event) => {
            alert(
              `${event?.title || 'Shift'}\nStart: ${event?.start?.toLocaleString()}\nEnd: ${event?.end?.toLocaleString()}`
            );
          }}
        />
      )}
    </div>
  );
}
