import React, { useState, useEffect } from "react";
import {
  fetchBookingsByFaculty,
  fetchBookingsByRequester,
  submitFacultyDecision,
  submitBookingRequest,
  fetchBookingsByVenueDate
} from "../../services/api";
import { VENUES } from "../../variables/mockData";
import courseData from "../../variables/courseData";
import {
  MdCheckCircle, MdCancel, MdEdit, MdOutlineLibraryAddCheck,
  MdCalendarMonth, MdAccessTime, MdLocationOn, MdAdd, MdClose,
  MdSend, MdOutlineArrowForward, MdCorporateFare, MdQrCode2,
  MdPendingActions, MdPerson, MdUpdate, MdFilterList, MdInfoOutline, MdRefresh, MdEvent
} from "react-icons/md";

// ── Suggestion lists ─────────────────────────────────────────────
const CLUB_OPTIONS = [
  "Board of Hostel Affairs", "Board of Sports Affairs", "Board of Science and Technology",
  "Board of Cultural Activities", "Board of Literary Activities", "Board of Academic Affairs",
  "Research Secretary", "NCC", "NSS", "Other"
];
const ACTIVITY_OPTIONS = [
  "Guest Lecture", "Lecture", "Examination", "Quiz", "Club Activity", "Workshop", "Seminar", "Other"
];

// ── Status helpers ───────────────────────────────────────────────
const sConfig = (s) => {
  if (s === "Approved")        return { bg: "bg-green-500/15",  color: "text-green-400",  border: "border-l-green-500",  shadow: "hover:shadow-green-500/10",  dot: "bg-green-500" };
  if (s === "Action Required") return { bg: "bg-orange-500/15", color: "text-orange-400", border: "border-l-orange-500", shadow: "hover:shadow-orange-500/10", dot: "bg-orange-400", pulse: true };
  if (s === "Rejected")        return { bg: "bg-red-500/15",    color: "text-red-400",    border: "border-l-red-500",    shadow: "hover:shadow-red-500/10",    dot: "bg-red-500" };
  return                            { bg: "bg-amber-500/15",  color: "text-amber-400",  border: "border-l-amber-400",  shadow: "hover:shadow-amber-500/10",  dot: "bg-amber-400", pulse: true };
};

const fmtDate = (d) => {
  if (!d) return "—";
  const parsed = new Date(d);
  return isNaN(parsed) ? d : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const fmtTime = (t) => { if (!t) return "—"; const [h, m] = t.split(":"); const hr = parseInt(h, 10); return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`; };

const WorkflowBar = ({ tracker = {} }) => {
  const stages = [
    { key: "faculty", label: "Faculty" },
    { key: "jrAssistant", label: "JR" },
    { key: "superintendent", label: "Supt." },
    { key: "ar", label: "AR" },
  ];
  return (
    <div className="flex items-center gap-1 mt-2">
      {stages.map((s, i) => {
        const val = tracker[s.key] || "pending";
        const dotColor = val === "approved" ? "bg-green-500" : val === "rejected" ? "bg-red-500" : val === "changes_requested" ? "bg-orange-500 animate-pulse" : "bg-gray-300 dark:bg-gray-600";
        const textColor = val !== "pending" ? "text-brand-400 dark:text-brand-300" : "text-gray-300 dark:text-gray-600";
        return (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-1 text-[10px] font-bold ${textColor}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
              {s.label}
            </div>
            {i < 3 && <div className={`flex-1 h-px ${val === "approved" ? "bg-green-500/40" : "bg-gray-200 dark:bg-navy-700"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default function Approvals() {
  const [activeType,   setActiveType]   = useState("incoming");
  const [incoming,     setIncoming]     = useState([]);   // bookings where I'm facultyInCharge
  const [myRequests,   setMyRequests]   = useState([]);   // bookings I submitted as requester
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [filterVenue,  setFilterVenue]  = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected,     setSelected]     = useState([]);

  const [reviewTarget,       setReviewTarget]       = useState(null);
  const [isReviewOpen,       setIsReviewOpen]       = useState(false);
  const [detailTarget,       setDetailTarget]       = useState(null);
  const [isDetailOpen,       setIsDetailOpen]       = useState(false);
  const [detailTab,          setDetailTab]          = useState("Details");
  const [decision,           setDecision]           = useState("");
  const [remarks,            setRemarks]            = useState("");
  const [isSaving,           setIsSaving]           = useState(false);
  const [isNewModalOpen,     setIsNewModalOpen]      = useState(false);
  const [newDate,            setNewDate]             = useState("");
  const [newStartTime,       setNewStartTime]        = useState("");
  const [newEndTime,         setNewEndTime]           = useState("");
  // -- Manage Booking extra state --
  const [selectedPriorityIdx, setSelectedPriorityIdx] = useState(0);
  const [remarksScope,       setRemarksScope]       = useState(["Student", "JrAssistant"]);
  const [proposedOptions,    setProposedOptions]    = useState([]);
  const [activeDateIndex,    setActiveDateIndex]    = useState(0);
  const [selectedProposalIndices, setSelectedProposalIndices] = useState([]);

  const [newReq, setNewReq] = useState({
    club: "", clubOther: "", activity: "", activityOther: "",
    purpose: "", date: "", startTime: "", endTime: "", email: ""
  });

  // ── Read logged-in user ──────────────────────────────────────
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const facultyName = (user.name || "").toLowerCase();
  const facultyId = user._id || user.id;

  const load = async () => {
    if (!facultyId) return;
    setLoading(true);
    try {
      const [inc, mine] = await Promise.all([
        fetchBookingsByFaculty(facultyId),
        fetchBookingsByRequester(facultyId)
      ]);
      const norm = (arr) => arr.map(b => ({
        ...b,
        id: b._id,
        tracker: b.tracker || { faculty: "pending", jrAssistant: "pending", superintendent: "pending", ar: "pending" },
        studentName: b.requester?.name || "Student",
        facultyName: b.facultyInCharge?.name || "—",
        slot: b.allocatedSlot || (b.priorities && b.priorities[0]) || {}
      }));
      setIncoming(norm(inc));
      setMyRequests(norm(mine));
      setError(null);
    } catch (e) {
      console.error("Faculty Approvals load error:", e);
      setError(e.message || "Unknown error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [facultyId]);

  const trackerStages = [
    { key: "faculty", label: "Faculty" },
    { key: "jrAssistant", label: "JR Assistant" },
    { key: "superintendent", label: "Superintendent" },
    { key: "ar", label: "AR" },
  ];

  const parseTimeValue = (time) => {
    if (!time) return 0;
    const [h, m] = time.split(":").map(Number);
    return h + (m || 0) / 60;
  };

  // Normalize venue names for matching courseData venues
  const normalizeVenue = (str) => (str || "").replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const checkVenueMatch = (v1, v2) => {
    if (!v1 || !v2) return false;
    const a = normalizeVenue(v1), b = normalizeVenue(v2);
    if (a === b) return true;
    if ((a === 'AUDI' && b === 'AUDITORIUM') || (b === 'AUDI' && a === 'AUDITORIUM')) return true;
    return false;
  };

  const getFacultyMySchedule = (date, currentId) => {
    if (!date) return [];
    const dayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(date + "T00:00:00").getDay()];
    const events = [];
    const enrolledMap = new Set(user?.enrolledCourses || []);

    // 1. Add all bookings on the same date intended for this faculty
    incoming.forEach(b => {
      const isCurrent = b.id === currentId;
      // Get the correct priority date if multiple. Fallback to slot.date
      const activePriority = isCurrent && b.priorities ? b.priorities[selectedPriorityIdx] : (b.priorities?.[0] || b.slot || {});
      const d = isCurrent && decision === 'modify' && proposedOptions[activeDateIndex]?.date ? proposedOptions[activeDateIndex].date : activePriority.date;
      
      if (d === date) {
        events.push({
          id: b.id,
          title: b.activityType,
          venue: activePriority.venueName || "TBD",
          time: `${fmtTime(activePriority.startTime)} - ${fmtTime(activePriority.endTime)}`,
          startRaw: activePriority.startTime,
          endRaw: activePriority.endTime,
          sort: parseTimeValue(activePriority.startTime),
          status: b.status || "Pending",
          type: "Booking",
          current: isCurrent,
          isOtherPending: !isCurrent && (b.status === "Pending" || b.status === "Action Required")
        });
      }
    });

    // 2. Add ALL courses the faculty is enrolled in
    courseData.forEach(course => {
      if (!course || !course.venue) return;
      if (enrolledMap.has(course.code)) {
        course.schedule?.forEach(slot => {
          if (slot.day === dayName && slot.time) {
            const parts = slot.time.split(" - ");
            events.push({
              id: `course-${course.code}-${slot.day}-${slot.time}`,
              title: course.name || course.code,
              venue: course.venue,
              time: slot.time,
              startRaw: parts[0],
              endRaw: parts[1],
              sort: parseTimeValue(parts[0]),
              status: "Course",
              type: "Course",
              current: false,
              isOtherPending: false
            });
          }
        });
      }
    });

    return events.sort((a, b) => a.sort - b.sort);
  };

  const computeFreeTimeSlots = async (dateStr, currentId, venueId, minDurationMinutes = 60) => {
    const startOfDay = 8 * 60; // 08:00
    const endOfDay = 23 * 60;  // 23:00

    // Get faculty's schedule
    const facultyOccupied = getFacultyMySchedule(dateStr, currentId)
       .filter(evt => evt.startRaw && evt.endRaw && !evt.current)
       .map(evt => ({
          start: parseTimeValue(evt.startRaw) * 60, // Convert hours to minutes
          end: parseTimeValue(evt.endRaw) * 60
       }));

    // Get existing bookings on this venue for this date
    let venueBookings = [];
    if (venueId) {
      try {
        venueBookings = await fetchBookingsByVenueDate(venueId, dateStr);
        // Exclude the current booking being reviewed
        venueBookings = venueBookings.filter(b => b._id !== currentId);
      } catch (error) {
        console.error("Error fetching venue bookings:", error);
      }
    }

    const venueOccupied = venueBookings
      .map(booking => {
        // Use allocatedSlot if approved, otherwise use priorities
        const slot = booking.allocatedSlot || (booking.priorities && booking.priorities[0]);
        if (slot && slot.startTime && slot.endTime) {
          return {
            start: parseTimeValue(slot.startTime) * 60,
            end: parseTimeValue(slot.endTime) * 60
          };
        }
        return null;
      })
      .filter(Boolean);

    // Combine faculty schedule and venue bookings
    const occupied = [...facultyOccupied, ...venueOccupied]
       .sort((a, b) => a.start - b.start);
    
    const merged = [];
    occupied.forEach(occ => {
       if (merged.length === 0) { merged.push(occ); }
       else {
          const last = merged[merged.length - 1];
          if (occ.start <= last.end) {
             last.end = Math.max(last.end, occ.end);
          } else {
             merged.push(occ);
          }
       }
    });

    const freeSlots = [];
    let currentFreeStart = startOfDay;
    
    merged.forEach(occ => {
       if (occ.start > currentFreeStart) {
          const duration = occ.start - currentFreeStart;
          if (duration >= minDurationMinutes) {
             freeSlots.push({ start: currentFreeStart, end: occ.start });
          }
       }
       currentFreeStart = Math.max(currentFreeStart, occ.end);
    });
    
    // Handle the end of day
    if (endOfDay > currentFreeStart) {
       const duration = endOfDay - currentFreeStart;
       if (duration >= minDurationMinutes) {
          freeSlots.push({ start: currentFreeStart, end: endOfDay });
       }
    }

    const fmtFromMins = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return freeSlots.map(fs => ({
        startTime: fmtFromMins(fs.start),
        endTime: fmtFromMins(fs.end)
    }));
  };

  const generateProposals = async (baseDateStr, currentId, venueId, minDurationMinutes) => {
    if (!baseDateStr) return [];
    let baseDate = new Date(baseDateStr);
    if (isNaN(baseDate)) {
      const ts = Date.parse(baseDateStr);
      if (!isNaN(ts)) baseDate = new Date(ts);
      else return [];
    }

    const dMinus1 = new Date(baseDate); dMinus1.setDate(baseDate.getDate() - 1);
    const dPlus1 = new Date(baseDate); dPlus1.setDate(baseDate.getDate() + 1);
    const dPlus2 = new Date(baseDate); dPlus2.setDate(baseDate.getDate() + 2);

    const formatD = (d) => {
        const yr = d.getFullYear();
        const mo = (d.getMonth() + 1).toString().padStart(2, '0');
        const da = d.getDate().toString().padStart(2, '0');
        return `${yr}-${mo}-${da}`;
    };

    const slots1 = await computeFreeTimeSlots(formatD(dMinus1), currentId, venueId, minDurationMinutes);
    const slots2 = await computeFreeTimeSlots(formatD(dPlus1), currentId, venueId, minDurationMinutes);
    const slots3 = await computeFreeTimeSlots(formatD(dPlus2), currentId, venueId, minDurationMinutes);

    return [
      { id: Date.now() + 1, date: formatD(dMinus1), timeSlots: slots1 },
      { id: Date.now() + 2, date: formatD(dPlus1), timeSlots: slots2 },
      { id: Date.now() + 3, date: formatD(dPlus2), timeSlots: slots3 },
    ];
  };

  // ── Display list based on active tab ─────────────────────────
  const pool = activeType === "incoming" ? incoming : myRequests;
  const displayed = pool.filter(r => {
    const ms = filterStatus === "all" || (r.status || "").toLowerCase() === filterStatus.toLowerCase();
    return ms;
  });

  const activeReviewPriority = reviewTarget?.priorities?.[selectedPriorityIdx] || reviewTarget?.slot || {};
  const activeTimelineDate = (decision === 'modify' && proposedOptions[activeDateIndex]?.date) ? proposedOptions[activeDateIndex].date : activeReviewPriority.date;
  const reviewFacultyEvents = reviewTarget ? getFacultyMySchedule(activeTimelineDate, reviewTarget.id) : [];

  // ── Faculty decision ─────────────────────────────────────────
  const handleDecision = async () => {
    if (!decision) return;
    if (decision === 'modify' && selectedProposalIndices.length === 0) {
      return alert("Please select at least one date option to propose to the student.");
    }
    setIsSaving(true);
    const actionMap = { approve: "approved", reject: "rejected", modify: "changes_requested" };
    try {
      // Filter proposedOptions to only include selected ones
      const pChanges = decision === 'modify' ? proposedOptions.filter((_, idx) => selectedProposalIndices.includes(idx)) : null;
      await submitFacultyDecision(reviewTarget.id, actionMap[decision], remarks, pChanges, remarksScope);
      setIncoming(prev => prev.map(b => b.id === reviewTarget.id
        ? { ...b, status: decision === "approve" ? "Pending" : decision === "reject" ? "Rejected" : "Action Required", tracker: { ...b.tracker, faculty: actionMap[decision] } }
        : b
      ));
      setIsReviewOpen(false);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit decision.");
    } finally {
      setIsSaving(false);
    }
  };

  const previewActivity = newReq.activity === "Other" ? (newReq.activityOther || "Activity Title") : (newReq.activity || "Activity Title");
  const previewClub    = newReq.club === "Other"     ? (newReq.clubOther    || "Club Name")      : (newReq.club    || "Club / Board");

  if (loading) return (
    <div className="mt-20 flex flex-col items-center justify-center gap-3 text-gray-400">
      <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      <p className="text-sm font-bold">Loading bookings…</p>
    </div>
  );

  return (
    <div className="relative mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">

      {/* ── TABS + FILTER ROW ─────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex bg-gray-100/80 dark:bg-navy-800/60 backdrop-blur-md p-1 rounded-xl border border-gray-200 dark:border-navy-700/50">
          {[
            { key: "incoming", label: "Incoming Approvals", count: incoming.filter(b => b.tracker?.faculty === "pending").length },
            { key: "sent",     label: "My Requests",         count: myRequests.length }
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setActiveType(key)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all relative ${activeType === key ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-navy-700 dark:hover:text-white"}`}
            >
              {label}
              {count > 0 && <span className="ml-1.5 bg-white/25 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MdFilterList size={16} className="text-brand-500" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white">
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Action Required">Action Required</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button onClick={load} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors" title="Refresh">
            <MdRefresh size={18} />
          </button>
        </div>
      </div>

      {/* ── BULK ACTION BAR ──────────────────────────────────── */}
      <div className={`overflow-hidden transition-all duration-500 ${selected.length > 0 ? "h-16 opacity-100 mb-5" : "h-0 opacity-0"}`}>
        <div className="h-full flex items-center justify-between rounded-2xl bg-brand-500 px-6 text-white shadow-lg shadow-brand-500/30">
          <div className="flex items-center gap-2 font-bold text-sm"><MdOutlineLibraryAddCheck size={20} /> {selected.length} Selected</div>
          <div className="flex gap-2">
            <button className="rounded-xl bg-white/20 px-5 py-1.5 text-sm font-bold hover:bg-white/30 transition-all">Reject All</button>
            <button className="rounded-xl bg-white px-5 py-1.5 text-sm font-bold text-brand-500 hover:bg-gray-50 transition-all shadow-md">Approve All</button>
          </div>
        </div>
      </div>

      {/* ── CARDS GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {displayed.map(req => {
          const cfg = sConfig(req.status);
          const isSelected = selected.includes(req.id);
          const pendingFaculty = req.tracker?.faculty === "pending" && activeType === "incoming";
          return (
            <div key={req.id}
              className={`group relative flex flex-col rounded-[18px] bg-white/90 backdrop-blur-md shadow-sm border-y border-r border-gray-100 border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-navy-800/90 dark:border-navy-700 ${cfg.border} ${cfg.shadow} overflow-hidden`}
            >
              {pendingFaculty && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 to-indigo-600 animate-pulse" />
              )}
              {/* Multi-select */}
              <div className="absolute top-4 right-4 z-10" onClick={e => { e.stopPropagation(); setSelected(prev => prev.includes(req.id) ? prev.filter(x => x !== req.id) : [...prev, req.id]); }}>
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${isSelected ? "bg-brand-500 border-brand-500" : "border-gray-300 dark:border-navy-600 hover:border-brand-400"}`}>
                  {isSelected && <MdCheckCircle size={13} className="text-white" />}
                </div>
              </div>

              <div className="p-5 pr-10">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-base font-bold tracking-wide text-navy-700 dark:text-white flex-1 truncate">{req.activityType}</h3>
                  <span className={`flex-shrink-0 rounded-md px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${cfg.bg} ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`}>
                    {req.status || "Pending"}
                  </span>
                </div>

                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <MdCorporateFare size={11} /> {req.clubName || "—"} · <span className="text-brand-400">{req.studentName}</span>
                </p>

                <div className="rounded-xl bg-gray-50 dark:bg-navy-900/60 border border-gray-100 dark:border-navy-700 p-3 space-y-1.5 mb-3">
                  <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">
                    {req.allocatedSlot ? "Allocated Slot" : "Requested Slot"}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-navy-700 dark:text-gray-200">
                    <MdLocationOn size={12} className="text-brand-500 flex-shrink-0" />
                    {req.slot?.venueName || "TBD"}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><MdCalendarMonth size={11} /> {fmtDate(req.slot?.date)}</span>
                    <span className="flex items-center gap-1"><MdAccessTime size={11} /> {fmtTime(req.slot?.startTime)} – {fmtTime(req.slot?.endTime)}</span>
                  </div>
                </div>

                <WorkflowBar tracker={req.tracker} />

                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-navy-700 flex flex-col gap-3">
                  <button type="button" onClick={(e) => { e.stopPropagation(); setDetailTarget(req); setDetailTab("Details"); setIsDetailOpen(true); setNewDate(req.slot?.date || ""); setNewStartTime(req.slot?.startTime || ""); setNewEndTime(req.slot?.endTime || ""); }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-brand-500 hover:bg-brand-50 transition-all dark:border-navy-700 dark:bg-navy-900 dark:text-white">
                    View Details
                  </button>
                  <button type="button" disabled={!pendingFaculty} onClick={(e) => { e.stopPropagation(); setReviewTarget(req); setDecision(""); setRemarks(""); setIsReviewOpen(true); }}
                    className={`w-full rounded-xl px-4 py-2 text-sm font-bold transition-all ${pendingFaculty ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-navy-700 dark:text-gray-400"}`}>
                    {pendingFaculty ? "Manage Booking" : "Review Booking"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-gray-200 dark:border-navy-700">
            <MdCalendarMonth className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">No requests found</h3>
            <p className="text-sm text-gray-500 mt-1">Adjust filters or wait for new submissions.</p>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DETAILS DRAWER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={`fixed inset-0 z-[100] bg-navy-900/60 backdrop-blur-sm transition-opacity duration-500 ${isDetailOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => { setIsDetailOpen(false); setDetailTarget(null); }} />
      {detailTarget && (
        <div className={`fixed right-0 top-0 z-[101] h-full w-full max-w-md bg-white shadow-2xl transition-all duration-500 ease-out dark:bg-navy-800 ${isDetailOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div onClick={(e) => e.stopPropagation()} className="flex h-full flex-col">
            <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-navy-700 bg-gradient-to-r from-brand-500/8 to-indigo-500/8">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`h-2 w-2 rounded-full ${sConfig(detailTarget.status).dot}`} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 dark:text-brand-400">
                    ID: {detailTarget.id}
                  </p>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-navy-700 dark:text-white">{detailTarget.activityType}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{detailTarget.clubName}</p>
              </div>
              <button onClick={() => { setIsDetailOpen(false); setDetailTarget(null); }} className="rounded-full p-2 bg-gray-100 dark:bg-navy-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors">
                <MdClose className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b border-gray-100 px-6 dark:border-navy-700">
              {["Details", "Tracker", "E-Ticket"].map(tab => (
                <button
                  key={tab} onClick={() => setDetailTab(tab)}
                  className={`mr-6 py-3.5 text-sm font-bold transition-all relative ${detailTab === tab ? "text-brand-500" : "text-gray-400 hover:text-navy-700 dark:hover:text-white"}`}>
                  {tab}
                  {detailTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-500 rounded-t-full" />}
                </button>
              ))}
            </div>

            <div className="p-6 h-[calc(100vh-165px)] overflow-y-auto space-y-4">
              {detailTab === "Details" && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                    <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MdPerson size={12} /> Requester Info
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Name</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{detailTarget.studentName}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Entry No.</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{detailTarget.entryNo}</p></div>
                      <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Mobile</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{detailTarget.mobile}</p></div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                    <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MdEvent size={12} /> Event Logistics
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Club</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{detailTarget.clubName}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Activity</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{detailTarget.activityType}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Audience</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{detailTarget.audienceCount ?? "—"} people</p></div>
                      <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Purpose</p><p className="font-medium text-navy-700 dark:text-gray-300 text-sm mt-0.5">{detailTarget.purpose || "—"}</p></div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                    <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MdLocationOn size={12} /> Venue & Schedule
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">Venue</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{detailTarget.venueName}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Date</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{fmtDate(detailTarget.slot?.date)}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Faculty</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{detailTarget.facultyName}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">Start</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{fmtTime(detailTarget.slot?.startTime)}</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-gray-400">End</p><p className="font-bold text-navy-700 dark:text-white mt-0.5 text-sm">{fmtTime(detailTarget.slot?.endTime)}</p></div>
                    </div>
                  </div>

                  {detailTarget.priorities?.length > 1 && (
                    <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
                      <h3 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <MdPendingActions size={12} /> Requested Priorities
                      </h3>
                      <div className="space-y-3">
                        {detailTarget.priorities.map((priority, index) => (
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

              {detailTab === "Tracker" && (
                <div className="relative pl-4 pt-2 pb-10">
                  <div className="absolute left-[23px] top-6 bottom-4 border-l-2 border-dashed border-brand-300/40 dark:border-brand-500/20" />
                  <div className="flex flex-col gap-7">
                    <div className="relative flex items-start gap-4">
                      <div className="z-10 mt-1 h-4 w-4 rounded-full border-4 border-white dark:border-navy-800 bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" />
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-navy-700 dark:text-white text-sm">Student Submission</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 font-bold uppercase">Done</span>
                        </div>
                      </div>
                    </div>
                    {trackerStages.map(({ key, label }) => {
                      const s = detailTarget.tracker[key];
                      const dotColor = s === "approved" ? "bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]"
                        : s === "changes_requested" ? "bg-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.2)] animate-pulse"
                        : s === "rejected" ? "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
                        : "bg-gray-300 dark:bg-gray-600";
                      const badgeCfg = { approved: "bg-green-500/15 text-green-500", changes_requested: "bg-orange-500/15 text-orange-500 animate-pulse", rejected: "bg-red-500/15 text-red-500", pending: "bg-gray-200 text-gray-400 dark:bg-navy-700" };
                      const badgeLabel = { approved: "Approved", changes_requested: "Action Required", rejected: "Rejected", pending: "Pending" };
                      return (
                        <div key={key} className={`relative flex items-start gap-4 transition-opacity ${detailTarget.tracker[key] === "pending" ? "opacity-40" : ""}`}>
                          <div className={`z-10 mt-1 h-4 w-4 rounded-full border-4 border-white dark:border-navy-800 ${dotColor}`} />
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-navy-700 dark:text-white text-sm">{label}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeCfg[s] || badgeCfg.pending}`}>
                                {badgeLabel[s] || "Pending"}
                              </span>
                            </div>
                            {key === "faculty" && detailTarget.tracker[key] === "changes_requested" && (
                              <div className="mt-3 rounded-xl bg-orange-50 p-4 border border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20">
                                <p className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                                  <MdInfoOutline size={12} /> Faculty Comment
                                </p>
                                <p className="text-sm font-medium text-navy-700 dark:text-gray-300 mb-4">"{detailTarget.facultyComment}"</p>
                                <div className="border-t border-orange-200 dark:border-orange-500/20 pt-3 grid gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">New Date</label>
                                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full mt-1 rounded-lg border border-gray-200 p-2 text-xs outline-none dark:bg-navy-900 dark:border-navy-700 dark:text-white" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">Start</label>
                                      <input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="w-full mt-1 rounded-lg border border-gray-200 p-2 text-xs outline-none dark:bg-navy-900 dark:border-navy-700 dark:text-white" />
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase">End</label>
                                      <input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} className="w-full mt-1 rounded-lg border border-gray-200 p-2 text-xs outline-none dark:bg-navy-900 dark:border-navy-700 dark:text-white" />
                                    </div>
                                  </div>
                                  <button className="mt-1 w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 text-xs font-bold text-white hover:bg-orange-600 shadow-md shadow-orange-500/20">
                                    <MdUpdate size={13} /> Resubmit Request
                                  </button>
                                </div>
                              </div>
                            )}

                            {key === "jrAssistant" && detailTarget.tracker[key] === "rejected" && detailTarget.comments?.jrAssistantComment && (
                              <div className="mt-3 rounded-xl bg-red-50 p-4 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
                                <p className="text-[10px] font-black uppercase tracking-wider text-red-500 dark:text-red-400 mb-2 flex items-center gap-1">
                                  <MdInfoOutline size={12} /> JR Assistant Remark
                                </p>
                                <p className="text-sm font-medium text-navy-700 dark:text-gray-200 italic">"{detailTarget.comments.jrAssistantComment}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {detailTab === "E-Ticket" && (
                <div className="py-2">
                  {detailTarget.status === "Approved" ? (
                    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200 dark:bg-navy-900 dark:border-navy-700">
                      <div className="bg-gradient-to-r from-brand-500 to-indigo-600 py-4 text-center">
                        <h3 className="text-sm font-black tracking-widest text-white">IITR SYNC</h3>
                        <p className="text-[10px] text-white/70 mt-0.5 uppercase tracking-widest">Room Booking Ticket</p>
                      </div>
                      <div className="border-b-2 border-dashed border-gray-200 p-5 text-center dark:border-navy-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Booking ID</p>
                        <p className="text-xl font-black text-navy-700 dark:text-white mt-1 font-mono">{detailTarget.id}</p>
                      </div>
                      <div className="border-b-2 border-dashed border-gray-200 p-5 grid grid-cols-2 gap-4 dark:border-navy-700">
                        <div><p className="text-[10px] font-bold uppercase text-gray-400">Venue</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{detailTarget.venueName}</p></div>
                        <div className="text-right"><p className="text-[10px] font-bold uppercase text-gray-400">Date</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{fmtDate(detailTarget.slot?.date)}</p></div>
                        <div className="col-span-2 text-center">
                          <p className="text-[10px] font-bold uppercase text-gray-400">Time</p>
                          <p className="font-bold text-navy-700 dark:text-white mt-1">{fmtTime(detailTarget.slot?.startTime)} – {fmtTime(detailTarget.slot?.endTime)}</p>
                        </div>
                      </div>
                      <div className="p-5 flex justify-center">
                        <div className="p-3 border border-gray-100 rounded-xl bg-white dark:bg-white shadow-sm">
                          <MdQrCode2 className="h-24 w-24 text-navy-900" />
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
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          REVIEW MODAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/70 backdrop-blur-sm transition-all duration-300 p-4 ${isReviewOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row rounded-[24px] bg-white shadow-2xl transition-all duration-300 dark:bg-navy-800 ${isReviewOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-6"}`}>

          {/* Left: My Schedule Timeline */}
          <div className="w-full md:w-[38%] bg-gray-50 p-5 border-r border-gray-100 dark:bg-navy-900 dark:border-navy-700 flex flex-col overflow-y-auto max-h-[85vh]">
            <h3 className="text-[10px] font-black tracking-widest text-brand-500 uppercase flex items-center gap-1.5 mb-1">
                <MdCalendarMonth size={14} /> My Schedule Timeline
            </h3>
            <p className="text-xs text-brand-500 font-semibold mb-4">
              {activeReviewPriority?.venueName || "Venue"} · {fmtDate(activeTimelineDate)}
            </p>
            {reviewTarget && (
              <>
                {/* Priority Selection */}
                {reviewTarget.priorities && reviewTarget.priorities.length > 1 && (
                  <div className="rounded-xl bg-white border border-gray-200 p-2 mb-4 dark:bg-navy-800 dark:border-navy-700">
                    <p className="text-[9px] px-1 font-bold text-gray-400 mb-1.5 uppercase">Select Priority to Review</p>
                    <div className="flex gap-2">
                    {reviewTarget.priorities.map((p, i) => (
                      <button key={i} onClick={() => { setSelectedPriorityIdx(i); setProposedOptions([]); setActiveDateIndex(0); }} className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors ${selectedPriorityIdx === i ? 'bg-brand-500 text-white border-brand-500' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-navy-900 dark:border-navy-700 dark:text-gray-400'}`}>
                        P{i+1}: {p.venueName}
                      </button>
                    ))}
                    </div>
                  </div>
                )}
                {/* Visual timeline */}
                <div className="relative pl-5 mb-4">
                  {/* Vertical line */}
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-navy-700" />

                  {reviewFacultyEvents.length > 0 ? (
                    <div className="space-y-3">
                      {reviewFacultyEvents.map(evt => {
                        const isCurrent = evt.current;
                        const isCourse = evt.type === "Course";
                        const dotColor = isCurrent ? "bg-brand-500 ring-4 ring-brand-500/20" 
                          : isCourse ? "bg-indigo-500 ring-2 ring-indigo-500/20" 
                          : evt.isOtherPending ? "bg-amber-400 ring-2 ring-amber-400/20"
                          : "bg-gray-400 ring-2 ring-gray-300/30 dark:ring-gray-600/30";
                        const cardBorder = isCurrent ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10 dark:bg-brand-500/10" 
                          : isCourse ? "border-indigo-200 bg-white dark:border-indigo-500/20 dark:bg-navy-800" 
                          : evt.isOtherPending ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-900/10"
                          : "border-gray-200 bg-white dark:border-navy-700 dark:bg-navy-800";

                        return (
                          <div key={evt.id} className="relative">
                            {/* Timeline dot */}
                            <div className={`absolute -left-5 top-3 h-2.5 w-2.5 rounded-full ${dotColor} z-10`} />

                            <div className={`rounded-xl border p-3 transition-all ${cardBorder}`}>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className={`text-xs font-bold ${isCurrent ? "text-brand-600 dark:text-brand-400" : "text-navy-700 dark:text-white"}`}>
                                  {isCurrent && "⟶ "}{evt.title}
                                </p>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  isCurrent ? "bg-brand-500 text-white" 
                                  : isCourse ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300" 
                                  : evt.isOtherPending ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                                  : "bg-gray-100 text-gray-500 dark:bg-navy-700 dark:text-gray-300"
                                }`}>
                                  {isCurrent ? "This Booking" : (evt.isOtherPending ? "Pending Request" : evt.type)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                                <MdAccessTime size={11} className={isCurrent ? "text-brand-500" : "text-gray-400"} />
                                <span className="font-semibold">{evt.time}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center text-center">
                      <div className="rounded-full bg-green-100 dark:bg-green-500/10 p-3 mb-3">
                        <MdCheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">Schedule is Free</p>
                      <p className="text-xs text-gray-400 mt-1">No classes or pending incoming bookings today.</p>
                    </div>
                  )}
                </div>

                {/* Conflict detection */}
                {(() => {
                  const currentEvt = reviewFacultyEvents.find(e => e.current);
                  const overlaps = currentEvt ? reviewFacultyEvents.filter(e => !e.current && e.startRaw && currentEvt.startRaw && (
                    (parseTimeValue(e.startRaw) < parseTimeValue(currentEvt.endRaw)) && 
                    (parseTimeValue(e.endRaw) > parseTimeValue(currentEvt.startRaw))
                  )) : [];
                  
                  if (overlaps.length > 0) {
                    return (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-4 dark:bg-red-500/10 dark:border-red-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                          ⚠ Time Conflict Detected
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Overlaps with: {overlaps.map(o => o.title).join(", ")}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Requester, Event, and Purpose information removed as per request */}
              </>
            )}
          </div>

          {/* Right: decision panel */}
          <div className="w-full md:flex-1 flex flex-col">
            <div className="flex justify-between items-start p-6 border-b border-gray-100 dark:border-navy-700">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Faculty Decision</p>
                <h2 className="text-xl font-bold text-navy-700 dark:text-white">{reviewTarget?.activityType}</h2>
              </div>
              <button onClick={() => { 
                setIsReviewOpen(false); 
                setReviewTarget(null);
                setDecision("");
                setRemarks("");
                setProposedOptions([]);
                setSelectedProposalIndices([]);
              }} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-400 transition-colors">
                <MdClose size={22} />
              </button>
            </div>

            <div className="p-7 flex-1 overflow-y-auto">
              {/* Decision tiles */}
              {reviewTarget?.tracker?.faculty === "pending" ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mb-4">Your Decision</p>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { val: "approve", icon: MdCheckCircle, label: "Approve", active: "border-green-500 bg-green-50 dark:bg-green-500/10", iconColor: "text-green-500", textColor: "text-green-700 dark:text-green-400" },
                      { val: "modify",  icon: MdEdit,        label: "Request Changes", active: "border-orange-500 bg-orange-50 dark:bg-orange-500/10", iconColor: "text-orange-500", textColor: "text-orange-700 dark:text-orange-400" },
                      { val: "reject",  icon: MdCancel,      label: "Reject", active: "border-red-500 bg-red-50 dark:bg-red-500/10", iconColor: "text-red-500", textColor: "text-red-700 dark:text-red-400" },
                    ].map(({ val, icon: Icon, label, active, iconColor, textColor }) => (
                      <label key={val} className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${decision === val ? active : "border-gray-200 hover:border-gray-300 dark:border-navy-700"}`}>
                        <input type="radio" name="decision" className="hidden" onChange={() => { 
                          setDecision(val); 
                          if (val === 'modify' && proposedOptions.length === 0 && activeReviewPriority?.date) {
                            const requestedStart = parseTimeValue(activeReviewPriority.startTime) * 60;
                            const requestedEnd = parseTimeValue(activeReviewPriority.endTime) * 60;
                            const minDuration = requestedEnd - requestedStart;
                            generateProposals(activeReviewPriority.date, reviewTarget.id, activeReviewPriority.venueId, minDuration).then(opts => {
                              setProposedOptions(opts);
                              // Auto-select first date when generated
                              setSelectedProposalIndices([0]);
                            });
                            setActiveDateIndex(0);
                          }
                        }} />
                        <Icon className={`mx-auto mb-2 h-6 w-6 ${decision === val ? iconColor : "text-gray-400"}`} />
                        <span className={`text-xs font-bold ${decision === val ? textColor : "text-gray-500"}`}>{label}</span>
                      </label>
                    ))}
                  </div>

                  {decision === "modify" && (
                    <div className="mb-4 space-y-3 max-h-96 overflow-y-auto pr-2">
                      <p className="text-[10px] font-bold uppercase text-gray-500 mb-3 flex items-center gap-1.5">
                        <MdCheckCircle size={12} className="text-brand-500" />
                        Select Options to Propose (1-3 dates)
                      </p>
                      {proposedOptions.map((opt, idx) => {
                        const isSelected = selectedProposalIndices.includes(idx);
                        return (
                          <div key={opt.id || idx} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 shadow-md shadow-brand-500/10' : 'border-gray-200 bg-white dark:bg-navy-900 dark:border-navy-700 hover:border-gray-300'}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedProposalIndices(prev => prev.filter(i => i !== idx));
                              } else {
                                setSelectedProposalIndices(prev => [...prev, idx]);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2 flex-1">
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedProposalIndices(prev => prev.filter(i => i !== idx));
                                    } else {
                                      setSelectedProposalIndices(prev => [...prev, idx]);
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-gray-300 dark:bg-navy-800 dark:border-navy-600 cursor-pointer"
                                />
                                <input 
                                  type="date" 
                                  value={opt.date} 
                                  onChange={async e => {
                                    e.stopPropagation();
                                    const requestedStart = parseTimeValue(activeReviewPriority.startTime) * 60;
                                    const requestedEnd = parseTimeValue(activeReviewPriority.endTime) * 60;
                                    const minDuration = requestedEnd - requestedStart;
                                    const newOptions = [...proposedOptions];
                                    newOptions[idx].date = e.target.value;
                                    newOptions[idx].timeSlots = await computeFreeTimeSlots(e.target.value, reviewTarget?.id, activeReviewPriority.venueId, minDuration);
                                    setProposedOptions(newOptions);
                                  }} 
                                  className="bg-transparent text-sm font-bold text-navy-700 dark:text-white outline-none cursor-text"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              {isSelected && <span className="text-[10px] font-extrabold text-brand-500 uppercase tracking-widest flex items-center gap-1"><MdCheckCircle size={12}/> Selected</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {opt.timeSlots.map((ts, tsIdx) => (
                                <div key={tsIdx} className="flex items-center gap-1 rounded-full bg-white border border-gray-200 dark:border-navy-600 dark:bg-navy-800 px-3 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{fmtTime(ts.startTime)} - {fmtTime(ts.endTime)}</span>
                                  <button type="button" onClick={(e) => {
                                    e.stopPropagation();
                                    const newOptions = [...proposedOptions];
                                    newOptions[idx].timeSlots = opt.timeSlots.filter((_, i) => i !== tsIdx);
                                    setProposedOptions(newOptions);
                                  }} className="text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full p-0.5 transition-colors"><MdClose size={12}/></button>
                                </div>
                              ))}
                              {opt.timeSlots.length === 0 && <span className="text-xs text-red-500 font-semibold">No auto-generated slots available.</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block">
                      {decision === "modify" ? "Explanation for Student (Required)" : "Remarks (Optional)"}
                    </label>
                    <textarea rows={3} value={remarks} onChange={e => setRemarks(e.target.value)}
                      placeholder={decision === "modify" ? "Describe why the dates were changed…" : "Leave a note…"}
                      className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white text-sm resize-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={remarksScope.includes("Student")} onChange={e => setRemarksScope(e.target.checked ? [...remarksScope, "Student"] : remarksScope.filter(s => s !== "Student"))} className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-gray-300 dark:bg-navy-900 dark:border-navy-600" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Show to Student</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={remarksScope.includes("JrAssistant")} onChange={e => setRemarksScope(e.target.checked ? [...remarksScope, "JrAssistant"] : remarksScope.filter(s => s !== "JrAssistant"))} className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 border-gray-300 dark:bg-navy-900 dark:border-navy-600" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Show to Jr. Assistant</span>
                    </label>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-navy-900/60 border border-gray-100 dark:border-navy-700">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {reviewTarget?.tracker?.faculty === "approved" ? "✅ You have already approved this request. It is now with the Jr. Assistant." :
                     reviewTarget?.tracker?.faculty === "rejected" ? "🚫 You rejected this request." :
                     "↩️ You requested changes. Awaiting student resubmission."}
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/50 dark:bg-navy-900/30 dark:border-navy-700 flex items-center justify-between">
              <button onClick={() => setIsReviewOpen(false)} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Close</button>
              {reviewTarget?.tracker?.faculty === "pending" && (
                <button disabled={!decision || (decision === "modify" && (selectedProposalIndices.length === 0 || !remarks.trim())) || isSaving} onClick={handleDecision}
                  className={`px-7 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${decision && !(decision === "modify" && (selectedProposalIndices.length === 0 || !remarks.trim())) && !isSaving ? "bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/20" : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-navy-700 dark:text-gray-500"}`}>
                  {isSaving ? "Submitting…" : `Submit Decision${decision === "modify" && selectedProposalIndices.length > 0 ? ` (${selectedProposalIndices.length} date${selectedProposalIndices.length !== 1 ? 's' : ''})` : ""}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FAB
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <button onClick={() => setIsNewModalOpen(true)}
        className="group fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(67,24,255,0.35)] transition-all duration-300 hover:w-52 hover:rounded-full">
        <span className="absolute right-14 whitespace-nowrap text-sm font-bold opacity-0 transition-opacity duration-300 group-hover:opacity-100">Request a Booking</span>
        <MdAdd size={26} className="absolute right-4 transition-transform group-hover:rotate-90" />
      </button>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          NEW REQUEST MODAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/70 backdrop-blur-sm transition-all duration-300 p-4 ${isNewModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className={`relative w-full max-w-4xl flex flex-col md:flex-row overflow-hidden rounded-[24px] bg-white shadow-2xl transition-all duration-300 dark:bg-navy-800 ${isNewModalOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-6"}`}>

          {/* Left: Form */}
          <div className="w-full md:w-[55%] p-7 overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-navy-700 dark:text-white">Create Booking Request</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the details and submit for approval.</p>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="rounded-full p-2 bg-gray-100 dark:bg-navy-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-navy-600 transition-colors">
                <MdClose size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Club / Organizing Body</label>
                <select value={newReq.club} onChange={e => setNewReq({ ...newReq, club: e.target.value, clubOther: "" })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm">
                  <option value="">Select Club / Board…</option>
                  {CLUB_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {newReq.club === "Other" && (
                  <input type="text" value={newReq.clubOther} onChange={e => setNewReq({ ...newReq, clubOther: e.target.value })} placeholder="Enter organizing body name"
                    className="mt-2 w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" />
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Type of Activity</label>
                <select value={newReq.activity} onChange={e => setNewReq({ ...newReq, activity: e.target.value, activityOther: "" })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm">
                  <option value="">Select activity type…</option>
                  {ACTIVITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {newReq.activity === "Other" && (
                  <input type="text" value={newReq.activityOther} onChange={e => setNewReq({ ...newReq, activityOther: e.target.value })} placeholder="Specify activity…"
                    className="mt-2 w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Date</label>
                  <input type="date" value={newReq.date} onChange={e => setNewReq({ ...newReq, date: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" /></div>
                <div><label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Start</label>
                  <input type="time" value={newReq.startTime} onChange={e => setNewReq({ ...newReq, startTime: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" /></div>
                <div><label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">End</label>
                  <input type="time" value={newReq.endTime} onChange={e => setNewReq({ ...newReq, endTime: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" /></div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Purpose / Description</label>
                <textarea rows={3} value={newReq.purpose} onChange={e => setNewReq({ ...newReq, purpose: e.target.value })} placeholder="Briefly describe the purpose of the event…"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm resize-none" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">Notify Student (Email)</label>
                <input type="email" value={newReq.email} onChange={e => setNewReq({ ...newReq, email: e.target.value })} placeholder="student@iitrpr.ac.in"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" />
              </div>

              <button onClick={() => { alert("Request Submitted!"); setIsNewModalOpen(false); }}
                className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-bold flex justify-center items-center gap-2 hover:bg-brand-600 shadow-lg shadow-brand-500/25 transition-all">
                Submit Request <MdSend size={16} />
              </button>
            </div>
          </div>

          {/* Right: Live preview */}
          <div className="w-full md:flex-1 bg-gray-50 p-7 border-l border-gray-100 dark:bg-navy-900 dark:border-navy-700 flex flex-col justify-center items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">Live Ticket Preview</p>
            <div className="w-full max-w-xs rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-navy-600">
              <div className="bg-gradient-to-r from-brand-500 to-indigo-600 py-4 text-center">
                <h4 className="text-sm font-black tracking-widest text-white">IITR SYNC</h4>
                <p className="text-[10px] text-white/60 mt-0.5 uppercase tracking-widest">Booking Request</p>
              </div>
              <div className="bg-white dark:bg-navy-800 p-5 text-center border-b-2 border-dashed border-gray-200 dark:border-navy-600">
                <p className="text-base font-bold text-navy-700 dark:text-white leading-snug">{previewActivity}</p>
                <p className="text-xs text-brand-500 font-bold mt-1">{previewClub}</p>
              </div>
              <div className="bg-white dark:bg-navy-800 p-5 grid grid-cols-2 gap-3 border-b-2 border-dashed border-gray-200 dark:border-navy-600 text-center">
                <div><p className="text-[10px] font-bold uppercase text-gray-400">Date</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{newReq.date || "—"}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-gray-400">Start</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{newReq.startTime || "—"}</p></div>
                <div className="col-span-2"><p className="text-[10px] font-bold uppercase text-gray-400">End</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{newReq.endTime || "—"}</p></div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 py-3 text-center">
                <p className="text-xs font-black tracking-widest text-amber-600 dark:text-amber-400 uppercase">Status: Draft</p>
              </div>
            </div>
            {(!newReq.activity || !newReq.date) && (
              <p className="text-xs text-gray-400 mt-4 text-center flex items-center gap-1"><MdInfoOutline size={13} /> Fill in Club & Activity to see your preview</p>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}