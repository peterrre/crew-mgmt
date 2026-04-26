'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Trophy } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

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
  }, [period, fetchReport]);

  const fetchReport = useCallback(async () => {
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
  }, [period, startDate, endDate]);

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
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'CREW':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300';
      case 'VOLUNTEER':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="sticky top-0 z-50 bg-amber-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-amber-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-sky-900 dark:text-white mb-2">Hours Worked Report</h2>
          <p className="text-sky-700 dark:text-slate-400">View total hours worked by each helper</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
            className={period === 'week' ? 'bg-amber-500 hover:bg-orange-600' : 'dark:border-slate-600 dark:text-slate-300'}
          >
            This Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
            className={period === 'month' ? 'bg-amber-500 hover:bg-orange-600' : 'dark:border-slate-600 dark:text-slate-300'}
          >
            This Month
          </Button>
          <Button
            variant={period === 'all' ? 'default' : 'outline'}
            onClick={() => setPeriod('all')}
            className={period === 'all' ? 'bg-amber-500 hover:bg-orange-600' : 'dark:border-slate-600 dark:text-slate-300'}
          >
            All Time
          </Button>
          <Button
            variant={period === 'custom' ? 'default' : 'outline'}
            onClick={() => setPeriod('custom')}
            className={period === 'custom' ? 'bg-amber-500 hover:bg-orange-600' : 'dark:border-slate-600 dark:text-slate-300'}
          >
            Custom Range
          </Button>
        </div>

        {getDateRangeText() && (
          <div className="mb-4 text-sm text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-slate-800 px-4 py-2 rounded-lg inline-block">
            Showing data from: <span className="font-semibold">{getDateRangeText()}</span>
          </div>
        )}

        {period === 'custom' && (
          <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-slate-700 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="dark:text-slate-200">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="dark:text-slate-200">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-amber-100 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">Loading...</div>
          ) : report.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">No shifts found for this period</div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-sky-50 dark:bg-slate-700 border-b border-sky-100 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-sky-900 dark:text-white">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-sky-900 dark:text-white">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-sky-900 dark:text-white">Role</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-sky-900 dark:text-white">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-amber-50/50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        {index === 0 ? (
                          <Trophy className="w-5 h-5 text-amber-500" />
                        ) : (
                          <span className="text-gray-500 dark:text-slate-400">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{entry.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(entry.role)}`}>
                          {entry.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                          <span className="font-semibold text-gray-900 dark:text-white">{entry.hours}h</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-sky-50 dark:bg-slate-700 border-t border-sky-100 dark:border-slate-600 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-8">
                    <div>
                      <span className="text-sm text-sky-700 dark:text-slate-300">Total Hours:</span>
                      <span className="ml-2 font-bold text-sky-900 dark:text-white">
                        {Math.round(report.reduce((sum, entry) => sum + entry.hours, 0) * 100) / 100}h
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-sky-700 dark:text-slate-300">Average per Helper:</span>
                      <span className="ml-2 font-bold text-sky-900 dark:text-white">
                        {Math.round((report.reduce((sum, entry) => sum + entry.hours, 0) / report.length) * 100) / 100}h
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-sky-700 dark:text-slate-300">Helpers:</span>
                      <span className="ml-2 font-bold text-sky-900 dark:text-white">{report.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}