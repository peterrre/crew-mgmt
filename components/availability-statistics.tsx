'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { AvailabilitySlot } from '@/hooks/use-availability-slots';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';

interface AvailabilityStatisticsProps {
  slots: AvailabilitySlot[];
}

export function AvailabilityStatistics({ slots }: AvailabilityStatisticsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Calculate total hours this week
    const thisWeekHours = slots.reduce((total, slot) => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);

      if (isWithinInterval(start, { start: weekStart, end: weekEnd })) {
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);

    // Count slots by day of week
    const dayCount: { [key: number]: number } = {};
    slots.forEach(slot => {
      const day = new Date(slot.start).getDay();
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    // Find most and least available days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostAvailableDay = Object.entries(dayCount).reduce(
      (max, [day, count]) => (count > max.count ? { day: parseInt(day), count } : max),
      { day: -1, count: 0 }
    );
    const leastAvailableDay = Object.entries(dayCount).reduce(
      (min, [day, count]) => (min.day === -1 || count < min.count ? { day: parseInt(day), count } : min),
      { day: -1, count: 0 }
    );

    // Calculate coverage percentage (slots available vs total week hours)
    const totalWeekHours = 168; // 7 days * 24 hours
    const coveragePercentage = (thisWeekHours / totalWeekHours) * 100;

    return {
      thisWeekHours: Math.round(thisWeekHours * 10) / 10,
      totalSlots: slots.length,
      mostAvailableDay: mostAvailableDay.day >= 0 ? dayNames[mostAvailableDay.day] : 'N/A',
      leastAvailableDay: leastAvailableDay.day >= 0 ? dayNames[leastAvailableDay.day] : 'N/A',
      coveragePercentage: Math.round(coveragePercentage * 10) / 10,
    };
  }, [slots]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisWeekHours}h</div>
          <p className="text-xs text-muted-foreground">Available hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Slots</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSlots}</div>
          <p className="text-xs text-muted-foreground">Availability slots</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Available</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.mostAvailableDay}</div>
          <p className="text-xs text-muted-foreground">Day of week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Coverage</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.coveragePercentage}%</div>
          <p className="text-xs text-muted-foreground">Of total week</p>
        </CardContent>
      </Card>
    </div>
  );
}
