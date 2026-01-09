'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Calendar, LogOut, Edit } from 'lucide-react';
import PersonalCalendar from '@/components/personal-calendar';
import EditAvailability from '@/components/edit-availability';

export default function HelperDashboard() {
  const { data: session } = useSession() || {};
  const [showEditAvailability, setShowEditAvailability] = useState(false);
  const userRole = (session?.user as any)?.role;
  const isVolunteer = userRole === 'VOLUNTEER';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {session?.user?.name || 'User'}
                </h1>
                <p className="text-xs text-gray-600">{userRole}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isVolunteer && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditAvailability(true)}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Availability
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Schedule</h2>
          <p className="text-gray-600">View your assigned shifts</p>
        </div>

        <PersonalCalendar />
      </main>

      {showEditAvailability && (
        <EditAvailability onClose={() => setShowEditAvailability(false)} />
      )}
    </div>
  );
}
