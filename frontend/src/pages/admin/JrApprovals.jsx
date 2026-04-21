import React, { useState, useEffect } from "react";
import { fetchAllBookings, submitJrDecision } from "../../services/api";
import courseData from "../../variables/courseData";
import { ROOM_CAPACITIES, VENUES, EXISTING_BOOKINGS } from "../../variables/mockData";

import {
  MdOutlineLibraryAddCheck, MdEvent, MdLocationOn, MdPerson, MdClose,
  MdFilterList, MdOutlineArrowForward, MdCheckCircle,
  MdAutoAwesome, MdChat, MdInfoOutline,
  MdCalendarToday, MdBlock, MdSend, MdCorporateFare,
  MdPendingActions,
} from "react-icons/md";
// Add this right below your imports!
const LOCAL_VENUES = [
  { id: "m1", name: "M1", title: "Lecture Hall M1", block: "Radhakrishnan Block" },
  { id: "m2", name: "M2", title: "Lecture Hall M2", block: "Radhakrishnan Block" },
  { id: "m3", name: "M3", title: "Lecture Hall M3", block: "Radhakrishnan Block" },
  { id: "m4", name: "M4", title: "Lecture Hall M4", block: "Radhakrishnan Block" },
  { id: "m5", name: "M5", title: "Lecture Hall M5", block: "Radhakrishnan Block" },
  { id: "m6", name: "M6", title: "Lecture Hall M6", block: "Radhakrishnan Block" },
  { id: "audi", name: "Auditorium", title: "Main Auditorium", block: "Radhakrishnan Block" },
  
  { id: "cs1", name: "CS1", title: "CS1", block: "S. Ramanujan Block" },
  { id: "cs2", name: "CS2", title: "CS2", block: "S. Ramanujan Block" },
  { id: "cssh", name: "CS(SH)", title: "CS(SH)", block: "S. Ramanujan Block" },
  
  { id: "ee1", name: "EE1", title: "EE1", block: "J. C. Bose Block" },
  { id: "ee2", name: "EE2", title: "EE2", block: "J. C. Bose Block" },
  { id: "ee3", name: "EE3", title: "EE3", block: "J. C. Bose Block" },
  { id: "eesh", name: "EE(SH)", title: "EE(SH)", block: "J. C. Bose Block" },
  
  { id: "me1", name: "ME1", title: "ME1", block: "Satish Dhawan Block" },
  { id: "me2", name: "ME2", title: "ME2", block: "Satish Dhawan Block" },
  { id: "mesh", name: "ME(SH)", title: "ME(SH)", block: "Satish Dhawan Block" },
  
  { id: "cy1", name: "CY1", title: "CY1", block: "S. Bhatnagar Block" },
  { id: "cy2", name: "CY2", title: "CY2", block: "S. Bhatnagar Block" },
  { id: "cysh", name: "CY(SH)", title: "CY(SH)", block: "S. Bhatnagar Block" },
  
  { id: "s001", name: "S-001", title: "S-001", block: "Super Academic Block" },
  { id: "s002", name: "S-002", title: "S-002", block: "Super Academic Block" },
  { id: "s003", name: "S-003", title: "S-003", block: "Super Academic Block" },
  { id: "s102", name: "S-102", title: "S-102", block: "Super Academic Block" },
  { id: "s103", name: "S-103", title: "S-103", block: "Super Academic Block" },
  { id: "s104", name: "S-104", title: "S-104", block: "Super Academic Block" },
  { id: "s105", name: "S-105", title: "S-105", block: "Super Academic Block" },
  { id: "s106", name: "S-106", title: "S-106", block: "Super Academic Block" },
  { id: "s107", name: "S-107", title: "S-107", block: "Super Academic Block" },
];

const START_HOUR = 8;
const END_HOUR   = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const timeToPercent = (t) => {
  const [h, m] = t.split(":").map(Number);
  return Math.max(0, Math.min(100, ((h + m / 60 - START_HOUR) / TOTAL_HOURS) * 100));
};

const getClashes = (date, venueId, start, end) =>
  EXISTING_BOOKINGS.filter((eb) => {
    if (eb.date !== date || eb.venueId !== venueId) return false;
    return timeToPercent(start) < timeToPercent(eb.endTime) &&
           timeToPercent(end)   > timeToPercent(eb.startTime);
  });

const normalizeVenueString = (value) =>
  value ? value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

const getPriorityKey = (priority) =>
  priority._uid || `${priority.venueId}_${priority.date}_${priority.startTime}_${priority.endTime}`;

const venueMatchesCourse = (courseVenue, venueName, venueId) => {
  const cv = normalizeVenueString(courseVenue);
  const vn = normalizeVenueString(venueName);
  const vid = normalizeVenueString(venueId);
  return cv === vn || cv === vid || vn === vid ||
         (cv === 'AUDI' && vid === 'AUDITORIUM') ||
         (cv === 'AUDITORIUM' && vid === 'AUDI');
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const formatTime = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const STATUS_CFG = {
  "Pending":         { color: "text-brand-400",  bg: "bg-brand-500/15",  dot: "bg-brand-500",  label: "Pending Review",  pulse: false },
  "Action Required": { color: "text-orange-400", bg: "bg-orange-500/15", dot: "bg-orange-500", label: "Action Required", pulse: true  },
  "Approved":        { color: "text-green-400",  bg: "bg-green-500/15",  dot: "bg-green-500",  label: "Approved",        pulse: false },
  "Rejected":        { color: "text-red-400",    bg: "bg-red-500/15",    dot: "bg-red-500",    label: "Rejected",        pulse: false },
};
const scfg = (s) => STATUS_CFG[s] || STATUS_CFG["Pending"];

const stageColor = (s) =>
  s === "approved"          ? "bg-green-500"
  : s === "rejected"        ? "bg-red-500"
  : s === "changes_requested" ? "bg-orange-500"
  : "bg-navy-700 dark:bg-navy-600";

const getSystemSuggestion = (priorities, audience) => {
  const order = [
    { id: "m4", name: "Room M4" }, { id: "m5", name: "Room M5" },
    { id: "m6", name: "Room M6" }, { id: "audi", name: "Auditorium" },
  ];
  const p = priorities[0];
  for (const v of order) {
    const alreadyUsed = priorities.some((x) => x.venueId === v.id && x.date === p.date);
    if (!alreadyUsed && ROOM_CAPACITIES[v.id] >= audience &&
        getClashes(p.date, v.id, p.startTime, p.endTime).length === 0) {
      return { id: "sys", date: p.date, startTime: p.startTime, endTime: p.endTime, venueId: v.id, venueName: v.name, block: "System Suggested" };
    }
  }
  return null;
};

// ─────────────────────────────────────────────────────────────
// VENUE TIMELINE ROW
// ─────────────────────────────────────────────────────────────
function VenueTimelineRow({ priority, audience, label, isSuggested, isSelected, onSelect }) {
  const clashes  = getClashes(priority.date, priority.venueId, priority.startTime, priority.endTime);
  const cap      = ROOM_CAPACITIES[priority.venueId] || 0;
  const capOk    = cap >= audience;
  const isValid  = clashes.length === 0 && capOk;

  const pS = timeToPercent(priority.startTime);
  const pW = timeToPercent(priority.endTime) - pS;
  const dateDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(priority.date).getDay()];
  const courseEvents = courseData.flatMap((course, idx) => {
    if (!course.schedule || !course.venue) return [];
    return course.schedule
      .filter((slot) => slot.day === dateDayName && venueMatchesCourse(course.venue, priority.venueName, priority.venueId))
      .map((slot, scheduleIdx) => ({
        title: `${course.code} Class`,
        startTime: slot.time.split(" - ")[0],
        endTime: slot.time.split(" - ")[1],
        time: slot.time,
        type: "Academic Course",
        isCourse: true,
        id: `course-${course.code}-${scheduleIdx}`,
      }));
  });

  const bgEvts = [
    ...courseEvents,
    ...EXISTING_BOOKINGS.filter(
      (e) => e.date === priority.date && e.venueId === priority.venueId
    ),
  ];
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  const outerBorder = isSuggested
    ? "border-purple-500/50"
    : isSelected ? "border-brand-500"
    : isValid    ? "border-navy-600 hover:border-navy-500"
    :              "border-red-800/40";

  const outerBg = isSuggested
    ? "dark:bg-purple-950/30"
    : isSelected ? "dark:bg-brand-900/20"
    : isValid    ? "dark:bg-navy-900/50"
    :              "dark:bg-red-950/20";

  const headerBg = isSuggested
    ? "dark:bg-purple-900/30 dark:border-b dark:border-purple-700/30"
    : isSelected
    ? "dark:bg-brand-900/30 dark:border-b dark:border-brand-700/30"
    : isValid
    ? "dark:bg-navy-800/60 dark:border-b dark:border-navy-700"
    : "dark:bg-red-900/10 dark:border-b dark:border-red-800/30";

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${outerBorder} ${outerBg} ${isSelected ? "ring-2 ring-brand-500/40 ring-offset-2 dark:ring-offset-navy-800" : ""}`}>

      {/* Header row */}
      <div className={`px-5 py-3.5 flex flex-wrap gap-y-2 gap-x-4 justify-between items-center border-b border-white/5 ${headerBg}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isSuggested ? "bg-purple-500/20 text-purple-300" : "dark:bg-navy-700 text-gray-400"}`}>
            {isSuggested ? "✨ Suggested" : label}
          </span>
          <span className="font-bold text-white text-sm">{priority.venueName}</span>
          <span className="text-gray-500 text-xs">— {priority.block || VENUES.find(v => v.id === priority.venueId)?.block || "Campus"}</span>
          <span className="text-gray-600 text-xs hidden sm:inline">•</span>
          <span className="text-gray-300 text-xs font-medium">{formatDate(priority.date)}</span>
          <span className="text-gray-600 text-xs hidden sm:inline">•</span>
          <span className="text-gray-300 text-xs font-semibold">
            {formatTime(priority.startTime)} – {formatTime(priority.endTime)}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
            isSuggested   ? "bg-purple-500/20 text-purple-300"
            : isValid     ? "bg-green-500/20 text-green-400"
            : !capOk      ? "bg-orange-500/20 text-orange-400"
            :               "bg-red-500/20 text-red-400"
          }`}>
            {isSuggested ? "Alt. Slot" : isValid ? "✓ Valid Slot" : !capOk ? "⚠ Over Capacity" : "✗ Time Clash"}
          </span>
            <button
              onClick={() => onSelect(isSuggested ? "sys" : getPriorityKey(priority))}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                isSelected
                  ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105"
                  : "bg-brand-500/10 border-brand-500/30 text-brand-400 hover:bg-brand-500 hover:border-brand-500 hover:text-white hover:scale-105"
              }`}
            >
              {isSelected ? "✓ Selected" : "Select Slot"}
            </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pt-4 pb-4">
        {/* Hour labels */}
        <div className="relative h-5 mb-1 select-none">
          {hours.map((h, i) => {
            if (i % 2 !== 0) return null;
            const pct = (i / TOTAL_HOURS) * 100;
            return (
              <span
                key={h}
                className="absolute text-[10px] font-bold text-gray-500"
                style={{ left: `${pct}%`, transform: i === 0 ? "none" : i >= TOTAL_HOURS - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
              >
                {h}:00
              </span>
            );
          })}
        </div>

        {/* Track */}
        <div className="relative h-14 rounded-xl overflow-hidden dark:bg-navy-950/70 bg-gray-100 border border-navy-700/50">
          {/* Grid lines */}
          {hours.map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px dark:bg-navy-700/30 bg-gray-200"
              style={{ left: `${(i / TOTAL_HOURS) * 100}%` }}
            />
          ))}

          {/* Existing bookings */}
          {bgEvts.map((eb, idx) => {
            const s = timeToPercent(eb.startTime);
            const w = timeToPercent(eb.endTime) - s;
            return (
              <div
                key={eb.id || idx}
                title={`${eb.title} (${eb.time || `${eb.startTime}–${eb.endTime}`})`}
                className={`absolute top-2 bottom-2 rounded-lg border flex items-center justify-center overflow-hidden cursor-default px-2 text-[10px] font-semibold truncate ${eb.isCourse ? "dark:bg-indigo-600/80 bg-blue-300/80 dark:border-indigo-500/60 border-blue-300" : "dark:bg-navy-600/80 bg-gray-300/80 dark:border-navy-500/60 border-gray-300"}`}
                style={{ left: `${s}%`, width: `${w}%` }}
              >
                <span className={`${eb.isCourse ? "text-white" : "dark:text-gray-300 text-gray-600"}`}>{eb.title}</span>
              </div>
            );
          })}

          {/* Requested slot */}
          <div
            title={`Requested: ${priority.startTime}–${priority.endTime}`}
            className={`absolute top-1 bottom-1 rounded-xl flex items-center justify-center overflow-hidden shadow-lg transition-all ${
              isSuggested ? "bg-purple-500 shadow-purple-500/40"
              : isValid   ? "bg-brand-500 shadow-brand-500/40"
              :              "bg-red-500 shadow-red-500/30"
            }`}
            style={{ left: `${pS}%`, width: `${pW}%` }}
          >
            <span className="text-[11px] font-bold text-white truncate px-2">
              {isValid
                ? "✓ Requested"
                : clashes.length > 0
                ? `✗ Clashes: ${clashes.map((c) => c.title).join(", ")}`
                : "✗ Conflict"}
            </span>
          </div>
        </div>

        {/* Capacity + clash info */}
        <div className="flex justify-between items-center mt-2 text-[11px] font-medium flex-wrap gap-1">
          <div className="flex items-center gap-3 text-gray-500">
            <span>Capacity: <span className="dark:text-gray-300 text-gray-600 font-bold">{cap || "?"}</span></span>
            <span>•</span>
            <span>Audience: <span className={`font-bold ${audience > cap ? "text-orange-400" : "text-green-400"}`}>{audience}</span></span>
            {!capOk && <span className="text-orange-400 font-bold">⚠ Exceeds by {audience - cap}</span>}
          </div>
          {clashes.length > 0 && (
            <span className="text-red-400 font-bold">Conflict: {clashes.map((c) => c.title).join(", ")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRACKER NODE
// ─────────────────────────────────────────────────────────────
function TrackerNode({ label, status, isActive, comment, commentLabel }) {
  const faded = !isActive && !["approved","rejected","changes_requested"].includes(status);

  const dotClass =
    status === "approved"            ? "bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]"
    : status === "rejected"          ? "bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]"
    : status === "changes_requested" ? "bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.2)] animate-pulse"
    : isActive                       ? "bg-brand-500 shadow-[0_0_0_4px_rgba(67,24,255,0.2)] animate-pulse"
    : "bg-navy-600";

  const badgeCls =
    status === "approved"            ? "bg-green-500/15 text-green-400"
    : status === "rejected"          ? "bg-red-500/15 text-red-400"
    : status === "changes_requested" ? "bg-orange-500/15 text-orange-400"
    : isActive                       ? "bg-brand-500/15 text-brand-400"
    : "dark:bg-navy-700 bg-gray-100 text-gray-500";

  const badgeLabel =
    status === "approved"            ? "Approved"
    : status === "rejected"          ? "Rejected"
    : status === "changes_requested" ? "Changes Requested"
    : isActive                       ? "In Progress"
    : "Pending";

  return (
    <div className={`relative flex items-start gap-4 transition-opacity duration-300 ${faded ? "opacity-30" : "opacity-100"}`}>
      <div className={`z-10 mt-1 h-4 w-4 flex-shrink-0 rounded-full border-4 border-white dark:border-navy-800 transition-all duration-500 ${dotClass}`} />
      <div className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-bold text-navy-700 dark:text-white">{label}</p>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest ${badgeCls}`}>{badgeLabel}</span>
        </div>
        {comment && (
          <div className={`mt-3 rounded-xl p-4 border text-sm ${
            status === "changes_requested"
              ? "bg-orange-500/10 border-orange-500/20 text-orange-200"
              : "bg-red-500/10 border-red-500/20 text-red-200"
          }`}>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">{commentLabel}</p>
            "{comment}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function JRApprovals() {
  const [isOpen,          setIsOpen]          = useState(false);
  const [modalVisible,    setModalVisible]    = useState(false);
  const [activeReq,       setActiveReq]       = useState(null);
  const [activeTab,       setActiveTab]       = useState("Details");
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [filterDate,      setFilterDate]      = useState("");
  const [filterVenue,     setFilterVenue]     = useState("All Venues");
  const [selectedSlotId,  setSelectedSlotId]  = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionDone,      setActionDone]      = useState(null);
  const [bookings,        setBookings]        = useState([]);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isSaving,        setIsSaving]        = useState(false);

  // Load bookings from DB — show only those that cleared faculty stage
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const all = await fetchAllBookings();
        // Normalise: map _id → id, populate flat fields
        const mapped = all.map(b => ({
          ...b,
          id: b._id,
          studentName: b.requester?.name || "Student",
          faculty: b.facultyInCharge?.name || "Faculty",
        }));
        setBookings(mapped);
      } catch (e) {
        console.error("JrApprovals load error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // JR queue = bookings where faculty approved and JR hasn't acted yet
  const jrQueue = bookings.filter(b => b.tracker?.faculty === "approved");

  // 1. Get today's date for the input constraint
  const todayStr = new Date().toISOString().split('T')[0];

  // 2. Extract unique Campus Blocks from your VENUES mock data
const uniqueBlocks = [...new Set(LOCAL_VENUES.map(v => v.block).filter(Boolean))];
  const openModal = (req) => {
    setActiveReq(req);
    setActiveTab("Details");
    setSelectedSlotId(null);
    setRejectionReason("");
    setActionDone(null);
    setIsOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => { setIsOpen(false); setActiveReq(null); }, 280);
  };

  // 3. Updated Filter Logic to search by Block instead of exact room
  const displayed = jrQueue.filter((r) => {
    const ms = filterStatus === "all" || (r.status || "").toLowerCase() === filterStatus.toLowerCase();
    const md = !filterDate  || r.priorities.some((p) => p.date === filterDate);
    const mv = filterVenue === "All Venues" || r.priorities.some((p) => {
      const venueObj = LOCAL_VENUES.find(v =>
        v.title === p.venueName ||
        v.name === p.venueName ||
        v.id === p.venueId ||
        (p.venueName || "").toLowerCase().includes((v.id || "").toLowerCase())
      );
      return venueObj?.block === filterVenue;
    });
    return ms && md && mv;
  });

  const urgent = jrQueue.find((r) => r.status === "Pending" || r.status === "Action Required");

  const allInvalid = activeReq?.priorities.every((p) =>
    getClashes(p.date, p.venueId, p.startTime, p.endTime).length > 0 ||
    (ROOM_CAPACITIES[p.venueId] || 0) < (activeReq?.audienceCount || 0)
  );

  const suggestion = activeReq && allInvalid
    ? getSystemSuggestion(activeReq.priorities, activeReq.audienceCount)
    : null;

  return (
    <div className="mt-5 w-full min-h-[80vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">
      

      {/* ─── FILTER ROW ─── */}
      <div className="mb-6 flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-1.5 text-brand-500 font-bold text-sm">
          <MdFilterList size={18} /> Filters
        </div>
        <div className="relative flex items-center">
          <MdCalendarToday className="absolute left-3 text-gray-400 dark:text-gray-500 pointer-events-none" size={14} />
          <input
            type="date"
            min={todayStr}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white"
          />
        </div>
        <select
          value={filterVenue} onChange={(e) => setFilterVenue(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white"
        >
          <option value="All Venues">All Campus Blocks</option>
          {uniqueBlocks.map((block) => (
            <option key={block} value={block}>{block}</option>
          ))}
        </select>
        <select
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending Review</option>
          <option value="Action Required">Action Required</option>
          <option value="Approved">Approved by Me</option>
          <option value="Rejected">Rejected by Me</option>
        </select>
        {(filterDate || filterVenue !== "All Venues" || filterStatus !== "all") && (
          <button
            onClick={() => { setFilterDate(""); setFilterVenue("All Venues"); setFilterStatus("all"); }}
            className="rounded-xl px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            Clear
          </button>
        )}
      </div>

      {/* ─── NEXT PENDING BANNER ─── */}
      {urgent && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 p-5 text-white shadow-lg shadow-brand-500/30">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-2 flex items-center gap-1.5">
            <MdPendingActions size={14} /> Next Pending Review
          </p>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">{urgent.activityType}</h3>
              <p className="text-white/80 mt-0.5 flex items-center gap-2 text-xs">
                <MdCorporateFare size={13} /> {urgent.clubName} • {urgent.audienceCount} people
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {urgent.priorities.map((p, i) => (
                <div key={p._uid || i} className="rounded-xl bg-white/20 backdrop-blur-md px-3 py-1.5 flex items-center gap-1.5 border border-white/10 text-xs font-bold">
                  <MdLocationOn size={12} /> P{i + 1}: {p.venueName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── CARDS GRID ─── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {displayed.map((req) => {
          const cfg = scfg(req.status);
          return (
            <div
              key={req.id}
              onClick={() => openModal(req)}
              className="group relative flex cursor-pointer flex-col rounded-[16px] bg-white p-6 shadow-sm border border-gray-100 transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_24px_rgba(99,102,241,0.2)] dark:bg-navy-800 dark:border-navy-700"
            >
              {/* L-shaped approval progress indicator */}
              <div className="absolute top-0 left-0 w-2 h-full flex flex-col z-10 rounded-l-[16px] overflow-hidden border-r border-gray-50 dark:border-navy-800">
                <div className={`w-full h-1/2 transition-all duration-500 ${stageColor(req.tracker.faculty)}`} title="Faculty" />
                <div className={`w-full h-1/2 border-t border-white/20 transition-all duration-500 ${stageColor(req.tracker.jrAssistant)}`} title="Jr. Assistant" />
              </div>
              <div className="absolute bottom-0 left-2 w-[calc(100%-8px)] h-2 flex z-10 rounded-br-[16px] overflow-hidden border-t border-gray-50 dark:border-navy-800">
                <div className={`w-1/2 transition-all duration-500 ${stageColor(req.tracker.superintendent)}`} title="Superintendent" />
                <div className={`w-1/2 border-l border-white/10 transition-all duration-500 ${stageColor(req.tracker.ar)}`} title="ar" />
              </div>

              <div className="pl-3 pb-2">
                {/* Title + badge */}
                <div className="flex items-start justify-between mb-1 gap-2">
                  <h3 className="text-lg font-bold tracking-wide text-navy-700 dark:text-white truncate">{req.activityType}</h3>
                  <span className={`flex-shrink-0 rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${cfg.bg} ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Club + audience */}
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">
                  {req.clubName} • <span className="text-brand-400">{req.audienceCount} people</span>
                </p>

                {/* Priority slots compact list */}
                <div className="bg-gray-50 dark:bg-navy-900/60 p-3 rounded-xl border border-gray-100 dark:border-navy-700 space-y-2">
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1.5">Requested Slots</p>
                  {req.priorities.map((p, i) => {
                    const c = getClashes(p.date, p.venueId, p.startTime, p.endTime);
                    const capOk = (ROOM_CAPACITIES[p.venueId] || 0) >= req.audienceCount;
                    const valid = c.length === 0 && capOk;
                    return (
                      <div key={p._uid || i} className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-gray-500 font-bold flex-shrink-0">P{i+1}</span>
                          <span className="font-semibold text-navy-700 dark:text-gray-200 truncate">{p.venueName}</span>
                          <span className="text-gray-400 flex-shrink-0">{p.date.slice(5)}</span>
                          <span className="text-gray-500 flex-shrink-0">{p.startTime}</span>
                        </div>
                        <span className={`flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${valid ? "bg-green-500/15 text-green-400" : !capOk ? "bg-orange-500/15 text-orange-400" : "bg-red-500/15 text-red-400"}`}>
                          {valid ? "✓ OK" : !capOk ? "Cap" : "Clash"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3 font-medium">Submitted: {req.submittedAt}</p>

                {/* Hover CTA */}
                <div className="mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-navy-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center text-xs font-bold text-brand-500">
                  Review &amp; Resolve <MdOutlineArrowForward size={16} />
                </div>
              </div>
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-gray-200 dark:border-navy-700 dark:bg-navy-800/30">
            <MdEvent className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">No requests found</h3>
            <p className="text-sm text-gray-500 mt-1">Adjust your filters to see more requests.</p>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          CENTER MODAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[100] bg-navy-900/70 backdrop-blur-sm transition-opacity duration-300 ${modalVisible ? "opacity-100" : "opacity-0"}`}
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-5xl bg-white dark:bg-navy-800 rounded-3xl shadow-2xl shadow-navy-900/50 flex flex-col transition-all duration-300 origin-center ${modalVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
              style={{ maxHeight: "92vh" }}
            >
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-start justify-between p-6 bg-gradient-to-r from-brand-500/10 to-indigo-500/10 border-b border-gray-100 dark:border-navy-700 rounded-t-3xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${scfg(activeReq?.status).dot} ${activeReq?.status === "Action Required" ? "animate-pulse" : ""}`} />
                    <p className="text-xs font-black uppercase tracking-widest text-brand-500 dark:text-brand-400">
                      {activeReq?.id} • {scfg(activeReq?.status).label}
                    </p>
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-navy-700 dark:text-white">{activeReq?.activityType}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {activeReq?.clubName} • <span className="text-brand-400 font-bold">{activeReq?.audienceCount} people</span> • Faculty: {activeReq?.faculty}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-full p-2 bg-white/60 text-gray-500 hover:bg-white dark:bg-navy-900/60 dark:hover:bg-navy-900 transition-all shadow-sm hover:scale-105 active:scale-95"
                >
                  <MdClose size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex-shrink-0 flex border-b border-gray-100 dark:border-navy-700 px-6 bg-white dark:bg-navy-800">
                {[
                  { id: "Details", emoji: "👤" },
                  { id: "Tracker", emoji: "📍" },
                  { id: "Resolve", emoji: "⚡" },
                ].map(({ id, emoji }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`mr-8 py-4 text-sm font-bold transition-all duration-200 relative flex items-center gap-1.5 whitespace-nowrap ${activeTab === id ? "text-brand-500" : "text-gray-400 hover:text-navy-700 dark:hover:text-white"}`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    {id}
                    {activeTab === id && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-500 rounded-t-full" />}
                  </button>
                ))}
              </div>

              {/* ── SCROLLABLE TAB CONTENT ── */}
              <div className="flex-1 overflow-y-auto p-6 dark:bg-navy-800/40 rounded-b-3xl">

                {/* ┄ Details Tab ┄ */}
                {activeTab === "Details" && activeReq && (
                  <div className="flex flex-col gap-5">
                    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                      <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MdPerson size={14} /> Requester Info</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                        <div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Name</p><p className="font-bold text-navy-700 dark:text-white mt-1">{activeReq.studentName}</p></div>
                        <div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Entry No.</p><p className="font-bold text-navy-700 dark:text-white mt-1">{activeReq.entryNo}</p></div>
                        <div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Mobile</p><p className="font-bold text-navy-700 dark:text-white mt-1">{activeReq.mobile}</p></div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                      <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MdEvent size={14} /> Event Logistics</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                        <div className="col-span-2 sm:col-span-1"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Club</p><p className="font-bold text-navy-700 dark:text-white mt-1">{activeReq.clubName}</p></div>
                        <div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Activity</p><p className="font-bold text-navy-700 dark:text-white mt-1">{activeReq.activityType}</p></div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Audience</p>
                          <p className="font-bold text-brand-500 mt-1 text-xl leading-none">{activeReq.audienceCount}<span className="text-sm font-medium text-gray-400 ml-1">people</span></p>
                        </div>
                        <div className="col-span-2 sm:col-span-3"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Purpose</p><p className="font-medium text-navy-700 dark:text-gray-300 text-sm mt-1">{activeReq.purpose}</p></div>
                        <div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Faculty In-charge</p><p className="font-bold text-navy-700 dark:text-white mt-1">{activeReq.faculty}</p></div>
                        <div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Submitted</p><p className="font-bold text-navy-700 dark:text-white mt-1">{activeReq.submittedAt}</p></div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                      <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2"><MdLocationOn size={14} /> Requested Venue & Schedule</h3>
                      <div className="space-y-3">
                        {activeReq.priorities.map((p, i) => (
                          <div key={p._uid || i} className="flex items-center gap-3 rounded-xl bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 p-4">
                            <span className="text-xs font-black text-brand-500 bg-brand-500/10 px-2.5 py-1.5 rounded-lg flex-shrink-0">P{i+1}</span>
                            <div className="flex-1 grid grid-cols-3 gap-3 min-w-0">
                              <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Venue</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-0.5">{p.venueName}</p></div>
                              <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-0.5">{formatDate(p.date)}</p></div>
                              <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Time</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-0.5">{formatTime(p.startTime)} – {formatTime(p.endTime)}</p></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ┄ Tracker Tab ┄ */}
                {activeTab === "Tracker" && activeReq && (
                  <div className="relative pl-4 pt-2 pb-10">
                    <div className="absolute left-[23px] top-6 bottom-4 border-l-2 border-dashed border-brand-500/20" />
                    <div className="flex flex-col gap-8">
                      <TrackerNode label="Student Submission" status="approved" isActive={false} />
                      <TrackerNode label={`Faculty: ${activeReq.faculty}`} status={activeReq.tracker.faculty} isActive={false} />
                      <TrackerNode
                        label="Jr. Assistant (You)"
                        status={activeReq.tracker.jrAssistant}
                        isActive={activeReq.tracker.jrAssistant === "pending" && activeReq.tracker.faculty === "approved"}
                        comment={activeReq.jrComment}
                        commentLabel="Your Comment"
                      />
                      <TrackerNode label="Superintendent" status={activeReq.tracker.superintendent} isActive={false} />
                      <TrackerNode label="ar" status={activeReq.tracker.ar} isActive={false} />
                    </div>
                  </div>
                )}

                {/* ┄ Resolve Tab ┄ */}
                {activeTab === "Resolve" && activeReq && (
                  <div className="space-y-5">
                    {/* Conflict summary banner */}
                    {allInvalid ? (
                      <div className="rounded-2xl bg-red-500/15 border-2 border-red-500/40 p-5">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl flex-shrink-0">⚠️</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-red-400 text-lg mb-1">All Priorities Have Conflicts</h3>
                            <p className="text-red-300/80 text-sm mb-3">
                              All {activeReq.priorities.length} requested slots conflict with existing bookings or exceed room capacity. You can either:
                            </p>
                            <ul className="space-y-1 text-sm text-red-300/80 ml-4 list-disc">
                              {activeReq.priorities.every(p => ROOM_CAPACITIES[p.venueId] < activeReq.audienceCount) && (
                                <li>Request smaller audience or different venue type</li>
                              )}
                              {activeReq.priorities.some(p => getClashes(p.date, p.venueId, p.startTime, p.endTime).length > 0) && (
                                <li>Choose alternative dates/times without conflicts</li>
                              )}
                              <li>Contact faculty to coordinate venue/timing changes</li>
                            </ul>
                            {suggestion && (
                              <div className="mt-3 p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300">
                                ✨ System found an alternative: <span className="font-bold">{suggestion.venueName}</span> on {formatDate(suggestion.date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-sm text-green-300 flex items-start gap-3">
                        <span className="text-lg flex-shrink-0">ℹ️</span>
                        <div>
                          <p className="font-bold mb-1">Review Each Priority Slot</p>
                          <p className="text-green-300/80">
                            Gray timeline shows existing bookings. Select a <strong className="text-green-400">valid (blue highlight)</strong> slot or reject if none work. Selected slot will be allocated and visible to faculty/student.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Priority timeline rows */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-navy-700 dark:text-gray-200 px-1">Requested Slots Analysis</h4>
                      {activeReq.priorities.map((p, i) => {
                        const isConflicting = getClashes(p.date, p.venueId, p.startTime, p.endTime).length > 0 || 
                                            (ROOM_CAPACITIES[p.venueId] || 0) < activeReq.audienceCount;
                        const priorityKey = getPriorityKey(p);
                        return (
                          <div key={priorityKey} className={`transition-all ${isConflicting ? "opacity-60" : ""}`}>
                            <VenueTimelineRow
                              priority={p}
                              audience={activeReq.audienceCount}
                              label={`Priority ${i + 1} ${isConflicting ? "❌ Conflicting" : "✅ Valid"}`}
                              isSuggested={false}
                              isSelected={selectedSlotId === priorityKey}
                              onSelect={setSelectedSlotId}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* System suggestion when all priorities fail */}
                    {allInvalid && suggestion && (
                      <div>
                        <div className="flex items-center gap-3 my-3">
                          <div className="h-px flex-1 dark:bg-navy-700 bg-gray-300" />
                          <span className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                            <MdAutoAwesome size={14} /> System Alternative
                          </span>
                          <div className="h-px flex-1 dark:bg-navy-700 bg-gray-300" />
                        </div>
                        <VenueTimelineRow
                          priority={suggestion}
                          audience={activeReq.audienceCount}
                          label="Suggested Alternative"
                          isSuggested={true}
                          isSelected={selectedSlotId === "sys"}
                          onSelect={() => setSelectedSlotId("sys")}
                        />
                      </div>
                    )}

                    {/* Action section */}
                    {actionDone ? (
                      <div className={`rounded-2xl p-8 text-center border-2 transition-all ${actionDone === "approved" ? "border-green-500/40 bg-green-900/20" : actionDone === "rejected" ? "border-red-500/40 bg-red-900/20" : "border-orange-500/40 bg-orange-900/20"}`}>
                        <p className="text-4xl mb-3">{actionDone === "approved" ? "✅" : actionDone === "rejected" ? "🚫" : "↩️"}</p>
                        <p className="font-extrabold text-white text-xl">
                          {actionDone === "approved" ? "Forwarded to Superintendent" : actionDone === "rejected" ? "Request Rejected" : "Sent Back to Student"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">Action recorded successfully. The booking will be updated across the system.</p>
                        <button
                          onClick={() => { setActionDone(null); setSelectedSlotId(null); setRejectionReason(""); }}
                          className="mt-5 px-6 py-2 rounded-xl text-sm font-bold dark:bg-navy-700 bg-gray-100 dark:text-gray-300 text-gray-600 hover:bg-gray-200 dark:hover:bg-navy-600 transition-all"
                        >
                          Review Another Request
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Approve selected slot button */}
                        {selectedSlotId && (
                          <button
                            onClick={async () => {
                              setIsSaving(true);
                              try {
                                const slot = selectedSlotId === "sys"
                                  ? suggestion
                                  : activeReq.priorities.find(p => getPriorityKey(p) === selectedSlotId) || activeReq.priorities[0];
                                const allocatedSlot = {
                                  venueId: slot.venueId,
                                  venueName: slot.venueName,
                                  date: slot.date,
                                  startTime: slot.startTime,
                                  endTime: slot.endTime,
                                };
                                await submitJrDecision(activeReq.id, "approved", allocatedSlot);
                                setBookings(prev => prev.map(b =>
                                  b.id === activeReq.id
                                    ? { ...b, status: "approved", tracker: { ...b.tracker, jrAssistant: "approved" } }
                                    : b
                                ));
                                setActionDone("approved");
                              } catch (e) {
                                alert(e.response?.data?.message || "Failed to approve.");
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            disabled={isSaving}
                            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                          >
                            <MdCheckCircle size={20} /> {isSaving ? "Forwarding…" : "Forward Selected Slot to Superintendent"}
                          </button>
                        )}

                        {/* Action buttons for reject/send back */}
                        <div className="rounded-2xl dark:bg-navy-900/70 bg-gray-50 border border-gray-100 dark:border-navy-700 p-5">
                          <h4 className="text-sm font-bold text-navy-700 dark:text-white mb-1 flex items-center gap-2">
                            <MdChat size={16} className={allInvalid ? "text-red-400" : "text-orange-400"} /> 
                            {allInvalid ? "Reject or Send Back" : "Alternative Action"}
                          </h4>
                          <p className="text-xs text-gray-500 mb-3">
                            {allInvalid
                              ? "Explain the conflicts. Student & faculty will receive this reason to reschedule."
                              : "Select a valid slot above to approve, or reject the request if no allocation is possible."
                            }
                          </p>

                          {allInvalid && (
                            <>
                              {/* Auto-generated rejection reason for all conflicts */}
                              {!rejectionReason && (
                                <div className="mb-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                                  <p className="font-bold mb-1">🔍 Conflict Analysis:</p>
                                  <ul className="space-y-0.5 ml-3 list-disc">
                                    {activeReq.priorities.map((p, i) => {
                                      const clashes = getClashes(p.date, p.venueId, p.startTime, p.endTime);
                                      const capOk = (ROOM_CAPACITIES[p.venueId] || 0) >= activeReq.audienceCount;
                                      return (
                                        <li key={i}>
                                          P{i+1}: {p.venueName} ({formatDate(p.date)})
                                          {clashes.length > 0 && ` - Clash with: ${clashes.map(c => c.title).join(", ")}`}
                                          {!capOk && ` - Exceeds capacity (${ROOM_CAPACITIES[p.venueId]} < ${activeReq.audienceCount})`}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                  <p className="mt-2 font-semibold text-blue-200">Click below to auto-generate rejection message →</p>
                                </div>
                              )}
                            </>
                          )}

                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={allInvalid
                              ? "e.g. All requested slots conflict with existing bookings. P1: Clash with Physics Lab. P2: Exceeds capacity. P3: Booked by another event. Please request different dates or venue."
                              : "e.g. The selected slot is not suitable; please reject if no other option is available."
                            }
                            className="w-full rounded-xl p-3.5 text-sm border border-gray-200 dark:border-navy-700 dark:bg-navy-950 dark:text-gray-300 text-gray-700 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 placeholder-gray-400 dark:placeholder-gray-600 min-h-[100px] mb-3 transition-all resize-none"
                          />

                          {allInvalid && !rejectionReason && (
                            <button
                              onClick={() => {
                                const reasons = activeReq.priorities.map((p, i) => {
                                  const clashes = getClashes(p.date, p.venueId, p.startTime, p.endTime);
                                  const capOk = (ROOM_CAPACITIES[p.venueId] || 0) >= activeReq.audienceCount;
                                  let reason = `Priority ${i+1} (${p.venueName}, ${formatDate(p.date)})`;
                                  if (clashes.length > 0) {
                                    reason += ` - Conflicts with: ${clashes.map(c => c.title).join(", ")}`;
                                  }
                                  if (!capOk) {
                                    reason += ` - Exceeds room capacity (${ROOM_CAPACITIES[p.venueId]} < ${activeReq.audienceCount} people)`;
                                  }
                                  return reason;
                                }).join("\n");
                                setRejectionReason(`All requested priorities have scheduling conflicts:\n\n${reasons}\n\nPlease resubmit your request with alternative dates, times, or venues. Contact faculty or the booking office for assistance.`);
                              }}
                              className="mb-3 w-full px-4 py-2 rounded-lg text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all"
                            >
                              Auto-generate Rejection Reason
                            </button>
                          )}

                          {!allInvalid && (
                            <p className="text-xs text-gray-500 mb-3">
                              Pick the slot you want to approve above, then use the approve button. If there is no acceptable allocation, reject the booking instead.
                            </p>
                          )}

                          <div className="flex gap-3">
                            {allInvalid && (
                              <button
                                disabled={!rejectionReason.trim() || isSaving}
                                onClick={async () => {
                                  setIsSaving(true);
                                  try {
                                    await submitJrDecision(activeReq.id, "changes_requested", null, rejectionReason);
                                    setBookings(prev => prev.map(b => b.id === activeReq.id ? { ...b, status: "Action Required" } : b));
                                    setActionDone("sent_back");
                                  } catch (e) {
                                    alert(e.response?.data?.message || "Failed to send back.");
                                  } finally { setIsSaving(false); }
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:bg-orange-500 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <MdSend size={16} /> {isSaving ? "Saving…" : "Send Back"}
                              </button>
                            )}
                            <button
                              disabled={!rejectionReason.trim() || isSaving}
                              onClick={async () => {
                                setIsSaving(true);
                                try {
                                  await submitJrDecision(activeReq.id, "rejected", null, rejectionReason);
                                  setBookings(prev => prev.filter(b => b.id !== activeReq.id));
                                  setActionDone("rejected");
                                } catch (e) {
                                  alert(e.response?.data?.message || "Failed to reject.");
                                } finally { setIsSaving(false); }
                              }}
                              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                allInvalid 
                                  ? "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white w-full"
                                  : "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white"
                              }`}
                            >
                              <MdBlock size={16} /> {isSaving ? "Saving…" : "Reject Request"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>{/* end scrollable */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}