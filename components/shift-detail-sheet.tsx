'use client';

import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Users as UsersIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useEffect, useState } from 'react';

interface ShiftDetailSheetProps {
  shift: any;
  open: boolean;
  onClose: () => void;
  onRequestChange?: (shift: any) => void;
}

export function ShiftDetailSheet({ shift, open, onClose, onRequestChange }: ShiftDetailSheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!shift) return null;

  const getRoleColor = (role: string) => {
    if (role === 'CREW') return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
    if (role === 'VOLUNTEER') return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getAssignmentDisplay = () => {
    if (shift.isAvailability) {
      return shift?.helper?.name || 'Available';
    }

    if (shift.assignments && shift.assignments.length > 0) {
      const responsible = shift.assignments.find((a: any) => a.role === 'RESPONSIBLE');
      const helpers = shift.assignments.filter((a: any) => a.role === 'HELPER');

      return (
        <div className="space-y-2">
          {responsible && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{responsible.user?.name || 'Unknown'}</span>
              <Badge variant="outline" className={getRoleColor(responsible.user?.role)}>
                Responsible
              </Badge>
            </div>
          )}
          {helpers.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon className="w-4 h-4" />
                <span>Helpers ({helpers.length})</span>
              </div>
              {helpers.map((helper: any, idx: number) => (
                <div key={idx} className="ml-6 text-sm">
                  {helper.user?.name || 'Unknown'}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (shift?.helper) {
      return (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span>{shift.helper.name}</span>
          {shift.helper.role && (
            <Badge variant="outline" className={getRoleColor(shift.helper.role)}>
              {shift.helper.role}
            </Badge>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-red-600">
        <User className="w-4 h-4" />
        <span>Unassigned</span>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[80vh]" : ""}>
        <SheetHeader>
          <SheetTitle>{shift.title || 'Shift Details'}</SheetTitle>
          <SheetDescription>
            {shift.event?.name && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{shift.event.name}</Badge>
              </div>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  {format(new Date(shift.start), 'EEEE, MMMM d, yyyy')}
                </div>
                {new Date(shift.start).toDateString() !== new Date(shift.end).toDateString() && (
                  <div className="text-sm text-muted-foreground">
                    to {format(new Date(shift.end), 'EEEE, MMMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-medium">
                  {format(new Date(shift.start), 'HH:mm')} - {format(new Date(shift.end), 'HH:mm')}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({Math.round((new Date(shift.end).getTime() - new Date(shift.start).getTime()) / (1000 * 60 * 60) * 10) / 10}h)
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          {shift.event?.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="font-medium">{shift.event.location}</div>
            </div>
          )}

          {/* Assignment Info */}
          {!shift.isAvailability && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-3">Assignment</h4>
              {getAssignmentDisplay()}
            </div>
          )}

          {/* Description */}
          {shift.description && (
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{shift.description}</p>
            </div>
          )}

          {/* Actions */}
          {onRequestChange && !shift.isAvailability && (
            <div className="border-t border-border pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onRequestChange(shift);
                  onClose();
                }}
              >
                Request Change
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
