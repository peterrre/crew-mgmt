'use client';

import Link from 'next/link';
import { Calendar, Users, Clock, Shield, ChevronRight, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { HeroEntrance } from '@/components/ui/motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue/20 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-green/15 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-border/60 backdrop-blur-xl bg-background/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              CrewMgmt
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/register"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

 {/* Hero Section */}
 <section className="relative z-10 pt-24 pb-20 px-6">
 <div className="max-w-4xl mx-auto text-center">
 <HeroEntrance delay={0}>
  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-backgroundSecondary/60 backdrop-blur-md rounded-full border border-border/80 mb-8 shadow-sm">
 <Sparkles className="w-3.5 h-3.5 text-orange" />
 <span className="text-xs font-medium text-muted-foreground">
 Volunteer management reimagined
 </span>
 </div>
 </HeroEntrance>

 <HeroEntrance delay={0.1}>
 <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6">
 Organize events
 <br />
 <span className="bg-gradient-to-r from-primary to-green bg-clip-text text-transparent">
 without the chaos
 </span>
 </h1>
 </HeroEntrance>

 <HeroEntrance delay={0.2}>
 <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
 Effortlessly coordinate your crew, track volunteer hours, and manage shifts
 with the elegance your team deserves.
 </p>
 </HeroEntrance>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group relative px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-1 active:translate-y-0"
            >
              Get Started
              <ChevronRight className="inline-block w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup-volunteer"
              className="px-8 py-4 bg-backgroundSecondary/60 backdrop-blur-md border border-border/80 text-foreground rounded-2xl font-semibold text-lg hover:bg-backgroundSecondary/15 transition-all duration-200"
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
            <div className="group p-6 bg-backgroundSecondary/60 backdrop-blur-xl rounded-3xl border border-border/5 hover:border-blue/30 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-blue" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Smart Scheduling
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Drag-and-drop shift assignment with intelligent overlap detection. Never double-book again.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 bg-backgroundSecondary/60 backdrop-blur-xl rounded-3xl border border-border/5 hover:border-green/30 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1">
              <div className="w-12 h-12 bg-green/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-green" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Volunteer Portal
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Self-service signup and shift availability. Let volunteers manage their own schedule.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 bg-backgroundSecondary/60 backdrop-blur-xl rounded-3xl border border-border/5 hover:border-orange/30 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1">
              <div className="w-12 h-12 bg-orange/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-orange" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Hours Tracking
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatic hour logging with approval workflows. Export reports in one click.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 bg-backgroundSecondary/60 backdrop-blur-xl rounded-3xl border border-border/5 hover:border-purple/30 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-purple" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Role-Based Access
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Secure permissions for admins, crew leads, and volunteers. Fine-grained control.
              </p>
            </div>

            {/* Feature 5 - Stats */}
            <div className="md:col-span-2 lg:col-span-2 p-6 bg-gradient-to-br from-blue/5 to-green/5 backdrop-blur-xl rounded-3xl border border-border/5">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Events managed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">2k+</div>
                  <div className="text-sm text-muted-foreground">Volunteers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground mb-1">50k+</div>
                  <div className="text-sm text-muted-foreground">Hours tracked</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-purple rounded-md flex items-center justify-center">
              <Calendar className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">
              CrewMgmt
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Crew Management. Built with care.
          </p>
        </div>
      </footer>
    </div>
  );
}
