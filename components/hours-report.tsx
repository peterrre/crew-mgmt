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

  useEffect(() => {
    if (period !== 'custom') {
      fetchReport();
    }
  }, [period, fetchReport]);

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
        return 'bg-purple/10 text-purple';
      case 'CREW':
        return 'bg-blue/10 text-blue';
      case 'VOLUNTEER':
        return 'bg-yellow/10 text-yellow';
      default:
        return 'bg-backgroundSecondary text-foregroundSecondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-backgroundSecondary to-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-blue hover:text-blue">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foregroundPrimary mb-2">Hours Worked Report</h2>
          <p className="text-foregroundSecondary">View total hours worked by each helper</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            onClick={() => setPeriod('week')}
            className={period === 'week' ? 'bg-yellow hover:bg-yellow text-white' : 'border-border text-foregroundSecondary'}
          >
            This Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            onClick={() => setPeriod('month')}
            className={period === 'month' ? 'bg-yellow hover:bg-yellow text-white' : 'border-border text-foregroundSecondary'}
          >
            This Month
          </Button>
          <Button
            variant={period === 'all' ? 'default' : 'outline'}
            onClick={() => setPeriod('all')}
            className={period === 'all' ? 'bg-yellow hover:bg-yellow text-white' : 'border-border text-foregroundSecondary'}
          >
            All Time
          </Button>
          <Button
            variant={period === 'custom' ? 'default' : 'outline'}
            onClick={() => setPeriod('custom')}
            className={period === 'custom' ? 'bg-yellow hover:bg-yellow text-white' : 'border-border text-foregroundSecondary'}
          >
            Custom Range
          </Button>
        </div>

        {getDateRangeText() && (
          <div className="mb-4 text-sm text-blue bg-blue/10 px-4 py-2 rounded-lg inline-block">
            Showing data from: <span className="font-semibold">{getDateRangeText()}</span>
          </div>
        )}

        {period === 'custom' && (
          <div className="mb-6 p-4 bg-background rounded-xl border border-border shadow-sm">
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
                className="bg-yellow hover:bg-yellow text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        <div className="bg-background rounded-2xl shadow-lg border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-foregroundTertiary">Loading...</div>
          ) : report.length === 0 ? (
            <div className="p-8 text-center text-foregroundTertiary">No shifts found for this period</div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-backgroundSecondary border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foregroundPrimary">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foregroundPrimary">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foregroundPrimary">Role</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foregroundPrimary">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-border hover:bg-backgroundSecondary/50">
                      <td className="px-6 py-4">
                        {index === 0 ? (
                          <Trophy className="w-5 h-5 text-yellow" />
                        ) : (
                          <span className="text-foregroundTertiary">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-foregroundPrimary">{entry.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(entry.role)}`}>
                          {entry.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="w-4 h-4 text-foregroundTertiary" />
                          <span className="font-semibold text-foregroundPrimary">{entry.hours}h</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-backgroundSecondary border-t border-border px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-8">
                    <div>
                      <span className="text-sm text-foregroundSecondary">Total Hours:</span>
                      <span className="ml-2 font-bold text-foregroundPrimary">
                        {Math.round(report.reduce((sum, entry) => sum + entry.hours, 0) * 100) / 100}h
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-foregroundSecondary">Average per Helper:</span>
                      <span className="ml-2 font-bold text-foregroundPrimary">
                        {Math.round((report.reduce((sum, entry) => sum + entry.hours, 0) / report.length) * 100) / 100}h
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-foregroundSecondary">Helpers:</span>
                      <span className="ml-2 font-bold text-foregroundPrimary">{report.length}</span>
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
