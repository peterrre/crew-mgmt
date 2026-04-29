import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import Link from 'next/link';
import { Calendar, Users, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    const userRole = (session.user as { role: string })?.role;
    if (userRole === 'ADMIN') {
      const AdminDashboard = (await import('@/components/admin-dashboard')).default;
      return <AdminDashboard />;
    }
    const HelperDashboard = (await import('@/components/helper-dashboard')).default;
    return <HelperDashboard />;
  }

  return (
    <main className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Subtle gradient blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue/10 dark:bg-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-purple/10 dark:bg-purple/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-blue to-purple rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-foregroundPrimary tracking-tight">
            Crew Mgmt
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-foregroundPrimary hover:text-blue transition-colors duration-200"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 text-sm font-semibold text-white bg-[#0051D5] rounded-xl hover:bg-[#0044B5] transition-all duration-200 shadow-md"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-backgroundSecondary border border-border text-sm text-foregroundSecondary">
          <Sparkles className="w-4 h-4 text-yellow" />
          Festival crew management, simplified
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foregroundPrimary tracking-tight leading-tight max-w-3xl">
          Organize your crew.
          <br />
          <span className="bg-gradient-to-r from-blue to-purple bg-clip-text text-transparent">
            Rock your festival.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-foregroundSecondary max-w-xl leading-relaxed">
          Effortless shift planning, smart helper assignments, and real-time
          availability — all in one beautiful interface.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-[#0051D5] rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            Start free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium text-foregroundPrimary bg-backgroundSecondary border border-border rounded-2xl hover:border-blue/30 hover:text-blue transition-all duration-200"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 px-6 pb-20 md:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group p-6 bg-background/80 backdrop-blur-xl rounded-2xl border border-border shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 bg-blue/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue/15 transition-colors duration-200">
              <Calendar className="w-6 h-6 text-blue" />
            </div>
            <h2 className="text-lg font-semibold text-foregroundPrimary mb-2">
              Smart Scheduling
            </h2>
            <p className="text-sm text-foregroundSecondary leading-relaxed">
              Drag-and-drop shift calendar with overlap prevention and
              auto-assignment of available helpers.
            </p>
          </div>

          <div className="group p-6 bg-background/80 backdrop-blur-xl rounded-2xl border border-border shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 bg-green/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green/15 transition-colors duration-200">
              <Users className="w-6 h-6 text-green" />
            </div>
            <h2 className="text-lg font-semibold text-foregroundPrimary mb-2">
              Crew Management
            </h2>
            <p className="text-sm text-foregroundSecondary leading-relaxed">
              Track volunteer availability, skills, and preferences. Assign the
              right person to the right shift.
            </p>
          </div>

          <div className="group p-6 bg-background/80 backdrop-blur-xl rounded-2xl border border-border shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 bg-purple/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple/15 transition-colors duration-200">
              <Shield className="w-6 h-6 text-purple" />
            </div>
            <h2 className="text-lg font-semibold text-foregroundPrimary mb-2">
              Role-based Access
            </h2>
            <p className="text-sm text-foregroundSecondary leading-relaxed">
              Admin dashboards, helper views, and volunteer sign-up — each
              tailored to their needs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 border-t border-border text-center">
        <p className="text-sm text-foregroundSecondary">
          Crew Management — Built with care for festival teams.
        </p>
      </footer>
    </main>
  );
}
