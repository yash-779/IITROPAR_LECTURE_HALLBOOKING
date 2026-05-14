import React from "react";
import { Link } from "react-router-dom";
import {
  MdArrowForward,
  MdCheckCircle,
  MdCalendarMonth,
  MdPeople,
  MdVerifiedUser,
  MdMeetingRoom,
  MdSpeed,
  MdSecurity,
  MdEventAvailable,
  MdApproval,
  MdDashboard,
} from "react-icons/md";
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-brand-500/40 hover:bg-white/10 hover:-translate-y-1">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30 group-hover:bg-brand-500/30 transition-all">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-400">{desc}</p>
    </div>
  );
}
function StatCard({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-8 py-6 backdrop-blur-md">
      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
        {value}
      </span>
      <span className="text-sm font-medium text-gray-400">{label}</span>
    </div>
  );
}
function RoleBadge({ icon, label, color }) {
  return (
    <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border ${color}`}>
      {icon}
      {label}
    </div>
  );
}
export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#050d2a] text-white font-sans overflow-x-hidden selection:bg-brand-500/40">
      {}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-brand-600 opacity-20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600 opacity-15 blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 h-[400px] w-[400px] rounded-full bg-purple-600 opacity-10 blur-[120px]" />
        {}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>
      {}
      <nav className="relative z-10 flex items-center justify-between border-b border-white/5 px-6 py-5 backdrop-blur-xl max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="/iit_ropar_logo.png"
            alt="IIT Ropar"
            className="h-10 w-10 rounded-lg bg-white object-contain p-1 shadow-lg"
          />
          <div>
            <span className="text-xl font-black tracking-wide text-white">
              IITR <span className="text-brand-400">HALL</span>SYNC
            </span>
            <p className="text-[10px] font-medium text-gray-500 -mt-0.5">
              IIT Ropar — Venue Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth/sign-in"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20"
          >
            Sign In
          </Link>
          <Link
            to="/auth/sign-in"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(67,24,255,0.35)] transition-all hover:bg-brand-400 hover:shadow-[0_0_28px_rgba(67,24,255,0.5)]"
          >
            Get Started <MdArrowForward size={16} />
          </Link>
        </div>
      </nav>
      {}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-16 text-center">
        {}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-5 py-2 text-sm font-bold text-brand-300 backdrop-blur-md">
          <MdCheckCircle size={16} className="text-brand-400" />
          Official Venue Booking System — IIT Ropar
        </div>
        {}
        <h1 className="mb-6 text-5xl font-black leading-[1.1] text-white md:text-6xl lg:text-7xl">
          Centralized Hall Booking
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400">
            for IIT Ropar.
          </span>
        </h1>
        {}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400">
          IITR HallSync eliminates manual paperwork and email chains. Book lecture halls, seminar rooms, and auditoriums instantly — with a full multi-level approval workflow built right in.
        </p>
        {}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth/sign-in"
            className="group flex items-center gap-3 rounded-2xl bg-brand-500 px-10 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(67,24,255,0.45)] transition-all hover:bg-brand-400 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(67,24,255,0.6)]"
          >
            Enter Portal
            <MdArrowForward size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-10 py-4 text-base font-bold text-gray-300 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20"
          >
            See Features
          </a>
        </div>
        {}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 mr-1">
            Serving:
          </span>
          <RoleBadge icon={<MdPeople size={14} />} label="Students" color="border-green-500/30 bg-green-500/10 text-green-300" />
          <RoleBadge icon={<MdVerifiedUser size={14} />} label="Faculty" color="border-blue-500/30 bg-blue-500/10 text-blue-300" />
          <RoleBadge icon={<MdApproval size={14} />} label="Jr. Assistants" color="border-yellow-500/30 bg-yellow-500/10 text-yellow-300" />
          <RoleBadge icon={<MdDashboard size={14} />} label="Superintendents" color="border-orange-500/30 bg-orange-500/10 text-orange-300" />
          <RoleBadge icon={<MdSecurity size={14} />} label="Asst. Registrar" color="border-purple-500/30 bg-purple-500/10 text-purple-300" />
        </div>
      </section>
      {}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard value="6+" label="Bookable Venues" />
          <StatCard value="5" label="User Roles" />
          <StatCard value="3" label="Approval Levels" />
          <StatCard value="24/7" label="Online Access" />
        </div>
      </section>
      {}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-black text-white md:text-4xl">
            Everything You Need,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
              All in One Place.
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-base text-gray-400">
            A unified platform for every stakeholder in the IIT Ropar venue booking lifecycle.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<MdCalendarMonth size={24} />}
            title="Real-Time Calendar"
            desc="Instantly see which halls are available, occupied, or pending approval — no more phone calls or emails."
          />
          <FeatureCard
            icon={<MdEventAvailable size={24} />}
            title="One-Click Booking"
            desc="Submit booking requests for M1–M6 lecture halls and the Auditorium in seconds from your dashboard."
          />
          <FeatureCard
            icon={<MdApproval size={24} />}
            title="Multi-Level Approvals"
            desc="Automatic routing through Jr. Assistant → Superintendent → AR. Everyone sees only what's relevant."
          />
          <FeatureCard
            icon={<MdPeople size={24} />}
            title="Role-Based Dashboards"
            desc="Personalized views for all five roles — students, faculty, and all three admin levels."
          />
          <FeatureCard
            icon={<MdSpeed size={24} />}
            title="Live Status Tracking"
            desc="Track your request from Pending to Approved or Rejected in real time. No more chasing approvals."
          />
          <FeatureCard
            icon={<MdSecurity size={24} />}
            title="Secure JWT Auth"
            desc="Industry-standard JWT authentication with unique access codes for Faculty and Students."
          />
          <FeatureCard
            icon={<MdMeetingRoom size={24} />}
            title="Venue Directory"
            desc="Browse all halls with capacity, projector availability, AC, and current booking status at a glance."
          />
          <FeatureCard
            icon={<MdVerifiedUser size={24} />}
            title="Admin Verification"
            desc="Faculty and Student accounts are manually verified before activation — ensuring data integrity."
          />
          <FeatureCard
            icon={<MdDashboard size={24} />}
            title="Executive Dashboard"
            desc="Superintendents and AR get a bird's-eye view of all pending requests and campus-wide schedules."
          />
        </div>
      </section>
      {}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-600/20 via-indigo-600/10 to-purple-600/10 p-12 text-center backdrop-blur-xl shadow-[0_0_60px_rgba(67,24,255,0.1)]">
          {}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-brand-500 opacity-30 blur-[60px]" />
          <div className="relative">
            <h2 className="mb-4 text-3xl font-black text-white md:text-4xl">
              Ready to book your space?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-base text-gray-300">
              Sign in with your IIT Ropar institutional email to get started in under a minute.
            </p>
            <Link
              to="/auth/sign-in"
              className="group inline-flex items-center gap-3 rounded-2xl bg-brand-500 px-12 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(67,24,255,0.5)] transition-all hover:bg-brand-400 hover:-translate-y-1 hover:shadow-[0_0_50px_rgba(67,24,255,0.7)]"
            >
              Enter to Login
              <MdArrowForward size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
      {}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/iit_ropar_logo.png" alt="IIT Ropar" className="h-7 w-7 rounded bg-white object-contain p-0.5" />
          <span className="text-sm font-bold text-gray-400">
            IITR HallSync — Indian Institute of Technology Ropar
          </span>
        </div>
        <p className="text-xs text-gray-600">
          Developed by CSE Students, IIT Ropar · 2025–26
        </p>
      </footer>
    </div>
  );
}