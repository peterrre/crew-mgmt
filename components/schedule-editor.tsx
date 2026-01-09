'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Calendar, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import CreateShiftDialog from '@/components/create-shift-dialog';
import EditShiftDialog from '@/components/edit-shift-dialog';

const BigCalendar = dynamic(() => import('@/components/big-calendar'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  helperId: string | null;
  helper?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export default function ScheduleEditor() {
  const router = useRouter();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

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

  const handleSelectSlot = useCallback((slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setShowCreateDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event: Shift) => {
    setEditingShift(event);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-sky-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-amber-50/80 backdrop-blur-md border-b border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-sky-900">Schedule Editor</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-sky-700 hover:text-sky-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-sky-900 mb-2">Festival 2026 Schedule</h2>
          <p className="text-sky-700">July 10-12, 2026 - Click and drag to create shifts</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <BigCalendar
              events={shifts}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
            />
          )}
        </div>
      </main>

      {showCreateDialog && (
        <CreateShiftDialog
          selectedSlot={selectedSlot}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => {
            setShowCreateDialog(false);
            setSelectedSlot(null);
            fetchShifts();
          }}
        />
      )}

      {editingShift && (
        <EditShiftDialog
          shift={editingShift}
          onClose={() => setEditingShift(null)}
          onSuccess={() => {
            setEditingShift(null);
            fetchShifts();
          }}
        />
      )}
    </div>
  );
}
