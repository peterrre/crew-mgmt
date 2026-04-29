'use client';

import Link from 'next/link';
import { Calendar, Users, Clock, Shield, ChevronRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0D0D0F] overflow-x-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-green-400/15 dark:bg-green-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-[#E5E5EA]/60 dark:border-white/5 backdrop-blur-xl bg-white/50 dark:bg-black/20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
              CrewMgmt
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/register"
              className="text-sm font-medium text-[#007AFF] hover:text-[#0051D5] transition-colors duration-200"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-full border border-[#E5E5EA]/80 dark:border-white/10 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FF9500]" />
            <span className="text-xs font-medium text-[#6E6E73] dark:text-[#AEAEB2]">
              Volunteer management reimagined
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#1D1D1F] dark:text-white leading-[1.1] mb-6">
            Organize events
            <br />
            <span className="bg-gradient-to-r from-[#007AFF] to-[#34C759] bg-clip-text text-transparent">
              without the chaos
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#6E6E73] dark:text-[#AEAEB2] max-w-2xl mx-auto leading-relaxed mb-10">
            Effortlessly coordinate your crew, track volunteer hours, and manage shifts
            with the elegance your team deserves.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group relative px-8 py-4 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-1 active:translate-y-0"
            >
              Get Started
              <ChevronRight className="inline-block w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup-volunteer"
              className="px-8 py-4 bg-white/60 dark:bg-white/10 backdrop-blur-md border border-[#E5E5EA]/80 dark:border-white/10 text-[#1D1D1F] dark:text-white rounded-2xl font-semibold text-lg hover:bg-white dark:hover:bg-white/15 transition-all duration-200"
            >
              Volunteer Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-[#E5E5EA]/80 dark:border-white/5 hover:border-[#007AFF]/30 dark:hover:border-[#007AFF]/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#007AFF]/10 dark:bg-[#007AFF]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-[#007AFF]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mb-2">
                Smart Scheduling
              </h3>
              <p className="text-[#6E6E73] dark:text-[#AEAEB2] leading-relaxed">
                Drag-and-drop shift assignment with intelligent overlap detection. Never double-book again.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-[#E5E5EA]/80 dark:border-white/5 hover:border-[#34C759]/30 dark:hover:border-[#34C759]/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#34C759]/10 dark:bg-[#34C759]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-[#34C759]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mb-2">
                Volunteer Portal
              </h3>
              <p className="text-[#6E6E73] dark:text-[#AEAEB2] leading-relaxed">
                Self-service signup and shift availability. Let volunteers manage their own schedule.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-[#E5E5EA]/80 dark:border-white/5 hover:border-[#FF9500]/30 dark:hover:border-[#FF9500]/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#FF9500]/10 dark:bg-[#FF9500]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-[#FF9500]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mb-2">
                Hours Tracking
              </h3>
              <p className="text-[#6E6E73] dark:text-[#AEAEB2] leading-relaxed">
                Automatic hour logging with approval workflows. Export reports in one click.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-[#E5E5EA]/80 dark:border-white/5 hover:border-[#AF52DE]/30 dark:hover:border-[#AF52DE]/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-1">
              <div className="w-12 h-12 bg-[#AF52DE]/10 dark:bg-[#AF52DE]/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-[#AF52DE]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mb-2">
                Role-Based Access
              </h3>
              <p className="text-[#6E6E73] dark:text-[#AEAEB2] leading-relaxed">
                Secure permissions for admins, crew leads, and volunteers. Fine-grained control.
              </p>
            </div>

            {/* Feature 5 - Stats */}
            <div className="md:col-span-2 lg:col-span-2 p-6 bg-gradient-to-br from-[#007AFF]/5 to-[#34C759]/5 dark:from-[#007AFF]/10 dark:to-[#34C759]/10 backdrop-blur-xl rounded-3xl border border-[#E5E5EA]/80 dark:border-white/5">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#1D1D1F] dark:text-white mb-1">500+</div>
                  <div className="text-sm text-[#6E6E73] dark:text-[#AEAEB2]">Events managed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#1D1D1F] dark:text-white mb-1">2k+</div>
                  <div className="text-sm text-[#6E6E73] dark:text-[#AEAEB2]">Volunteers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#1D1D1F] dark:text-white mb-1">50k+</div>
                  <div className="text-sm text-[#6E6E73] dark:text-[#AEAEB2]">Hours tracked</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#E5E5EA]/60 dark:border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-md flex items-center justify-center">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-[#1D1D1F] dark:text-white">
              CrewMgmt
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] dark:text-[#AEAEB2]">
            © 2025 Crew Management. Built with care.
          </p>
        </div>
      </footer>
    </div>
  );
}
