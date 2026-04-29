export interface Assignment {
  id: string;
  userId: string;
  role: string;
  shiftId: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface Shift {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  helperId: string | null;
  eventId: string;
  location?: string;
  event?: {
    name: string;
    title?: string;
  };
  minHelpers?: number;
  maxHelpers?: number;
  assignments?: Assignment[];
}
