import React, { useState, useEffect } from "react";
import { fetchAllBookings, updateWorkflowStatus } from "../../services/api";
import { 
  MdCheckCircle, MdCancel, MdLocationOn, MdAccessTime, 
  MdEvent, MdPerson, MdClose, MdOutlineLibraryAddCheck, MdQrCode2,
  MdCalendarMonth, MdCorporateFare, MdOutlineArrowForward
} from "react-icons/md";
import QRCode from "react-qr-code";
export default function ExecutiveApprovals({ role }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const currentUserRole = (role || "superintendent").toLowerCase();
  const stageColor = (s) => {
    if (s === "approved") return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]";
    if (s === "rejected") return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
    if (s === "changes_requested") return "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] animate-pulse";
    return "bg-gray-200 dark:bg-navy-700";
  };
  const trackerStages = [
    { key: "faculty", label: "Faculty" },
    { key: "jrAssistant", label: "Jr. Assistant" },
    { key: "superintendent", label: "Superintendent" },
    { key: "ar", label: "Dean / AR" }
  ];
  const loadBookings = async () => {
    setLoading(true);
    try {
      const dbData = await fetchAllBookings();
      const roleBookings = dbData.filter(b => {
        if (currentUserRole === "superintendent") {
          return b.tracker?.jrAssistant === 'approved';
        } else if (currentUserRole === "ar") {
          return b.tracker?.superintendent === 'approved';
        }
        return true;
      });
      const formatted = roleBookings.map(b => {
        const displaySlot = b.allocatedSlot || (b.priorities && b.priorities[0]) || {};
        return {
          ...b,
          id: b._id,
          title: b.activityType,
          venue: displaySlot.venueName || "TBD",
          date: displaySlot.date || "",
          timeDisplay: `${displaySlot.startTime || ""} - ${displaySlot.endTime || ""}`,
          organizer:  b.requester?.name    || "Student",
          entryNo:    b.requester?.entryNo  || "—",
          email:      b.requester?.email    || "—",
          department: b.requester?.department || "—",
          club: b.clubName || "—",
          audience: b.audienceCount || "—",
          purpose: b.purpose || "—",
        };
      });
      setBookings(formatted);
    } catch (e) {
      console.error("Failed to load exec bookings:", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadBookings();
  }, [currentUserRole]);
  const handleSelect = (e, id) => {
    e.stopPropagation();
    if (selectedCards.includes(id)) setSelectedCards(selectedCards.filter(c => c !== id));
    else setSelectedCards([...selectedCards, id]);
  };
  const handleOpen = (req) => {
    setActiveRequest(req);
    setActiveTab("Details");
    setDecision("");
    setComment("");
  };
  const handleSignOff = async () => {
    if (!activeRequest || !decision) return;
    try {
      await updateWorkflowStatus(
        activeRequest.id,
        currentUserRole,
        decision === "approve" ? "approved" : "rejected",
        comment
      );
      await loadBookings();
      setActiveRequest(null);
      setDecision("");
      setComment("");
    } catch (error) {
      console.error("Failed to sign off:", error);
      alert("Error processing decision.");
    }
  };
  const fmtDate = (d) => {
    if (!d) return "TBD";
    const parsed = new Date(d);
    return isNaN(parsed) ? d : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  if (loading) {
     return <div className="p-8 text-center text-gray-500 font-bold">Loading requests...</div>;
  }
  const todayStr = new Date().toISOString().split('T')[0];
  const displayed = bookings.filter(b => {
    const isPastDate = b.date && b.date < todayStr;
    if (filterDate) {
      if (b.date !== filterDate) return false;
      if (filterDate < todayStr && b.status !== "Approved") return false;
    } else {
      if (isPastDate) return false;
    }
    if (filterStatus === "approved" && b.status !== "Approved") return false;
    if (filterStatus === "rejected" && b.status !== "Rejected") return false;
    if (filterStatus === "pending" && (b.status === "Approved" || b.status === "Rejected")) return false;
    return true;
  });
  return (
    <div className="mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-navy-900 p-2 lg:p-4">
      {}
      <div className="mb-6 flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-2">
           <span className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">Current Role:</span>
           <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-bold uppercase tracking-widest">{currentUserRole}</span>
        </div>
        <div className="flex-1"></div>
        <input 
          type="date" 
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white" 
        />
        <select 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {(filterDate || filterStatus !== "all") && (
          <button onClick={() => { setFilterDate(""); setFilterStatus("all"); }} className="rounded-xl px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
            Clear
          </button>
        )}
      </div>
      {selectedCards.length > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-navy-700 px-6 py-4 text-white shadow-lg dark:bg-navy-800 border border-navy-600">
          <div className="font-bold flex items-center gap-2"><MdOutlineLibraryAddCheck size={20}/> {selectedCards.length} Selected</div>
          <div className="flex gap-3">
            <button className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold hover:bg-red-600 transition-all shadow-md">Reject All</button>
            <button className="rounded-lg bg-green-500 px-4 py-2 text-xs font-bold hover:bg-green-600 transition-all shadow-md">Approve All</button>
          </div>
        </div>
      )}
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayed.length === 0 ? (
           <div className="col-span-full py-12 text-center text-gray-400 font-bold">No requests found.</div>
        ) : displayed.map((req) => {
          const tracker = req.tracker || { faculty: "pending", jrAssistant: "pending", superintendent: "pending", ar: "pending" };
          return (
            <div 
              key={req.id}
              onClick={() => handleOpen(req)}
              className="group relative flex cursor-pointer flex-col rounded-[18px] bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(99,102,241,0.18)] active:scale-[0.98] dark:bg-navy-800 dark:border-navy-700 overflow-hidden"
            >
              {}
              <div className="absolute top-0 left-0 w-1.5 h-full flex flex-col z-10 rounded-l-[18px] overflow-hidden">
                <div className={`w-full h-1/2 transition-all duration-500 ${stageColor(tracker.faculty)}`} title="Faculty" />
                <div className={`w-full h-1/2 border-t border-white/10 transition-all duration-500 ${stageColor(tracker.jrAssistant)}`} title="Jr. Assistant" />
              </div>
              <div className="absolute bottom-0 left-1.5 w-[calc(100%-6px)] h-1.5 flex z-10 rounded-br-[18px] overflow-hidden">
                <div className={`w-1/2 h-full transition-all duration-500 ${stageColor(tracker.superintendent)}`} title="Superintendent" />
                <div className={`w-1/2 h-full border-l border-white/10 transition-all duration-500 ${stageColor(tracker.ar)}`} title="Dean / AR" />
              </div>
              {}
              <div className="absolute top-4 right-4 z-20" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedCards.includes(req.id)}
                  onChange={(e) => handleSelect(e, req.id)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-500 cursor-pointer shadow-sm"
                />
              </div>
              {}
              <div className="pl-4 pr-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-2 mb-1 pr-8">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold tracking-wide text-navy-700 dark:text-white truncate leading-snug">
                      {req.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  <span className="inline-flex items-center gap-1"><MdCorporateFare size={11} /> {req.club || "—"}</span>
                  <span className="ml-2 text-brand-400">· {req.organizer}</span>
                </p>
                {}
                <div className="rounded-xl bg-gray-50 dark:bg-navy-900/60 border border-gray-100 dark:border-navy-700 p-3 space-y-1.5 mb-3">
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">Booking Slot</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-700 dark:text-gray-200">
                    <MdLocationOn size={12} className="text-brand-500 flex-shrink-0" />
                    <span className="font-bold">{req.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <MdCalendarMonth size={12} className="flex-shrink-0" />
                    <span>{fmtDate(req.date)}</span>
                    <span className="mx-1">·</span>
                    <MdAccessTime size={12} className="flex-shrink-0" />
                    <span>{req.timeDisplay}</span>
                  </div>
                </div>
                {}
                <div className="flex items-center gap-1.5 mb-3">
                  {trackerStages.map(({ key, label }) => (
                    <div key={key} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className={`h-1.5 w-full rounded-full ${stageColor(tracker[key])}`} title={label} />
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate w-full text-center">{label.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
                {}
                <div className="pt-2.5 border-t border-dashed border-gray-100 dark:border-navy-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center text-xs font-bold text-brand-500">
                  View Details & Approve <MdOutlineArrowForward size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/60 backdrop-blur-sm transition-opacity duration-300 p-4 ${activeRequest ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className={`relative w-full max-w-3xl overflow-hidden rounded-[24px] bg-white shadow-2xl transition-transform duration-300 dark:bg-navy-800 ${activeRequest ? "scale-100" : "scale-95"}`}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-navy-700 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-navy-800 dark:to-brand-900/20">
            <div>
               <h2 className="text-2xl font-black text-navy-700 dark:text-white">Authorization Required</h2>
               <p className="text-xs text-brand-500 font-bold uppercase tracking-widest mt-1">Role: {currentUserRole}</p>
            </div>
            <button onClick={() => setActiveRequest(null)} className="rounded-full p-2 bg-white/50 text-gray-500 hover:bg-white dark:bg-navy-900 dark:hover:bg-navy-700 shadow-sm transition-all duration-200">
              <MdClose size={20} />
            </button>
          </div>
          <div className="flex border-b border-gray-100 px-6 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900/30">
            {["Details", "Tracker", "E-Ticket", "Decision"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mr-8 py-4 text-sm font-bold transition-all relative ${activeTab === tab ? "text-brand-500" : "text-gray-400 hover:text-navy-700 dark:hover:text-white"}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-500 rounded-t-full"></div>}
              </button>
            ))}
          </div>
          <div className="p-8 h-[50vh] overflow-y-auto bg-white dark:bg-navy-800">
            {activeTab === "Details" && (
              <div className="animate-fade-in space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-navy-900 dark:to-navy-800 p-5 shadow-sm border border-brand-100 dark:border-navy-700">
                  <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MdPerson size={12} /> Requester Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-[10px] font-bold uppercase text-gray-400">Name</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{activeRequest?.organizer}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-gray-400">Entry No.</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{activeRequest?.entryNo}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-gray-400">Department</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{activeRequest?.department}</p></div>
                    <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Email</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-xs break-all">{activeRequest?.email}</p></div>
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                  <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MdEvent size={12} /> Event Logistics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Club</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{activeRequest?.club}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-gray-400">Activity</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{activeRequest?.title}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-gray-400">Audience</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{activeRequest?.audience ?? "—"} people</p></div>
                    <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Purpose</p><p className="font-medium text-navy-700 dark:text-gray-300 text-sm mt-0.5">{activeRequest?.purpose || "—"}</p></div>
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                  <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <MdLocationOn size={12} /> Venue & Schedule
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Venue</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{activeRequest?.venue}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-gray-400">Date</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{fmtDate(activeRequest?.date)}</p></div>
                    <div><p className="text-[10px] font-bold uppercase text-gray-400">Time</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{activeRequest?.timeDisplay}</p></div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "Tracker" && (
              <div className="relative pl-4 pt-2 pb-10">
                <div className="absolute left-[23px] top-6 bottom-4 border-l-2 border-dashed border-brand-300/40 dark:border-brand-500/20" />
                <div className="flex flex-col gap-7">
                  {}
                  <div className="relative flex items-start gap-4">
                    <div className="z-10 mt-1 h-4 w-4 rounded-full border-4 border-white dark:border-navy-800 bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" />
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-navy-700 dark:text-white text-sm">Student Submission</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 font-bold uppercase">Done</span>
                      </div>
                    </div>
                  </div>
                  {}
                  {trackerStages.map(({ key, label }) => {
                    const s = activeRequest?.tracker?.[key] || "pending";
                    const dotColor = s === "approved" ? "bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]"
                      : s === "changes_requested" ? "bg-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.2)] animate-pulse"
                      : s === "rejected" ? "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
                      : "bg-gray-300 dark:bg-gray-600";
                    const badgeCfg = { approved: "bg-green-500/15 text-green-500", changes_requested: "bg-orange-500/15 text-orange-500 animate-pulse", rejected: "bg-red-500/15 text-red-500", pending: "bg-gray-200 text-gray-400 dark:bg-navy-700" };
                    const badgeLabel = { approved: "Approved", changes_requested: "Action Required", rejected: "Rejected", pending: "Pending" };
                    return (
                      <div key={key} className={`relative flex items-start gap-4 transition-opacity ${s === "pending" ? "opacity-40" : ""}`}>
                        <div className={`z-10 mt-1 h-4 w-4 rounded-full border-4 border-white dark:border-navy-800 ${dotColor}`} />
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-navy-700 dark:text-white text-sm">{label}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeCfg[s] || badgeCfg.pending}`}>
                              {badgeLabel[s] || "Pending"}
                            </span>
                          </div>
                          {}
                          {activeRequest?.comments?.[`${key}Comment`] && (
                            <div className="mt-4 rounded-xl bg-gray-50 dark:bg-navy-800/60 p-3 border border-gray-100 dark:border-navy-700">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Note:</p>
                              <p className="text-sm font-medium text-navy-700 dark:text-gray-200 italic">"{activeRequest.comments[`${key}Comment`]}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {}
            {activeTab === "E-Ticket" && (
                <div className="py-2 animate-fade-in flex justify-center h-full items-center">
                    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200 dark:bg-navy-900 dark:border-navy-700">
                      <div className="bg-gradient-to-r from-brand-500 to-indigo-600 py-4 text-center">
                        <h3 className="text-sm font-black tracking-widest text-white">IITR SYNC</h3>
                        <p className="text-[10px] text-white/70 mt-0.5 uppercase tracking-widest">E-Ticket Preview</p>
                      </div>
                      <div className="border-b-2 border-dashed border-gray-200 p-5 text-center dark:border-navy-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Booking Title</p>
                        <p className="text-lg font-black text-navy-700 dark:text-white mt-1 ">{activeRequest?.title}</p>
                      </div>
                      <div className="p-5 flex justify-center">
                        <div className="p-3 border border-gray-100 rounded-xl bg-white dark:bg-white shadow-sm flex flex-col items-center justify-center opacity-40">
                          <MdQrCode2 className="h-24 w-24 text-navy-900" />
                          <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-2 uppercase">Pending AR</p>
                        </div>
                      </div>
                    </div>
                </div>
            )}
            {activeTab === "Decision" && (
              <div className="animate-fade-in py-2">
                {(activeRequest?.tracker?.[currentUserRole] === "approved" || activeRequest?.status === "Approved") ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 dark:bg-navy-900/50 dark:border-navy-700">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4 dark:bg-green-500/20">
                      <MdCheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-black text-navy-700 dark:text-white">Decision Locked</h3>
                    <p className="text-sm font-medium text-gray-500 text-center mt-2 px-8">This request has already been approved and cannot be altered.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-6 mb-8 mt-4">
                      <label className={`flex-1 cursor-pointer rounded-2xl border-2 p-6 text-center transition-all ${decision === 'approve' ? 'border-green-500 bg-green-50 shadow-[0_8px_30px_rgba(34,197,94,0.15)] dark:bg-green-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-navy-700'}`}>
                        <input type="radio" name="exec_decision" className="hidden" onChange={() => setDecision('approve')} />
                        <MdCheckCircle className={`mx-auto mb-3 h-8 w-8 transition-transform ${decision === 'approve' ? 'text-green-500 scale-110' : 'text-gray-300 dark:text-gray-600'}`} />
                        <span className={`text-lg font-black tracking-tight ${decision === 'approve' ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>Approve</span>
                      </label>
                      <label className={`flex-1 cursor-pointer rounded-2xl border-2 p-6 text-center transition-all ${decision === 'reject' ? 'border-red-500 bg-red-50 shadow-[0_8px_30px_rgba(239,68,68,0.15)] dark:bg-red-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-navy-700'}`}>
                        <input type="radio" name="exec_decision" className="hidden" onChange={() => setDecision('reject')} />
                        <MdCancel className={`mx-auto mb-3 h-8 w-8 transition-transform ${decision === 'reject' ? 'text-red-500 scale-110' : 'text-gray-300 dark:text-gray-600'}`} />
                        <span className={`text-lg font-black tracking-tight ${decision === 'reject' ? 'text-red-700 dark:text-red-400' : 'text-gray-500'}`}>Reject</span>
                      </label>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-400 mb-2 block">Official Remarks (Optional unless Rejecting)</label>
                      <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white transition-all shadow-inner" placeholder="Add any final administrative notes here..."></textarea>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="p-6 border-t border-gray-100 bg-gray-50 dark:bg-navy-900/50 dark:border-navy-700 flex justify-end">
             {activeTab !== "Decision" ? (
                <button 
                  onClick={() => setActiveTab("Decision")}
                  className="px-8 py-3 rounded-xl font-bold bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-all dark:bg-brand-400 dark:hover:bg-brand-500"
                >
                  Go To Decision
                </button>
             ) : (
                !(activeRequest?.tracker?.[currentUserRole] === "approved" || activeRequest?.status === "Approved") && (
                  <button 
                    disabled={!decision}
                    onClick={handleSignOff}
                    className={`px-8 py-3 rounded-xl font-bold transition-all ${decision ? (decision === 'approve' ? 'bg-green-500 shadow-green-500/30 text-white hover:bg-green-600' : 'bg-red-500 shadow-red-500/30 text-white hover:bg-red-600') + ' shadow-lg' : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-navy-700"}`}
                  >
                    Conclude & Sign-Off
                  </button>
                )
             )}
          </div>
        </div>
      </div>
    </div>
  );
}