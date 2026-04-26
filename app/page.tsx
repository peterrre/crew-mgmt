import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin-dashboard';
import HelperDashboard from '@/components/helper-dashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If no session, show landing page with links
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-6">Crew Management</h1>
        <div className="space-y-4">
          <a 
            href="/login" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </a>
          <a 
            href="/signup-volunteer" 
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Volunteer Sign Up
          </a>
        </div>
      </div>
    );
  }

  const userRole = (session.user as any)?.role;

  if (userRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <HelperDashboard />;
}
