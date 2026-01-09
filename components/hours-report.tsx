'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Trophy } from 'lucide-react';
import Link from 'next/link';

interface ReportEntry {
  id: string;
  name: string;
  role: string;
  hours: number;
}

export default function HoursReport() {
  const [report, setReport] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (period !== 'custom') {
      fetchReport();
    }
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports/hours?period=${period}&t=${Date.now()}`;
      if (period === 'custom' && startDate && endDate) {
        url = `/api/reports/hours?period=custom&startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`;
      }
      const response = await fetch(url, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setReport(data.report || []);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = () => {
    if (startDate && endDate) {
      fetchReport();
    }
  };

  const getDateRangeText = () => {
    const now = new Date();
    if (period === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    } else if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return `${monthStart.toLocaleDateString()} - ${monthEnd.toLocaleDateString()}`;
    } else if (period === 'custom' && startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    }
    return '';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'CREW':
        return 'bg-sky-100 text-sky-700';
      case 'VOLUNTEER':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-sky-100">
      <header className="sticky top-0 z-50 bg-amber-50/80 backdrop-blur-md border-b border-amber-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-sky-700 hover:text-sky-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-sky-900 mb-2">Hours Worked Report</h2>
          <p className="text-sky-700">View total hours worked by each helper</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
            className={period === 'week' ? 'bg-amber-500 hover:bg-orange-600' : ''}
          >
            This Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
            className={period === 'month' ? 'bg-amber-500 hover:bg-orange-600' : ''}
          >
            This Month
          </Button>
          <Button
            variant={period === 'all' ? 'default' : 'outline'}
            onClick={() => setPeriod('all')}
            className={period === 'all' ? 'bg-amber-500 hover:bg-orange-600' : ''}
          >
            All Time
          </Button>
          <Button
            variant={period === 'custom' ? 'default' : 'outline'}
            onClick={() => setPeriod('custom')}
            className={period === 'custom' ? 'bg-amber-500 hover:bg-orange-600' : ''}
          >
            Custom Range
          </Button>
        </div>

        {getDateRangeText() && (
          <div className="mb-4 text-sm text-sky-700 bg-sky-50 px-4 py-2 rounded-lg inline-block">
            Showing data from: <span className="font-semibold">{getDateRangeText()}</span>
          </div>
        )}

        {period === 'custom' && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-amber-100 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                onClick={handleCustomSearch}
                disabled={!startDate || !endDate}
                className="bg-amber-500 hover:bg-orange-600"
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : report.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No shifts found for this period</div>
          ) : (
            <table className="w-full">
              <thead className="bg-sky-50 border-b border-sky-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-sky-900">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-sky-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-sky-900">Role</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-sky-900">Hours</th>
                </tr>
              </thead>
              <tbody>
                {report.map((entry, index) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-amber-50/50">
                    <td className="px-6 py-4">
                      {index === 0 ? (
                        <Trophy className="w-5 h-5 text-amber-500" />
                      ) : (
                        <span className="text-gray-500">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{entry.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(entry.role)}`}>
                        {entry.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">{entry.hours}h</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
