import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin-dashboard';
import HelperDashboard from '@/components/helper-dashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userRole = (session.user as any)?.role;

  if (userRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <HelperDashboard />;
}
