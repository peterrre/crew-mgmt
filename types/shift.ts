export interface Assignment {
  id: string;
  role: 'RESPONSIBLE' | 'HELPER';
  userId: string;
  shiftId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface Shift {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  event?: { title?: string };
  minHelpers?: number;
  maxHelpers?: number;
}
