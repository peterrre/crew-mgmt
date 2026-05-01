'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import CreateShiftRequestDialog from '@/components/create-shift-request-dialog';

const BigCalendar = dynamic(() => import('@/components/big-calendar'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="inline-block w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  helper?: {
    id: string;
    name: string | null;
    role: string;
  } | null;
}

export default function PersonalCalendar() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

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
    <div className="bg-background rounded-2xl p-6 shadow-lg border border-border">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="inline-block w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-foregroundSecondary">No shifts assigned yet</p>
        </div>
      ) : (
        <BigCalendar
          events={shifts}
          selectable={false}
          onSelectEvent={(event) => {
            setSelectedShift(event);
          }}
        />
      )}

 <CreateShiftRequestDialog
 open={!!selectedShift}
 shift={selectedShift}
 onClose={() => setSelectedShift(null)}
 onSuccess={() => {
 setSelectedShift(null);
 fetchShifts();
 }}
 />
    </div>
  );
}
