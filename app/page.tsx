import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import AdminDashboard from '@/components/admin-dashboard';
import HelperDashboard from '@/components/helper-dashboard';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If no session, show landing page with links
  if (!session) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 relative overflow-hidden">
        {/* Decorative background blur orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full text-center space-y-10 relative z-10">
          {/* Logo + Title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-[22px] flex items-center justify-center shadow-xl shadow-blue-500/20 transition-transform duration-300 hover:scale-105">
                <Calendar className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
                Crew Management
              </h1>
              <p className="text-[#6E6E73] dark:text-slate-400 text-lg leading-relaxed max-w-sm mx-auto">
                Organize events, manage shifts, and coordinate your team — all in one beautiful place.
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#007AFF]" />
              </div>
              <span className="text-xs font-medium text-[#1D1D1F] dark:text-slate-200">Team</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-[#34C759]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#34C759]" />
              </div>
              <span className="text-xs font-medium text-[#1D1D1F] dark:text-slate-200">Shifts</span>
            </div>
            <div className="flex flex-col items-center space-y-2 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-[#AF52DE]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#AF52DE]" />
              </div>
              <span className="text-xs font-medium text-[#1D1D1F] dark:text-slate-200">Secure</span>
            </div>
          </div>

          {/* Glassmorphism card with CTAs */}
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 rounded-2xl shadow-2xl shadow-black/5 p-8 space-y-4 border border-white/40 dark:border-slate-700/50">
            <Button
              asChild
              size="lg"
              className="w-full h-12 rounded-xl bg-[#0051D5] hover:bg-[#0044B5] text-white font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Link href="/login">Sign In</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-xl border-[#E5E5EA] dark:border-slate-600 hover:bg-[#F5F5F7] dark:hover:bg-slate-700 text-[#1D1D1F] dark:text-slate-200 font-medium transition-all duration-200"
            >
              <Link href="/signup-volunteer">Volunteer Sign Up</Link>
            </Button>

            <p className="text-sm text-[#6E6E73] dark:text-slate-400 pt-2">
              New crew member?{' '}
              <Link
                href="/register"
                className="font-semibold text-[#0051D5] hover:text-[#0044B5] dark:text-[#0A84FF] dark:hover:text-[#409CFF] transition-colors duration-200"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-[#555558] dark:text-slate-500">
            Secure, fast, and beautifully designed for your team.
          </p>
        </div>
      </main>
    );
  }

  const userRole = (session.user as { role: string })?.role;

  if (userRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <HelperDashboard />;
}
