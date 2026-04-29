import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import AdminDashboard from '@/components/admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-backgroundSecondary px-6">
        <div className="max-w-3xl w-full text-center space-y-10">
          {/* Logo & Hero */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foregroundPrimary">
              Crew Manager
            </h1>
            <p className="text-xl text-foregroundSecondary max-w-lg mx-auto leading-relaxed">
              Schedule smarter. Work simpler. <br className="hidden sm:block" />
              Everything your event crew needs in one place.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/login"
              className="inline-flex items-center justify-center h-14 px-10 rounded-2xl bg-foregroundPrimary text-white font-semibold text-lg hover:bg-foregroundPrimary/90 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Sign In
            </a>
            <a
              href="/signup-volunteer"
              className="inline-flex items-center justify-center h-14 px-10 rounded-2xl bg-background text-foregroundPrimary font-semibold text-lg border border-border hover:bg-backgroundSecondary transition-all duration-200 w-full sm:w-auto"
            >
              Volunteer Sign Up
            </a>
          </div>

          {/* Feature Teasers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
            <div className="bg-background rounded-2xl p-6 shadow-sm border border-border/50 text-center">
              <div className="w-12 h-12 bg-blue/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3 className="font-semibold text-foregroundPrimary mb-1">Crew & Volunteers</h3>
              <p className="text-sm text-foregroundSecondary">Manage your entire team</p>
            </div>
            <div className="bg-background rounded-2xl p-6 shadow-sm border border-border/50 text-center">
              <div className="w-12 h-12 bg-purple/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="6"/>
                  <line x1="8" x2="8" y1="2" y2="6"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
              </div>
              <h3 className="font-semibold text-foregroundPrimary mb-1">Shift Calendar</h3>
              <p className="text-sm text-foregroundSecondary">Visual scheduling</p>
            </div>
            <div className="bg-background rounded-2xl p-6 shadow-sm border border-border/50 text-center">
              <div className="w-12 h-12 bg-yellow/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-foregroundPrimary mb-1">Self-Service</h3>
              <p className="text-sm text-foregroundSecondary">Volunteer applications</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const userRole = (session.user as { role: string })?.role;

  if (userRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  // For non-admin users, redirect via client-side or rely on middleware.
  // We return a minimal placeholder here.
  return (
    <div className="min-h-screen flex items-center justify-center bg-backgroundSecondary">
      <p className="text-foregroundSecondary">Redirecting...</p>
    </div>
  );
}
