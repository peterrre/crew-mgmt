'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import CreateShiftRequestDialog from '@/components/create-shift-request-dialog';
import { ShiftDetailSheet } from '@/components/shift-detail-sheet';

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
    id: string;
    name: string | null;
    role: string;
  } | null;
}

export default function PersonalCalendar() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border dark:border-slate-700">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-slate-400">No shifts assigned yet</p>
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

      <ShiftDetailSheet
        shift={selectedShift}
        open={!!selectedShift && !showRequestDialog}
        onClose={() => setSelectedShift(null)}
        onRequestChange={(shift) => {
          setShowRequestDialog(true);
        }}
      />

      {showRequestDialog && selectedShift && (
        <CreateShiftRequestDialog
          shift={selectedShift}
          onClose={() => {
            setShowRequestDialog(false);
            setSelectedShift(null);
          }}
          onSuccess={() => {
            setShowRequestDialog(false);
            setSelectedShift(null);
            fetchShifts();
          }}
        />
      )}
    </div>
  );
}
