import React from "react";
import { MdCalendarMonth, MdArrowForward, MdCheckCircle, MdEventAvailable } from "react-icons/md";
import { Link } from "react-router-dom"; 

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1437] font-sans text-white overflow-hidden relative selection:bg-brand-500 selection:text-white">
      
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-500 rounded-full mix-blend-screen filter blur-[150px] opacity-40"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[150px] opacity-30"></div>

      {/* NAVBAR */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white shadow-[0_0_15px_rgba(67,24,255,0.5)]">
            <MdCalendarMonth className="h-7 w-7" />
          </div>
          <span className="text-3xl font-extrabold tracking-wide text-white">
            IITR <span className="text-brand-400">HALLSYNC</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
           {/* Link to dashboard */}
           <Link to="/admin/my-bookings" className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 hover:shadow-lg">
             Sign In
           </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-center px-6 pt-12 pb-24 lg:flex-row lg:pt-24">
        
        {/* Left Side: Copy */}
        <div className="flex w-full flex-col justify-center lg:w-1/2 lg:pr-10 text-center lg:text-left">
          <div className="mb-6 inline-flex items-center justify-center lg:justify-start gap-2 rounded-full bg-brand-500/10 px-4 py-2 text-sm font-bold text-brand-400 border border-brand-500/20 backdrop-blur-md self-center lg:self-start">
            <MdCheckCircle className="h-4 w-4" /> The Official Booking Portal
          </div>
          
          <h1 className="mb-6 text-5xl font-black leading-[1.1] text-white md:text-6xl lg:text-7xl">
            Smart Booking <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
              Made Simple.
            </span>
          </h1>
          
          <p className="mb-10 text-lg text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
            Instantly book lecture halls M1-M6 and the Auditorium. Eliminate conflicts, track requests, and manage approvals all in one sleek dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to="/admin/my-bookings" className="group flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-brand-400 hover:-translate-y-1 shadow-[0_0_20px_rgba(67,24,255,0.4)]">
              Enter Dashboard <MdArrowForward className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right Side: Dashboard Glass Mockup */}
        <div className="mt-20 w-full lg:mt-0 lg:w-1/2 flex justify-center lg:justify-end animate-fade-in-up">
           <div className="relative w-full max-w-lg rounded-[24px] border border-white/10 bg-[#111c44]/80 p-6 shadow-2xl backdrop-blur-xl transform transition-transform hover:scale-[1.02] duration-500">
              
              {/* Mockup Header */}
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                 <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                 </div>
                 <div className="h-5 w-32 rounded-full bg-white/5"></div>
              </div>

              {/* Mockup Grid */}
              <div className="grid grid-cols-2 gap-4">
                 {/* Mini Card 1 */}
                 <div className="rounded-2xl bg-white/5 p-5 border border-white/5">
                    <MdEventAvailable className="mb-4 h-10 w-10 text-green-400" />
                    <div className="h-4 w-20 rounded bg-white/20 mb-3"></div>
                    <div className="h-3 w-12 rounded bg-white/10"></div>
                 </div>
                 {/* Mini Card 2 */}
                 <div className="rounded-2xl bg-white/5 p-5 border border-white/5">
                    <MdCalendarMonth className="mb-4 h-10 w-10 text-brand-400" />
                    <div className="h-4 w-20 rounded bg-white/20 mb-3"></div>
                    <div className="h-3 w-12 rounded bg-white/10"></div>
                 </div>
                 {/* Wide Status Card */}
                 <div className="col-span-2 rounded-2xl bg-gradient-to-br from-brand-500/20 to-indigo-500/20 p-6 border border-brand-500/30">
                    <div className="flex justify-between items-center mb-5">
                       <div className="h-5 w-32 rounded bg-white/20"></div>
                       <div className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400 font-bold border border-green-500/30">Approved</div>
                    </div>
                    <div className="h-3 w-full rounded bg-white/10 mb-3"></div>
                    <div className="h-3 w-3/4 rounded bg-white/10"></div>
                 </div>
              </div>

           </div>
        </div>

      </main>
    </div>
  );
}