import React, { useState, useEffect } from "react";
import { fetchAllBookings } from "../../services/api";
import { 
  MdPendingActions, MdCheckCircle, MdCancel, MdTimer, 
  MdWarning, MdArrowForward
} from "react-icons/md";

export default function ExecutiveDashboard({ role }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserRole = role || "superintendent";

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAllBookings();
        setBookings(data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Compute Pipeline
  let submitted = 0;
  let facultyAppr = 0;
  let jrAppr = 0;
  let suptAppr = 0;
  let arAppr = 0;

  // Compute stats for current role
  let pendingForRole = 0;
  let approvedByRole = 0;
  let rejectedByRole = 0;

  bookings.forEach(b => {
    submitted++;
    if (b.tracker?.faculty === 'approved') facultyAppr++;
    if (b.tracker?.jrAssistant === 'approved') jrAppr++;
    if (b.tracker?.superintendent === 'approved') suptAppr++;
    if (b.tracker?.ar === 'approved') arAppr++;

    if (currentUserRole === "superintendent") {
        if (b.tracker?.jrAssistant === 'approved' && b.tracker?.superintendent === 'pending' && b.status !== 'Rejected') {
            pendingForRole++;
        }
        if (b.tracker?.superintendent === 'approved') approvedByRole++;
        if (b.tracker?.superintendent === 'rejected') rejectedByRole++;
    } else if (currentUserRole === "ar") {
        if (b.tracker?.superintendent === 'approved' && b.tracker?.ar === 'pending' && b.status !== 'Rejected') {
            pendingForRole++;
        }
        if (b.tracker?.ar === 'approved') approvedByRole++;
        if (b.tracker?.ar === 'rejected') rejectedByRole++;
    }
  });

  const kpis = [
    { title: "Pending My Auth", value: pendingForRole, bg: "bg-amber-50 dark:bg-amber-500/10", color: "text-amber-500", border: "border-amber-100 dark:border-amber-500/20", icon: <MdPendingActions size={24}/> },
    { title: "Total Approved", value: approvedByRole, bg: "bg-green-50 dark:bg-green-500/10", color: "text-green-500", border: "border-green-100 dark:border-green-500/20", icon: <MdCheckCircle size={24}/> },
    { title: "Total Rejected", value: rejectedByRole, bg: "bg-red-50 dark:bg-red-500/10", color: "text-red-500", border: "border-red-100 dark:border-red-500/20", icon: <MdCancel size={24}/> },
    { title: "Avg Resolution", value: "< 24h", bg: "bg-blue-50 dark:bg-blue-500/10", color: "text-blue-500", border: "border-blue-100 dark:border-blue-500/20", icon: <MdTimer size={24}/> }
  ];

  if (loading) {
     return <div className="p-8 text-center text-gray-500 font-bold">Loading dashboard...</div>;
  }

  return (
    <div className="mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-navy-900 p-2 lg:p-4 flex flex-col gap-8">
      
      {/* 1. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <div key={index} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-navy-800 dark:border-navy-700">
            <div className="flex items-start justify-between mb-4">
              <div className={`rounded-xl p-3 border ${kpi.bg} ${kpi.color} ${kpi.border}`}>
                {kpi.icon}
              </div>
            </div>
            <span className="text-4xl font-black tracking-tight text-navy-700 dark:text-white">{kpi.value}</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{kpi.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. SYSTEM PIPELINE & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PIPELINE (Showing funnel drop-off) */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-navy-800 dark:border-navy-700">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">System Approval Pipeline</h3>
             <span className="text-xs font-bold text-brand-500 bg-brand-50 px-2 py-1 rounded-md dark:bg-brand-500/10">Real-time Data</span>
          </div>
          
          <div className="flex items-center justify-between px-2 overflow-x-auto pb-4">
            {[
              { step: "Submitted", count: submitted },
              { step: "Faculty", count: facultyAppr },
              { step: "JR Assist", count: jrAppr },
              { step: "Superintnd", count: suptAppr, highlight: currentUserRole === 'superintendent' },
              { step: "AR (Final)", count: arAppr, highlight: currentUserRole === 'ar' }
            ].map((node, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-3 min-w-[70px]">
                  <div className={`text-2xl font-black ${node.highlight ? 'text-brand-500 dark:text-brand-400' : 'text-navy-700 dark:text-white'}`}>
                    {node.count}
                  </div>
                  <div className={`h-2 w-full rounded-full ${node.highlight ? 'bg-brand-500 shadow-md shadow-brand-500/40' : 'bg-gray-200 dark:bg-navy-700'}`}></div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${node.highlight ? 'text-brand-500 dark:text-brand-400' : 'text-gray-400'}`}>
                    {node.step}
                  </span>
                </div>
                {i < 4 && <MdArrowForward className="text-gray-300 dark:text-gray-600 mb-6" size={20} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ALERTS */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-navy-800 dark:border-navy-700">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Actionable Alerts</h3>
          <div className="space-y-4">
            {pendingForRole > 0 ? (
               <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
                 <MdWarning className="text-red-500 mt-0.5 shrink-0" size={18} />
                 <div>
                   <p className="text-sm font-bold text-red-700 dark:text-red-400 leading-tight">{pendingForRole} requests awaiting signature</p>
                   <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">Please review the approvals queue.</p>
                 </div>
               </div>
            ) : (
               <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-100 dark:bg-green-500/10 dark:border-green-500/20">
                 <MdCheckCircle className="text-green-500 mt-0.5 shrink-0" size={18} />
                 <div>
                   <p className="text-sm font-bold text-green-700 dark:text-green-400 leading-tight">All Caught Up</p>
                   <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">No pending actions required.</p>
                 </div>
               </div>
            )}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20">
              <MdTimer className="text-amber-500 mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400 leading-tight">System Status Optimal</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Workflows processing smoothly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT DECISIONS LOG */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-navy-800 dark:border-navy-700">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Recent Authority Decisions</h3>
        {bookings.filter(b => b.status === "Approved" || b.status === "Rejected").slice(0,3).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bookings.filter(b => b.status === "Approved" || b.status === "Rejected").slice(0,3).map((b, idx) => (
             <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-navy-700 flex justify-between items-center">
               <div>
                 <p className="font-bold text-navy-700 dark:text-white text-sm truncate max-w-[150px]">{b.activityType}</p>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status: {b.status}</p>
               </div>
               {b.status === "Approved" ? <MdCheckCircle className="text-green-500" size={24} /> : <MdCancel className="text-red-500" size={24} />}
             </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 text-sm font-bold p-4">No recent completed decisions</div>
        )}
      </div>

    </div>
  );
}