'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { themeConfig } from '@/lib/theme-config';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

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
    <div className={`min-h-screen ${themeConfig.backgrounds.pageGradient}`}>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Hours Worked Report</h2>
          <p className="text-muted-foreground">View total hours worked by each helper</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
          >
            This Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
          >
            This Month
          </Button>
          <Button
            variant={period === 'all' ? 'default' : 'outline'}
            onClick={() => setPeriod('all')}
          >
            All Time
          </Button>
          <Button
            variant={period === 'custom' ? 'default' : 'outline'}
            onClick={() => setPeriod('custom')}
          >
            Custom Range
          </Button>
        </div>

        {getDateRangeText() && (
          <div className="mb-4 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-lg inline-block">
            Showing data from: <span className="font-semibold">{getDateRangeText()}</span>
          </div>
        )}

        {period === 'custom' && (
          <div className="mb-6 p-4 bg-card rounded-xl border shadow-sm">
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
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : report.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No shifts found"
            description={`No shifts were found for ${period === 'custom' ? 'the selected period' : period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'any period'}. Hours will appear here once shifts are completed.`}
          />
        ) : (
          <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
            <table className="w-full">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((entry, index) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-4">
                        {index === 0 ? (
                          <Trophy className="w-5 h-5 text-amber-500" />
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{entry.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(entry.role)}`}>
                          {entry.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{entry.hours}h</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-muted border-t px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-8">
                    <div>
                      <span className="text-sm text-muted-foreground">Total Hours:</span>
                      <span className="ml-2 font-bold text-foreground">
                        {Math.round(report.reduce((sum, entry) => sum + entry.hours, 0) * 100) / 100}h
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Average per Helper:</span>
                      <span className="ml-2 font-bold text-foreground">
                        {Math.round((report.reduce((sum, entry) => sum + entry.hours, 0) / report.length) * 100) / 100}h
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Helpers:</span>
                      <span className="ml-2 font-bold text-foreground">{report.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </main>
    </div>
  );
}
