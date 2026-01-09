'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Calendar, Users, CalendarClock, LogOut, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  crewCount: number;
  volunteerCount: number;
  totalHelpers: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    crewCount: 0,
    volunteerCount: 0,
    totalHelpers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/helpers');
      if (response.ok) {
        const data = await response.json();
        const helpers = data?.helpers || [];
        const crewCount = helpers.filter((h: any) => h?.role === 'CREW')?.length || 0;
        const volunteerCount = helpers.filter((h: any) => h?.role === 'VOLUNTEER')?.length || 0;
        setStats({
          crewCount,
          volunteerCount,
          totalHelpers: helpers.length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-xl font-bold text-gray-900">Event Crew Manager</h1>
            </div>
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">Manage your event crew and schedules</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.crewCount}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Crew Members</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.volunteerCount}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Volunteers</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.totalHelpers}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Total Helpers</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/helpers">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Manage Helpers</h3>
              <p className="text-blue-100">
                View and manage crew members and volunteers
              </p>
            </div>
          </Link>

          <Link href="/schedules">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <CalendarClock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Schedule Editor</h3>
              <p className="text-green-100">
                Create and manage event shifts and schedules
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
