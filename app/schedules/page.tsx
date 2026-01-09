import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import ScheduleEditor from '@/components/schedule-editor';

export const dynamic = 'force-dynamic';

export default async function SchedulesPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/');
  }

  return <ScheduleEditor />;
}
