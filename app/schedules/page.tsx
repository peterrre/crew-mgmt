import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Deprecated: Global schedule editor has been replaced by event-centric architecture.
// This route now redirects to the events page where schedules are managed per-event.
export default async function SchedulesPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/');
  }

  // Redirect to the events page - schedules are now managed per-event
  redirect('/admin/events');
}
