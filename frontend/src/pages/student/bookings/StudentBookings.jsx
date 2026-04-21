import React, { useState, useEffect } from "react";
import { fetchAllBookings, resubmitBooking } from "../../../services/api";
import { 
  MdEvent, MdAccessTime, MdLocationOn, MdPerson, MdQrCode2, 
  MdClose, MdFilterList, MdAddCircleOutline, MdCalendarMonth, 
  MdOutlineArrowForward, MdInfoOutline, MdUpdate, MdCorporateFare,
  MdCheckCircle, MdPendingActions
} from "react-icons/md";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";

export default function StudentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    try {
      const dbData = await fetchAllBookings();
      const formatted = dbData.map(b => {
        const displaySlot = b.allocatedSlot || (b.priorities && b.priorities[0]) || {};
        return {
          ...b,
          id: b._id,
          date: displaySlot.date || "",
          startTime: displaySlot.startTime || "",
          endTime: displaySlot.endTime || "",
          venueName: displaySlot.venueName || "TBD",
          studentName: b.requester?.name || "Student",
          entryNo: b.requester?.entryNo || "N/A",
          mobile: "Pending",
          faculty: b.facultyInCharge?.name || "Pending Faculty",
          tracker: b.tracker || { faculty: "pending", jrAssistant: "pending", superintendent: "pending", ar: "pending" }
        };
      });
      setBookings(formatted);
    } catch (e) {
      console.error("Error loading bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleResubmit = async () => {
    if (!newDate || !newStartTime || !newEndTime) return alert("Please select a valid time slot from the proposed options.");
    try {
      await resubmitBooking(selectedBooking.id, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime
      });
      await loadBookings();
      setIsOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to resubmit request.");
    }
  };

  const handleCardClick = (booking) => {
    setSelectedBooking(booking);
    setIsOpen(true);
    setActiveTab("Details");
    setNewDate(booking.date);
    setNewStartTime(booking.startTime);
    setNewEndTime(booking.endTime);
  };

  const displayed = bookings.filter(b => {
    const matchStatus = filterStatus === "all" || (b.status || "Pending").toLowerCase() === filterStatus.toLowerCase();
    const matchDate = !filterDate || b.date === filterDate;
    return matchStatus && matchDate;
  });

  const upcomingBooking = bookings.find(b => b.status === "Approved");

  // ── Helpers ──────────────────────────────────────────────
  const statusCfg = (status) => {
    switch (status) {
      case "Approved":      return { bg: "bg-green-500/15", color: "text-green-400", dot: "bg-green-500", label: "Approved" };
      case "Rejected":      return { bg: "bg-red-500/15",   color: "text-red-400",   dot: "bg-red-500",   label: "Rejected" };
      case "Action Required": return { bg: "bg-orange-500/15", color: "text-orange-400", dot: "bg-orange-500", label: "Action Required", pulse: true };
      default:              return { bg: "bg-gray-500/15",  color: "text-gray-400",  dot: "bg-gray-400",  label: "Pending" };
    }
  };

  const stageColor = (s) => {
    if (s === "approved") return "bg-green-500";
    if (s === "changes_requested") return "bg-orange-500";
    if (s === "rejected") return "bg-red-500";
    return "bg-gray-200 dark:bg-navy-700";
  };

  const fmtDate = (d) => {
    if (!d) return "TBD";
    const parsed = new Date(d);
    return isNaN(parsed) ? d : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const fmtTime = (t) => {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  const trackerStages = [
    { key: "faculty", label: "Faculty" },
    { key: "jrAssistant", label: "Jr. Assistant" },
    { key: "superintendent", label: "Superintendent" },
    { key: "ar", label: "Dean / AR" },
  ];

  if (loading) {
    return (
      <div className="mt-20 flex flex-col items-center justify-center gap-3 text-gray-400">
        <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-sm font-bold">Connecting to Database…</p>
      </div>
    );
  }

  return (
    <div className="mt-5 w-full min-h-[80vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">

      {/* UPCOMING BANNER */}
      {upcomingBooking && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 p-5 text-white shadow-lg shadow-brand-500/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2 flex items-center gap-1.5">
            <MdCheckCircle size={14} /> Upcoming Confirmed Booking
          </p>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">{upcomingBooking.activityType}</h3>
              <p className="text-white/80 mt-0.5 flex items-center gap-2 text-xs font-medium">
                <MdEvent size={13} /> {fmtDate(upcomingBooking.date)} • {fmtTime(upcomingBooking.startTime)}
              </p>
            </div>
            <div className="rounded-xl bg-white/20 backdrop-blur-md px-4 py-2 flex items-center gap-2 border border-white/10 text-sm font-bold">
              <MdLocationOn size={15} /> {upcomingBooking.venueName}
            </div>
          </div>
        </div>
      )}

      {/* FILTER ROW */}
      <div className="mb-6 flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-1.5 text-brand-500 font-bold text-sm">
          <MdFilterList size={18} /> Filters
        </div>
        <div className="relative flex items-center">
          <MdCalendarMonth className="absolute left-3 text-gray-400 pointer-events-none" size={14} />
          <input
            type="date" value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />
        </div>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Action Required">Action Required</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        {(filterDate || filterStatus !== "all") && (
          <button
            onClick={() => { setFilterDate(""); setFilterStatus("all"); }}
            className="rounded-xl px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs font-bold text-gray-400">{displayed.length} booking{displayed.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── BOOKINGS GRID ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {displayed.map(booking => {
          const cfg = statusCfg(booking.status);
          return (
            <div
              key={booking.id}
              onClick={() => handleCardClick(booking)}
              className="group relative flex cursor-pointer flex-col rounded-[18px] bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(99,102,241,0.18)] active:scale-[0.98] dark:bg-navy-800 dark:border-navy-700 overflow-hidden"
            >
              {/* ── L-shaped approval progress indicator ── */}
              <div className="absolute top-0 left-0 w-1.5 h-full flex flex-col z-10 rounded-l-[18px] overflow-hidden">
                <div className={`w-full h-1/2 transition-all duration-500 ${stageColor(booking.tracker.faculty)}`} title="Faculty" />
                <div className={`w-full h-1/2 border-t border-white/10 transition-all duration-500 ${stageColor(booking.tracker.jrAssistant)}`} title="Jr. Assistant" />
              </div>
              <div className="absolute bottom-0 left-1.5 w-[calc(100%-6px)] h-1.5 flex z-10 rounded-br-[18px] overflow-hidden">
                <div className={`w-1/2 h-full transition-all duration-500 ${stageColor(booking.tracker.superintendent)}`} title="Superintendent" />
                <div className={`w-1/2 h-full border-l border-white/10 transition-all duration-500 ${stageColor(booking.tracker.ar)}`} title="Dean / AR" />
              </div>

              {/* ── Card body ── */}
              <div className="pl-4 pr-5 pt-5 pb-4">
                {/* Title + status badge */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold tracking-wide text-navy-700 dark:text-white truncate leading-snug">
                      {booking.activityType}
                    </h3>
                    {booking.priorities?.length > 1 && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        {booking.priorities.length} priorities requested
                      </p>
                    )}
                  </div>
                </div>

                {/* Club + faculty sub-line */}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  <span className="inline-flex items-center gap-1"><MdCorporateFare size={11} /> {booking.clubName || "—"}</span>
                  {booking.faculty && booking.faculty !== "Pending Faculty" && (
                    <span className="ml-2 text-brand-400">· {booking.faculty}</span>
                  )}
                </p>

                {/* Slot details block */}
                <div className="rounded-xl bg-gray-50 dark:bg-navy-900/60 border border-gray-100 dark:border-navy-700 p-3 space-y-1.5 mb-3">
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">Booking Slot</p>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-navy-700 dark:text-gray-200">
                    <MdLocationOn size={12} className="text-brand-500 flex-shrink-0" />
                    <span className="font-bold">{booking.venueName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <MdCalendarMonth size={12} className="flex-shrink-0" />
                    <span>{fmtDate(booking.date)}</span>
                    <span className="mx-1">·</span>
                    <MdAccessTime size={12} className="flex-shrink-0" />
                    <span>{fmtTime(booking.startTime)} – {fmtTime(booking.endTime)}</span>
                  </div>
                </div>

                {/* Tracker mini-dots */}
                <div className="flex items-center gap-1.5 mb-3">
                  {trackerStages.map(({ key, label }) => (
                    <div key={key} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className={`h-1.5 w-full rounded-full ${stageColor(booking.tracker[key])}`} title={label} />
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate w-full text-center">{label.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>

                {/* Hover CTA */}
                <div className="pt-2.5 border-t border-dashed border-gray-100 dark:border-navy-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center text-xs font-bold text-brand-500">
                  View Details <MdOutlineArrowForward size={14} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {displayed.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-gray-200 dark:border-navy-700">
            <div className="p-4 rounded-full bg-gray-100 dark:bg-navy-700 mb-4">
              <MdEvent className="h-9 w-9 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">No bookings found</h3>
            <p className="text-sm text-gray-500 mb-6 mt-1">Adjust your filters or book a new room.</p>
            <Link to="/admin/book-room" className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20">
              <MdAddCircleOutline size={18} /> Book a Room
            </Link>
          </div>
        )}
      </div>

      {/* ━━━━━ DRAWER ━━━━━ */}
      <div
        className={`fixed inset-0 z-[100] bg-navy-900/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`fixed right-0 top-0 z-[101] h-full w-full max-w-md bg-white shadow-2xl transition-all duration-500 ease-out dark:bg-navy-800 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {selectedBooking && (
          <>
            {/* Drawer header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-navy-700 bg-gradient-to-r from-brand-500/8 to-indigo-500/8">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`h-2 w-2 rounded-full ${statusCfg(selectedBooking.status).dot}`} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 dark:text-brand-400">
                    ID: {selectedBooking.id}
                  </p>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-navy-700 dark:text-white">{selectedBooking.activityType}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedBooking.clubName}</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-2 bg-gray-100 dark:bg-navy-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors">
                <MdClose className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 dark:border-navy-700">
              {["Details", "Tracker", "E-Ticket"].map(tab => (
                <button
                  key={tab} onClick={() => setActiveTab(tab)}
                  className={`mr-6 py-3.5 text-sm font-bold transition-all relative ${activeTab === tab ? "text-brand-500" : "text-gray-400 hover:text-navy-700 dark:hover:text-white"}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500 rounded-t-full" />}
                </button>
              ))}
            </div>

            {/* Tab bodies */}
            <div className="p-6 h-[calc(100vh-165px)] overflow-y-auto space-y-4">

              {/* ─ DETAILS ─ */}
              {activeTab === "Details" && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                    <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MdPerson size={12} /> Requester Info
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Name</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{selectedBooking.studentName}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Entry No.</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{selectedBooking.entryNo}</p></div>
                      <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Mobile</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{selectedBooking.mobile}</p></div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                    <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MdEvent size={12} /> Event Logistics
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Club</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{selectedBooking.clubName}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Activity</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{selectedBooking.activityType}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Audience</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{selectedBooking.audienceCount ?? "—"} people</p></div>
                      <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Purpose</p><p className="font-medium text-navy-700 dark:text-gray-300 text-sm mt-0.5">{selectedBooking.purpose || "—"}</p></div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                    <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MdLocationOn size={12} /> Venue & Schedule
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Venue</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{selectedBooking.venueName}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Date</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{fmtDate(selectedBooking.date)}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Faculty</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{selectedBooking.faculty}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Start</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{fmtTime(selectedBooking.startTime)}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">End</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{fmtTime(selectedBooking.endTime)}</p></div>
                    </div>
                  </div>

                  {selectedBooking.priorities?.length > 1 && (
                    <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                      <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <MdPendingActions size={12} /> Requested Priorities
                      </h3>
                      <div className="space-y-3">
                        {selectedBooking.priorities.map((priority, index) => (
                          <div key={`${priority.venueId}-${index}`} className="rounded-2xl border border-gray-200 dark:border-navy-700 p-3 bg-white dark:bg-navy-800">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Priority {index + 1}</span>
                              <span className="text-xs font-semibold text-brand-500">{priority.venueName || "Venue"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                              <div>
                                <p className="text-[10px] uppercase text-gray-400">Date</p>
                                <p className="font-bold mt-1">{fmtDate(priority.date)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase text-gray-400">Time</p>
                                <p className="font-bold mt-1">{fmtTime(priority.startTime)} – {fmtTime(priority.endTime)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─ TRACKER ─ */}
              {activeTab === "Tracker" && (
                <div className="relative pl-4 pt-2 pb-10">
                  <div className="absolute left-[23px] top-6 bottom-4 border-l-2 border-dashed border-brand-300/40 dark:border-brand-500/20" />
                  <div className="flex flex-col gap-7">
                    {/* Student (always done) */}
                    <div className="relative flex items-start gap-4">
                      <div className="z-10 mt-1 h-4 w-4 rounded-full border-4 border-white dark:border-navy-800 bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" />
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-navy-700 dark:text-white text-sm">Student Submission</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 font-bold uppercase">Done</span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic stages */}
                    {trackerStages.map(({ key, label }) => {
                      const s = selectedBooking.tracker[key];
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
                            {/* Action Required re-submit form */}
                            {key === "faculty" && s === "changes_requested" && (
                              <div className="mt-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-5 border-2 border-orange-200 dark:bg-gradient-to-br dark:from-orange-500/10 dark:to-amber-500/5 dark:border-orange-500/30 shadow-lg shadow-orange-500/10">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                                  <p className="text-[11px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Faculty Suggested Alternatives</p>
                                </div>

                                {/* Faculty Comment */}
                                {selectedBooking.comments?.facultyComment && (
                                  <div className="mb-4 rounded-xl bg-white/60 dark:bg-navy-800/60 p-3 border border-orange-100 dark:border-orange-500/20">
                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Faculty Note:</p>
                                    <p className="text-sm font-medium text-navy-700 dark:text-gray-200 italic">"{selectedBooking.comments.facultyComment}"</p>
                                  </div>
                                )}

                                {selectedBooking.comments?.jrAssistantComment && (
                                  <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 p-3 border border-red-100 dark:border-red-500/20">
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">JR Assistant Remark:</p>
                                    <p className="text-sm font-medium text-navy-700 dark:text-gray-200 italic">"{selectedBooking.comments.jrAssistantComment}"</p>
                                  </div>
                                )}

                                {/* Proposed Options */}
                                {selectedBooking.proposedChanges && selectedBooking.proposedChanges.length > 0 ? (
                                  <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                      <MdCalendarMonth size={13} className="text-orange-500" />
                                      Pick a Date & Time:
                                    </p>

                                    {/* Date Cards */}
                                    <div className="grid gap-3">
                                      {selectedBooking.proposedChanges.map((proposal, idx) => {
                                        const proposalDate = new Date(proposal.date);
                                        const dayName = proposalDate.toLocaleDateString("en-US", { weekday: "short" });
                                        
                                        return (
                                          <div key={idx} className="rounded-xl bg-white dark:bg-navy-800 border-2 border-gray-200 dark:border-navy-600 overflow-hidden hover:shadow-md transition-all">
                                            {/* Date Header */}
                                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-navy-700 dark:to-navy-600 px-4 py-3 flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-brand-500/10 dark:bg-brand-500/20 px-3 py-2 text-center">
                                                  <p className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider">{dayName}</p>
                                                  <p className="text-sm font-bold text-navy-700 dark:text-white">{fmtDate(proposal.date)}</p>
                                                </div>
                                              </div>
                                              {proposal.timeSlots?.length > 0 && (
                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-navy-700 px-2.5 py-1 rounded-full">
                                                  {proposal.timeSlots.length} option{proposal.timeSlots.length > 1 ? "s" : ""}
                                                </span>
                                              )}
                                            </div>

                                            {/* Time Slots - Custom Selection */}
                                            <div className="px-4 py-3">
                                              {proposal.timeSlots && proposal.timeSlots.length > 0 ? (
                                                <div className="space-y-3">
                                                  {/* Available time range */}
                                                  <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-3 border border-blue-200 dark:border-blue-500/20">
                                                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">Available Time Range</p>
                                                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                      {fmtTime(proposal.timeSlots[0].startTime)} — {fmtTime(proposal.timeSlots[proposal.timeSlots.length - 1].endTime)}
                                                    </p>
                                                  </div>

                                                  {/* Custom time input */}
                                                  {newDate === proposal.date && (
                                                    <div className="space-y-2">
                                                      <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Select Your Time</p>
                                                      <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                          <label className="text-[10px] font-bold text-gray-500 mb-1 block">Start Time</label>
                                                          <input 
                                                            type="time"
                                                            value={newStartTime}
                                                            onChange={(e) => setNewStartTime(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border-2 border-blue-300 bg-blue-50 text-blue-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-300"
                                                          />
                                                        </div>
                                                        <div>
                                                          <label className="text-[10px] font-bold text-gray-500 mb-1 block">End Time</label>
                                                          <input 
                                                            type="time"
                                                            value={newEndTime}
                                                            onChange={(e) => setNewEndTime(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border-2 border-blue-300 bg-blue-50 text-blue-700 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500/20 dark:border-blue-500/50 dark:text-blue-300"
                                                          />
                                                        </div>
                                                      </div>
                                                      {/* Validation message */}
                                                      {newStartTime && newEndTime && (
                                                        (() => {
                                                          const [startH, startM] = newStartTime.split(":").map(Number);
                                                          const [endH, endM] = newEndTime.split(":").map(Number);
                                                          const rangeStart = proposal.timeSlots[0].startTime.split(":").map(Number);
                                                          const rangeEnd = proposal.timeSlots[proposal.timeSlots.length - 1].endTime.split(":").map(Number);
                                                          
                                                          const isValid = (startH > rangeStart[0] || (startH === rangeStart[0] && startM >= rangeStart[1])) &&
                                                                         (endH < rangeEnd[0] || (endH === rangeEnd[0] && endM <= rangeEnd[1])) &&
                                                                         (startH < endH || (startH === endH && startM < endM));
                                                          
                                                          return (
                                                            <p className={`text-[10px] font-bold mt-2 ${isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                                              {isValid ? "✓ Valid time slot" : "⚠ Time outside available range or invalid duration"}
                                                            </p>
                                                          );
                                                        })()
                                                      )}
                                                    </div>
                                                  )}

                                                  {/* Quick select buttons */}
                                                  <div className="space-y-1.5">
                                                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Or pick a suggested slot:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {proposal.timeSlots.map((ts, tsIdx) => {
                                                        const isSelected = newDate === proposal.date && newStartTime === ts.startTime && newEndTime === ts.endTime;
                                                        return (
                                                          <button 
                                                            type="button" 
                                                            key={tsIdx} 
                                                            onClick={() => { 
                                                              setNewDate(proposal.date); 
                                                              setNewStartTime(ts.startTime); 
                                                              setNewEndTime(ts.endTime); 
                                                            }} 
                                                            className={`px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all duration-200 transform hover:scale-105 ${
                                                              isSelected 
                                                                ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:border-brand-400 dark:text-brand-300 shadow-lg shadow-brand-500/20" 
                                                                : "border-gray-300 bg-gray-50 text-gray-700 dark:border-navy-500 dark:bg-navy-700 dark:text-gray-300 hover:border-brand-400 dark:hover:border-brand-500"
                                                            }`}
                                                          >
                                                            {isSelected && <span className="mr-1.5">✓</span>}
                                                            {fmtTime(ts.startTime)} - {fmtTime(ts.endTime)}
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-3 border border-red-200 dark:border-red-500/20">
                                                  <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">⚠️ No available slots</p>
                                                  <p className="text-xs text-red-500 dark:text-red-300 mt-1">Faculty has no free time slots on this date.</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Resubmit Button */}
                                    {newDate && newStartTime && newEndTime && (
                                      <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
                                        <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-2">✓ Selection Confirmed</p>
                                        <p className="text-xs text-green-700 dark:text-green-300 font-semibold mb-3">
                                          {fmtDate(newDate)} • {fmtTime(newStartTime)} - {fmtTime(newEndTime)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="rounded-lg bg-gray-50 dark:bg-navy-800/50 p-4 border border-gray-200 dark:border-navy-700 text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                      No specific times were proposed. Please contact the faculty directly.
                                    </p>
                                  </div>
                                )}

                                {/* Action Button */}
                                <button 
                                  onClick={handleResubmit}
                                  disabled={!newDate || !newStartTime || !newEndTime}
                                  className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all shadow-lg ${
                                    newDate && newStartTime && newEndTime
                                      ? "bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 shadow-orange-500/30 hover:shadow-orange-500/40"
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-navy-700 dark:text-gray-500"
                                  }`}
                                >
                                  <MdUpdate size={18} /> 
                                  {newDate && newStartTime && newEndTime ? "Confirm & Resubmit" : "Select a Time Slot First"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─ E-TICKET ─ */}
              {activeTab === "E-Ticket" && (
                <div className="py-2">
                  {selectedBooking.status === "Approved" ? (
                    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200 dark:bg-navy-900 dark:border-navy-700">
                      <div className="bg-gradient-to-r from-brand-500 to-indigo-600 py-4 text-center">
                        <h3 className="text-sm font-black tracking-widest text-white">IITR SYNC</h3>
                        <p className="text-[10px] text-white/70 mt-0.5 uppercase tracking-widest">Room Booking Ticket</p>
                      </div>
                      <div className="border-b-2 border-dashed border-gray-200 p-5 text-center dark:border-navy-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Booking ID</p>
                        <p className="text-xl font-black text-navy-700 dark:text-white mt-1 font-mono">{selectedBooking.id}</p>
                      </div>
                      <div className="border-b-2 border-dashed border-gray-200 p-5 grid grid-cols-2 gap-4 dark:border-navy-700">
                        <div><p className="text-[10px] font-bold uppercase text-gray-400">Venue</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{selectedBooking.venueName}</p></div>
                        <div className="text-right"><p className="text-[10px] font-bold uppercase text-gray-400">Date</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{fmtDate(selectedBooking.date)}</p></div>
                        <div className="col-span-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-gray-400">Time</p>
                          <p className="font-bold text-navy-700 dark:text-white mt-1">{fmtTime(selectedBooking.startTime)} – {fmtTime(selectedBooking.endTime)}</p>
                        </div>
                      </div>
                      <div className="p-5 flex justify-center">
                        <div className="p-3 border border-gray-100 rounded-xl bg-white dark:bg-white shadow-sm flex flex-col items-center justify-center">
                          {selectedBooking.qrCode ? (
                             <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-100">
                               <QRCode value={selectedBooking.qrCode} size={96} />
                               {selectedBooking.qrId && <p className="text-[8px] text-gray-400 font-bold tracking-widest mt-2 uppercase text-center">{selectedBooking.qrId.split("-")[0] + "-" + selectedBooking.qrId.split("-")[1].substring(0,6)}</p>}
                             </div>
                          ) : (
                             <MdQrCode2 className="h-24 w-24 text-navy-900" />
                          )}
                        </div>
                      </div>
                      <div className="bg-green-50 py-3 text-center dark:bg-green-500/10">
                        <p className="text-xs font-black tracking-widest text-green-600 dark:text-green-400 uppercase flex items-center justify-center gap-1.5">
                          <MdCheckCircle size={14} /> Approved & Valid
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-navy-700 dark:bg-navy-900/50">
                      <div className="mb-4 rounded-full bg-gray-200 p-4 dark:bg-navy-800">
                        <MdQrCode2 className="h-10 w-10 text-gray-400" />
                      </div>
                      <p className="font-bold text-gray-500 dark:text-gray-400">Ticket Not Generated</p>
                      <p className="text-xs text-gray-400 mt-1">Requires final approval by Dean / AR.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}