import React, { useState, useEffect, useCallback } from "react";
import {
  MdOutlineEventNote, MdRefresh, MdCheckCircle, MdCancel, MdPendingActions,
  MdLocationOn, MdCalendarMonth, MdPerson, MdFilterList, MdArrowForward
} from "react-icons/md";
import { fetchStudentFacultyRequests, markRequestsAsSeen } from "../../../services/api";
import FacultyRequestModal from "../../../components/FacultyRequestModal";
const fmtDate = (d) => {
  if (!d) return "—";
  const p = new Date(d + "T00:00:00");
  return isNaN(p) ? d : p.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const sConfig = (status) => {
  if (status === "booked")   return { bg: "bg-green-500/10",  border: "border-green-500/20",  text: "text-green-400",  dot: "bg-green-500",              label: "Room Booked" };
  if (status === "rejected") return { bg: "bg-red-500/10",    border: "border-red-500/20",    text: "text-red-400",    dot: "bg-red-500",                label: "Declined" };
  return                          { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", dot: "bg-violet-500 animate-pulse", label: "Awaiting Action" };
};
export default function StudentFacultyRequests() {
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReq, setSelectedReq]   = useState(null);
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const studentId = user._id || user.id;
  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await fetchStudentFacultyRequests(studentId);
      setRequests(data || []);
      await markRequestsAsSeen(studentId);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [studentId]);
  useEffect(() => { load(); }, [load]);
  const handleRespond = (updated) => {
    setRequests(prev => prev.map(r => r._id === updated._id ? updated : r));
  };
  const filtered = requests.filter(r => filterStatus === "all" || r.status === filterStatus);
  const pendingCount = requests.filter(r => r.status === "pending").length;
  return (
    <div className="relative mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">
      {}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-2xl font-extrabold text-navy-700 dark:text-white flex items-center gap-3">
            Faculty Booking Requests
            {pendingCount > 0 && (
              <span className="text-sm font-black bg-violet-500 text-white rounded-full px-2.5 py-0.5 animate-pulse">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Private room requests from your faculty members — tap any card to respond</p>
        </div>
        <div className="flex items-center gap-2">
          <MdFilterList size={16} className="text-brand-500" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="booked">Booked</option>
            <option value="rejected">Declined</option>
          </select>
          <button onClick={load} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors" title="Refresh">
            <MdRefresh size={20} />
          </button>
        </div>
      </div>
      {}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Total",   value: requests.length, color: "text-brand-400",  bg: "bg-brand-500/10" },
          { label: "Pending", value: pendingCount,    color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Booked",  value: requests.filter(r => r.status === "booked").length, color: "text-green-400", bg: "bg-green-500/10" }
        ].map(s => (
          <div key={s.label} className={`rounded-2xl ${s.bg} border border-white/5 p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm font-bold">Loading requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-[20px] border-2 border-dashed border-gray-200 dark:border-navy-700">
          <MdOutlineEventNote className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">No requests found</h3>
          <p className="text-sm text-gray-500 mt-1">Faculty booking requests for private discussions will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(req => {
            const sc = sConfig(req.status);
            const faculty = req.faculty || {};
            const isNew = !req.seenByStudent && req.status === "pending";
            return (
              <div
                key={req._id}
                onClick={() => setSelectedReq(req)}
                className={`relative rounded-2xl border ${sc.border} ${sc.bg} p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 ${isNew ? "ring-2 ring-violet-500/40" : ""}`}
              >
                {isNew && (
                  <div className="absolute -top-2 -right-2 bg-violet-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 shadow-lg">
                    New
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${sc.dot}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${sc.text}`}>{sc.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{fmtDate(req.createdAt)}</span>
                </div>
                <h3 className="font-extrabold text-navy-700 dark:text-white text-base leading-tight mb-1">
                  {req.activityType === "Other" ? req.activityOther || "Special Request" : req.activityType}
                </h3>
                <p className="text-xs text-gray-500 mb-4">{req.clubName}</p>
                <div className="rounded-xl bg-white/60 dark:bg-navy-800/60 p-3 mb-3 flex items-center gap-3 border border-white/20 dark:border-navy-700/50">
                  <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <MdPerson size={16} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-700 dark:text-white truncate">{faculty.name || "Faculty"}</p>
                    <p className="text-[10px] text-gray-400 truncate">{faculty.facultyRole || faculty.email || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1"><MdLocationOn size={12} className="text-brand-500" />{req.venueName || req.venueId}</div>
                  <div className="flex items-center gap-1"><MdCalendarMonth size={12} className="text-violet-500" />{fmtDate(req.date)}</div>
                </div>
                {req.status === "pending" && (
                  <div className="flex items-center justify-between rounded-xl bg-violet-500/10 border border-violet-500/20 p-2.5">
                    <p className="text-xs font-bold text-violet-500">Tap to view &amp; respond</p>
                    <MdArrowForward size={16} className="text-violet-500" />
                  </div>
                )}
                {req.status === "booked" && (
                  <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-2.5">
                    <MdCheckCircle size={14} className="text-green-500" />
                    <p className="text-xs font-bold text-green-500">Room booked successfully</p>
                  </div>
                )}
                {req.status === "rejected" && (
                  <div className="rounded-xl bg-gray-500/10 border border-gray-500/20 p-2.5">
                    <p className="text-xs font-bold text-gray-400">You declined this request</p>
                    {req.rejectionReason && (
                      <p className="text-[10px] text-gray-500 mt-0.5 italic">"{req.rejectionReason}"</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {selectedReq && (
        <FacultyRequestModal
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
          onRespond={handleRespond}
        />
      )}
    </div>
  );
}
