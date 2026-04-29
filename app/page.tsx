import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import AdminDashboard from '@/components/admin-dashboard';
import HelperDashboard from '@/components/helper-dashboard';
import LandingPage from '@/components/landing-page';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  const userRole = (session.user as { role: string })?.role;

  if (userRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <HelperDashboard />;
}
