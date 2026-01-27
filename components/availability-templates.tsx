'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { startOfWeek, addDays, setHours, setMinutes } from 'date-fns';
import { AvailabilitySlot } from '@/hooks/use-availability-slots';

interface AvailabilityTemplatesProps {
  onApplyTemplate: (slots: AvailabilitySlot[]) => void;
}

export function AvailabilityTemplates({ onApplyTemplate }: AvailabilityTemplatesProps) {
  const generateTemplate = (type: 'weekends' | 'evenings' | 'fulltime' | 'mornings'): AvailabilitySlot[] => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const slots: AvailabilitySlot[] = [];

    if (type === 'weekends') {
      // Saturday and Sunday, 9 AM - 6 PM
      const saturday = addDays(weekStart, 5);
      const sunday = addDays(weekStart, 6);

      slots.push({
        start: setMinutes(setHours(saturday, 9), 0).toISOString(),
        end: setMinutes(setHours(saturday, 18), 0).toISOString(),
        isRecurring: true,
        recurrencePattern: 'weekly',
      });

      slots.push({
        start: setMinutes(setHours(sunday, 9), 0).toISOString(),
        end: setMinutes(setHours(sunday, 18), 0).toISOString(),
        isRecurring: true,
        recurrencePattern: 'weekly',
      });
    } else if (type === 'evenings') {
      // Monday to Friday, 6 PM - 10 PM
      for (let i = 0; i < 5; i++) {
        const day = addDays(weekStart, i);
        slots.push({
          start: setMinutes(setHours(day, 18), 0).toISOString(),
          end: setMinutes(setHours(day, 22), 0).toISOString(),
          isRecurring: true,
          recurrencePattern: 'weekly',
        });
      }
    } else if (type === 'fulltime') {
      // Monday to Friday, 9 AM - 5 PM
      for (let i = 0; i < 5; i++) {
        const day = addDays(weekStart, i);
        slots.push({
          start: setMinutes(setHours(day, 9), 0).toISOString(),
          end: setMinutes(setHours(day, 17), 0).toISOString(),
          isRecurring: true,
          recurrencePattern: 'weekly',
        });
      }
    } else if (type === 'mornings') {
      // Monday to Friday, 8 AM - 12 PM
      for (let i = 0; i < 5; i++) {
        const day = addDays(weekStart, i);
        slots.push({
          start: setMinutes(setHours(day, 8), 0).toISOString(),
          end: setMinutes(setHours(day, 12), 0).toISOString(),
          isRecurring: true,
          recurrencePattern: 'weekly',
        });
      }
    }

    return slots;
  };

  const templates = [
    {
      id: 'weekends',
      title: 'Weekends Only',
      description: 'Sat & Sun, 9 AM - 6 PM',
      icon: '📅',
    },
    {
      id: 'evenings',
      title: 'Weekday Evenings',
      description: 'Mon-Fri, 6 PM - 10 PM',
      icon: '🌙',
    },
    {
      id: 'fulltime',
      title: 'Full-Time',
      description: 'Mon-Fri, 9 AM - 5 PM',
      icon: '💼',
    },
    {
      id: 'mornings',
      title: 'Morning Shifts',
      description: 'Mon-Fri, 8 AM - 12 PM',
      icon: '🌅',
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <CardTitle>Quick Templates</CardTitle>
        </div>
        <CardDescription>
          Start with a pre-defined schedule, then customize as needed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="h-auto flex flex-col items-start p-4 hover:bg-accent"
              onClick={() => onApplyTemplate(generateTemplate(template.id as any))}
            >
              <div className="text-2xl mb-2">{template.icon}</div>
              <div className="font-semibold text-sm text-left">{template.title}</div>
              <div className="text-xs text-muted-foreground text-left mt-1">
                {template.description}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
