"use client";

import Link from "next/link";
import {
  ArrowRight,
  Target,
  BarChart3,
  Users,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Target size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">OMP</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">
              Features
            </a>
            <a href="#benefits" className="hover:text-blue-600 transition">
              Why Us
            </a>
          </div>
          <Link
            href="/login"
            className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-blue-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Performance Management Redefined
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-950 mb-8 max-w-4xl mx-auto leading-[1.1]">
          Achieve More with <span className="text-blue-600">Alignment</span> &
          Transparency
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          OMP transforms how teams set, track, and achieve goals. Empower your
          workforce with clarity and data-driven insights.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-600/20"
          >
            Get Started Now <ArrowRight size={18} />
          </Link>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">
          Built for High Performance
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Target size={24} />}
            title="Goal Cascading"
            desc="Connect personal contributions to the company vision effortlessly."
          />
          <FeatureCard
            icon={<BarChart3 size={24} />}
            title="Live Dashboards"
            desc="Track team progress in real-time with automated reporting."
          />
          <FeatureCard
            icon={<Users size={24} />}
            title="Shared Ownership"
            desc="Collaborate on departmental goals with complete visibility."
          />
          <FeatureCard
            icon={<ShieldCheck size={24} />}
            title="Governance"
            desc="Standardize cycles and review schedules organization-wide."
          />
        </div>
      </section>

      {/* Simple CTA Section */}
      <section className="py-20 px-6 text-center bg-slate-900 text-white">
        <h2 className="text-4xl font-bold mb-6">Ready to empower your team?</h2>
        <p className="text-slate-400 mb-10 max-w-lg mx-auto">
          Join hundreds of companies that use OMP to drive productivity and
          performance.
        </p>
        <Link
          href="/login"
          className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-slate-100 transition inline-block"
        >
          Login as Admin/Manager/Employee
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12 text-center text-slate-400 text-sm border-t border-slate-100">
        © {new Date().getFullYear()} OMP Inc. All performance rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="bg-blue-50 text-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2 text-slate-950">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
