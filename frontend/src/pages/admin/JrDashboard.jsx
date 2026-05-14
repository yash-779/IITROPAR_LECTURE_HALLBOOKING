import React, { useState, useEffect } from "react";
import { fetchAllBookings } from "../../services/api";
import { ROOM_CAPACITIES } from "../../variables/constants";
import { 
  MdOutlineAssignment, MdPendingActions, MdCheckCircle, MdCancel, 
  MdWarning, MdTrendingUp, MdTimeline, MdArrowForward
} from "react-icons/md";
export default function JRDashboard() {
  const [bookings, setBookings] = useState([]);
  const [kpis, setKpis] = useState([
    { title: "Pending Approvals", value: 0, trend: "+0%", icon: <MdPendingActions size={24} />, bg: "bg-orange-50", color: "text-orange-500", glow: "shadow-[0_0_20px_rgba(249,115,22,0.15)]" },
    { title: "Processed Today", value: 0, trend: "+0%", icon: <MdCheckCircle size={24} />, bg: "bg-green-50", color: "text-green-500" },
    { title: "Clubs Active", value: 0, trend: "+0%", icon: <MdOutlineAssignment size={24} />, bg: "bg-blue-50", color: "text-blue-500" },
    { title: "Rejected", value: 0, trend: "-0%", icon: <MdCancel size={24} />, bg: "bg-red-50", color: "text-red-500" },
  ]);
  const [tightnessData, setTightnessData] = useState([]);
  const [activeRequestsCount, setActiveRequestsCount] = useState({ submitted: 0, faculty: 0, ar: 0, jr: 0, final: 0 });
  useEffect(() => {
    const load = async () => {
      try {
        const all = await fetchAllBookings();
        setBookings(all);
        const pending = all.filter(b => b.tracker?.jrAssistant === "pending" && b.tracker?.faculty === "approved").length;
        const processedToday = all.filter(b => b.tracker?.jrAssistant !== "pending").length;
        const clubsCount = new Set(all.filter(b => b.clubName).map(b => b.clubName)).size;
        const rejected = all.filter(b => b.status === "Rejected").length;
        setKpis([
          { title: "Pending Approvals", value: pending, trend: "+5%", icon: <MdPendingActions size={24} />, bg: "bg-orange-50", color: "text-orange-500", glow: "shadow-[0_0_20px_rgba(249,115,22,0.15)]" },
          { title: "Processed Overall", value: processedToday, trend: "+2%", icon: <MdCheckCircle size={24} />, bg: "bg-green-50", color: "text-green-500" },
          { title: "Clubs", value: clubsCount, trend: "+1%", icon: <MdOutlineAssignment size={24} />, bg: "bg-blue-50", color: "text-blue-500" },
          { title: "Rejected", value: rejected, trend: "-1%", icon: <MdCancel size={24} />, bg: "bg-red-50", color: "text-red-500" },
        ]);
        setActiveRequestsCount({
            submitted: all.length,
            faculty: all.filter(b => b.tracker?.faculty === "pending").length,
            jr: pending,
            ar: all.filter(b => b.tracker?.ar === "pending" && b.tracker?.superintendent === "approved").length,
            final: all.filter(b => b.status === "Approved").length
        });
        const roomCounts = {};
        all.forEach(b => {
             if (b.allocatedSlot && b.allocatedSlot.venueId) {
                roomCounts[b.allocatedSlot.venueName] = (roomCounts[b.allocatedSlot.venueName] || 0) + 1;
             }
        });
        const tightness = Object.entries(roomCounts)
             .map(([room, count]) => ({ room, load: Math.min(100, count * 20), color: count > 3 ? "bg-red-500" : count > 1 ? "bg-orange-500" : "bg-green-500" }))
             .sort((a,b) => b.load - a.load)
             .slice(0, 4);
        if (tightness.length === 0) {
            tightness.push({ room: "Campus", load: 5, color: "bg-green-500" });
        }
        setTightnessData(tightness);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);
  return (
    <div className="mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">
      {}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-500">
          System Overview • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 font-bold text-xs flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          System Efficiency: 82%
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpis.map((kpi, index) => (
          <div key={index} className={`relative flex flex-col rounded-[20px] bg-white/80 backdrop-blur-md p-6 shadow-sm border border-gray-100 dark:bg-navy-800/80 dark:border-navy-700 transition-all hover:-translate-y-1 hover:shadow-lg ${kpi.glow || ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`rounded-full p-3 ${kpi.bg} ${kpi.color}`}>
                {kpi.icon}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{kpi.title}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-black text-navy-700 dark:text-white">{kpi.value}</span>
              <span className={`text-xs font-bold mt-2 flex items-center gap-1 ${kpi.color}`}>
                <MdTrendingUp /> {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {}
        <div className="rounded-[20px] bg-white/80 backdrop-blur-md p-6 shadow-sm border border-gray-100 dark:bg-navy-800/80 dark:border-navy-700">
          <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
            <MdWarning size={18} /> High Priority Alerts
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border-l-4 border-red-500 dark:bg-red-500/10 dark:border-red-500">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">⚠ 3 Conflicts Detected Today</p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Resolve in Approvals Queue</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border-l-4 border-amber-500 dark:bg-amber-500/10 dark:border-amber-500">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">⚠ M2 is 100% Overbooked</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Consider moving events to M4</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border-l-4 border-gray-400 dark:bg-navy-900 dark:border-gray-600">
              <p className="text-sm font-bold text-navy-700 dark:text-white">5 Pending Approvals &gt; 6 Hrs</p>
              <p className="text-xs text-gray-500 mt-1">Waiting on Faculty Endorsement</p>
            </div>
          </div>
        </div>
        {}
        <div className="col-span-1 lg:col-span-2 rounded-[20px] bg-white/80 backdrop-blur-md p-6 shadow-sm border border-gray-100 dark:bg-navy-800/80 dark:border-navy-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-navy-700 dark:text-white flex items-center gap-2">
              <MdTimeline size={18} className="text-brand-500" /> Campus Load Today
            </h3>
            <span className="text-xs font-bold bg-brand-50 text-brand-600 px-3 py-1 rounded-full dark:bg-brand-500/10 dark:text-brand-400">
              Overall: 65% Occupied
            </span>
          </div>
          <div className="space-y-6">
            {tightnessData.map((room, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-navy-700 dark:text-white uppercase tracking-wider">{room.room}</span>
                  <span className={`${room.load >= 90 ? 'text-red-500' : 'text-gray-500'}`}>{room.load}%</span>
                </div>
                {}
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden dark:bg-navy-900">
                  {}
                  <div 
                    className={`${room.color} h-3 rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${room.load}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          {}
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20 flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/40">💡</div>
             <div>
               <p className="text-sm font-bold text-navy-700 dark:text-white">Smart Suggestion</p>
               <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Move incoming afternoon requests from <span className="font-bold text-red-500">M2</span> to <span className="font-bold text-green-500">M3</span> to balance load.</p>
             </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="col-span-1 lg:col-span-2 rounded-[20px] bg-white/80 backdrop-blur-md p-6 shadow-sm border border-gray-100 dark:bg-navy-800/80 dark:border-navy-700">
          <h3 className="text-sm font-black uppercase tracking-widest text-navy-700 dark:text-white mb-8">Request Pipeline Flow</h3>
          <div className="flex items-center justify-between px-2 overflow-x-auto pb-4">
            {[
              { step: "Submitted", count: activeRequestsCount.submitted, active: true },
              { step: "Faculty", count: activeRequestsCount.faculty, active: true },
              { step: "JR Assist", count: activeRequestsCount.jr, active: true, glow: true },
              { step: "AR", count: activeRequestsCount.ar, active: true },
              { step: "Final", count: activeRequestsCount.final, active: false }
            ].map((node, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-3 min-w-[80px]">
                  <div className={`h-12 w-12 rounded-full border-4 flex items-center justify-center font-black text-lg transition-all ${node.glow ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-[0_0_20px_rgba(67,24,255,0.3)] dark:bg-brand-500/20 dark:text-brand-400 animate-bounce' : node.active ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-navy-700 dark:bg-navy-900'}`}>
                    {node.count}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${node.glow ? 'text-brand-500 dark:text-brand-400' : 'text-gray-500'}`}>{node.step}</span>
                </div>
                {i < 4 && <MdArrowForward className="text-gray-300 dark:text-gray-600 flex-shrink-0" size={24} />}
              </React.Fragment>
            ))}
          </div>
        </div>
        {}
        <div className="rounded-[20px] bg-white/80 backdrop-blur-md p-6 shadow-sm border border-gray-100 dark:bg-navy-800/80 dark:border-navy-700">
          <h3 className="text-sm font-black uppercase tracking-widest text-navy-700 dark:text-white mb-6">Live Feed</h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-navy-700 before:to-transparent">
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-green-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 dark:border-navy-800"></div>
              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                <p className="text-xs font-bold text-navy-700 dark:text-white">Coding Workshop Approved</p>
                <p className="text-[10px] font-medium text-gray-500 mt-1">Room M3 • Just now</p>
              </div>
            </div>
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-red-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 dark:border-navy-800"></div>
              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                <p className="text-xs font-bold text-navy-700 dark:text-white">Study Group Rejected</p>
                <p className="text-[10px] font-medium text-gray-500 mt-1">Room M2 • 10 min ago</p>
              </div>
            </div>
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-brand-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 dark:border-navy-800 animate-pulse"></div>
              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                <p className="text-xs font-bold text-navy-700 dark:text-white">New Request: CSE Club</p>
                <p className="text-[10px] font-medium text-gray-500 mt-1">Auditorium • 1 hr ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}