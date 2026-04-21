import React, { useState, useEffect, useCallback } from "react";
import { fetchBookingsByDate } from "../../services/api";
import courseData from "../../variables/courseData";
import {
  MdCalendarMonth, MdAccessTime, MdClose, MdFiberManualRecord,
  MdLocationOn, MdPerson, MdRefresh, MdEvent
} from "react-icons/md";

// ── Venue master data ─────────────────────────────────────────────
const rawVenues = [
  { id: "m1",   title: "M1",       capacity: 50,  type: "Classroom",  block: "Radhakrishnan Block" },
  { id: "m2",   title: "M2",       capacity: 50,  type: "Classroom",  block: "Radhakrishnan Block" },
  { id: "m3",   title: "M3",       capacity: 100, type: "Classroom",  block: "Radhakrishnan Block" },
  { id: "m4",   title: "M4",       capacity: 100, type: "Classroom",  block: "Radhakrishnan Block" },
  { id: "m5",   title: "M5",       capacity: 195, type: "Classroom",  block: "Radhakrishnan Block" },
  { id: "m6",   title: "M6",       capacity: 180, type: "Classroom",  block: "Radhakrishnan Block" },
  { id: "audi", title: "Auditorium", capacity: 500, type: "Major Events", block: "Radhakrishnan Block" },
  { id: "cs1",  title: "CS1",      capacity: 60,  type: "Classroom",  block: "S. Ramanujan Block" },
  { id: "cs2",  title: "CS2",      capacity: 40,  type: "Classroom",  block: "S. Ramanujan Block" },
  { id: "cssh", title: "CS(SH)",   capacity: 90,  type: "Seminar Hall", block: "S. Ramanujan Block" },
  { id: "ee1",  title: "EE1",      capacity: 65,  type: "Classroom",  block: "J. C. Bose Block" },
  { id: "ee2",  title: "EE2",      capacity: 35,  type: "Classroom",  block: "J. C. Bose Block" },
  { id: "ee3",  title: "EE3",      capacity: 60,  type: "Classroom",  block: "J. C. Bose Block" },
  { id: "eesh", title: "EE(SH)",   capacity: 80,  type: "Seminar Hall", block: "J. C. Bose Block" },
  { id: "me1",  title: "ME1",      capacity: 70,  type: "Classroom",  block: "Satish Dhawan Block" },
  { id: "me2",  title: "ME2",      capacity: 35,  type: "Classroom",  block: "Satish Dhawan Block" },
  { id: "mesh", title: "ME(SH)",   capacity: 90,  type: "Seminar Hall", block: "Satish Dhawan Block" },
  { id: "cy1",  title: "CY1",      capacity: 35,  type: "Classroom",  block: "S. Bhatnagar Block" },
  { id: "cy2",  title: "CY2",      capacity: 30,  type: "Classroom",  block: "S. Bhatnagar Block" },
  { id: "cysh", title: "CY(SH)",   capacity: 90,  type: "Seminar Hall", block: "S. Bhatnagar Block" },
  { id: "s001", title: "S-001",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
  { id: "s002", title: "S-002",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
  { id: "s003", title: "S-003",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
  { id: "s102", title: "S-102",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
  { id: "s103", title: "S-103",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
  { id: "s104", title: "S-104",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
  { id: "s105", title: "S-105",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
  { id: "s106", title: "S-106",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
  { id: "s107", title: "S-107",    capacity: 72,  type: "Classroom",  block: "Super Academic Block" },
];

const gradients = [
  "from-brand-400 to-brand-600", "from-indigo-400 to-indigo-600",
  "from-purple-400 to-purple-600", "from-blue-400 to-blue-600"
];

const uniqueBlocks = [...new Set(rawVenues.map(v => v.block))];

// Normalize venue names for matching courseData venues to rawVenues
const normalizeVenue = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
const checkVenueMatch = (courseVenue, uiTitle, uiId) => {
  if (!courseVenue) return false;
  const cv = normalizeVenue(courseVenue);
  const ut = normalizeVenue(uiTitle);
  const ui = normalizeVenue(uiId);
  if (cv === ut || cv === ui) return true;
  if (cv === 'AUDI' && ut === 'AUDITORIUM') return true;
  return false;
};

const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
};

const fmtDate = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const statusCfg = (s) => {
  if (s === "Course")           return { dot: "bg-brand-500",  badge: "bg-brand-500/15 text-brand-500",  label: "Class" };
  if (s === "Approved")        return { dot: "bg-green-500",  badge: "bg-green-500/15 text-green-500",  label: "Approved" };
  if (s === "Action Required") return { dot: "bg-orange-500", badge: "bg-orange-500/15 text-orange-400", label: "Action Req." };
  return                              { dot: "bg-amber-400",  badge: "bg-amber-500/15 text-amber-400 animate-pulse", label: "Pending" };
};

const TODAY = new Date().toISOString().split("T")[0];
const NOW_HOUR = new Date().getHours() + new Date().getMinutes() / 60;

export default function FacultyRoomCalendar() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [filterDate,    setFilterDate]    = useState(TODAY);
  const [filterBlock,   setFilterBlock]   = useState("all");
  const [venueEvents,   setVenueEvents]   = useState({}); // { venueId: [booking, ...] }
  const [loading,       setLoading]       = useState(false);

  // Get faculty info
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const facultyName = user.name || "";

  const loadEvents = useCallback(async () => {
    if (!filterDate) return;
    setLoading(true);
    try {
      const bookings = await fetchBookingsByDate(filterDate);
      const grouped = {};
      
      // Add bookings grouped by venueId
      bookings.forEach(b => {
        const slot = b.allocatedSlot?.date === filterDate ? b.allocatedSlot : null;
        const priority = !slot && b.priorities?.find(p => p.date === filterDate);
        const target = slot || priority;
        if (!target) return;
        const vid = target.venueId;
        if (!grouped[vid]) grouped[vid] = [];
        grouped[vid].push({ ...b, displaySlot: target, kind: "booking" });
      });
      
      // Add ALL courses for this date (not just faculty's courses)
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(filterDate + "T00:00:00").getDay()];
      courseData
        .forEach(course => {
          if (!course || !course.venue) return;
          // Find which rawVenue matches this course's venue using normalizer
          const venueMatch = rawVenues.find(v => checkVenueMatch(course.venue, v.title, v.id));
          if (!venueMatch) return;
          const vid = venueMatch.id;
          course.schedule?.forEach(slot => {
            if (slot.day === dayName) {
              if (!grouped[vid]) grouped[vid] = [];
              grouped[vid].push({
                _id: `course-${course.code}-${slot.day}-${slot.time}`,
                activityType: course.name || course.code,
                clubName: `${course.code}`,
                requester: { name: course.instructor },
                displaySlot: {
                  startTime: slot.time.split(" - ")[0],
                  endTime: slot.time.split(" - ")[1],
                  venueId: vid
                },
                status: "Course",
                kind: "course"
              });
            }
          });
        });
      
      setVenueEvents(grouped);
    } catch (e) {
      console.error("FacultyRoomCalendar load error:", e);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filteredVenues = rawVenues
    .filter(v => filterBlock === "all" || v.block === filterBlock)
    .map((v, i) => {
      const events = venueEvents[v.id] || [];
      const isLiveBusy = filterDate === TODAY && events.some(b => {
        const slot = b.displaySlot;
        if (!slot?.startTime || !slot?.endTime) return false;
        const [sh, sm] = slot.startTime.split(":").map(Number);
        const [eh, em] = slot.endTime.split(":").map(Number);
        return NOW_HOUR >= (sh + sm / 60) && NOW_HOUR < (eh + em / 60);
      });
      return { ...v, gradient: gradients[i % gradients.length], events, isLiveBusy };
    });

  return (
    <div className="mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">

      {/* ── FILTER ROW ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3 px-1">
        <div className="relative flex items-center">
          <MdCalendarMonth className="absolute left-3 text-brand-500" size={15} />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-navy-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white" />
        </div>
        <select value={filterBlock} onChange={e => setFilterBlock(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white">
          <option value="all">All Blocks</option>
          {uniqueBlocks.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={loadEvents} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors" title="Refresh">
          <MdRefresh size={18} />
        </button>
        <span className="ml-auto text-xs font-bold text-gray-400">
          {loading ? "Loading…" : `${Object.values(venueEvents).flat().length} event(s) on ${fmtDate(filterDate)}`}
        </span>
      </div>

      {/* ── VENUE GRID ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredVenues.map(venue => (
          <div key={venue.id}
            onClick={() => setSelectedVenue(venue)}
            className="group relative cursor-pointer rounded-[18px] overflow-hidden bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* Gradient header */}
            <div className={`bg-gradient-to-r ${venue.gradient} p-5 text-white relative`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black">{venue.title}</h3>
                  <p className="text-white/70 text-xs font-bold mt-0.5">{venue.block}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${venue.isLiveBusy ? "bg-red-500/30 text-white" : "bg-white/20 text-white/80"}`}>
                  <MdFiberManualRecord size={8} className={venue.isLiveBusy ? "animate-pulse" : ""} />
                  {venue.isLiveBusy ? "LIVE BUSY" : "Available"}
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs text-white/70 font-semibold">
                <span>Cap: {venue.capacity}</span>
                <span>·</span>
                <span>{venue.type}</span>
              </div>
            </div>

            {/* Event count + preview */}
            <div className="p-4">
              {venue.events.length === 0 ? (
                <p className="text-xs text-gray-400 font-semibold text-center py-3">Free on {fmtDate(filterDate)}</p>
              ) : (
                <div className="space-y-2">
                  {venue.events.slice(0, 2).map((b, i) => {
                    const cfg = statusCfg(b.status);
                    return (
                      <div key={i} className="rounded-lg bg-gray-50 dark:bg-navy-900/60 border border-gray-100 dark:border-navy-700 px-3 py-2">
                        <p className="text-xs font-bold text-navy-700 dark:text-white truncate">{b.activityType}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                          <MdAccessTime size={10} />
                          <span>{fmtTime(b.displaySlot?.startTime)} – {fmtTime(b.displaySlot?.endTime)}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded-full font-bold ${cfg.badge}`}>{cfg.label}</span>
                        </div>
                      </div>
                    );
                  })}
                  {venue.events.length > 2 && (
                    <p className="text-[10px] font-bold text-brand-500 text-right px-1">+{venue.events.length - 2} more</p>
                  )}
                </div>
              )}

              <div className="mt-3 pt-2.5 border-t border-dashed border-gray-100 dark:border-navy-700 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-brand-500 text-center">
                View Timeline →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          VENUE DETAIL DRAWER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={`fixed inset-0 z-[100] bg-navy-900/60 backdrop-blur-sm transition-opacity duration-300 ${selectedVenue ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSelectedVenue(null)} />
      <div className={`fixed right-0 top-0 z-[101] h-full w-full max-w-[480px] bg-white shadow-2xl dark:bg-navy-800 transition-all duration-300 ease-out ${selectedVenue ? "translate-x-0" : "translate-x-full"}`}>
        {selectedVenue && (
          <>
            {/* Drawer header */}
            <div className={`bg-gradient-to-r ${selectedVenue.gradient} p-7 text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">{selectedVenue.block}</p>
                  <h2 className="text-3xl font-black">{selectedVenue.title}</h2>
                  <p className="text-white/70 text-sm mt-1">{selectedVenue.type} · Cap: {selectedVenue.capacity}</p>
                </div>
                <button onClick={() => setSelectedVenue(null)} className="rounded-full p-2 bg-white/20 hover:bg-white/30 transition-colors">
                  <MdClose className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold">
                <MdCalendarMonth size={15} /> {fmtDate(filterDate)}
                <span className={`ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${selectedVenue.isLiveBusy ? "bg-red-500/30" : "bg-white/20"}`}>
                  <MdFiberManualRecord size={8} className={selectedVenue.isLiveBusy ? "animate-pulse" : ""} />
                  {selectedVenue.isLiveBusy ? "LIVE BUSY" : "Available"}
                </span>
              </div>
            </div>

            {/* Events list */}
            <div className="p-6 h-[calc(100vh-220px)] overflow-y-auto space-y-4">
              {selectedVenue.events.length === 0 ? (
                <div className="py-12 flex flex-col items-center">
                  <MdEvent className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="font-bold text-gray-500">No events booked on this date</p>
                  <p className="text-sm text-gray-400 mt-1">This room is free all day</p>
                </div>
              ) : (
                selectedVenue.events.map((b, i) => {
                  const cfg = statusCfg(b.status);
                  const isCoursevenue = b.kind === "course";
                  return (
                    <div key={i} className="rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-700 p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-navy-700 dark:text-white text-sm">{b.activityType}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-gray-500">
                          <MdAccessTime size={12} className="text-brand-500" />
                          <span className="font-semibold">{fmtTime(b.displaySlot?.startTime)} – {fmtTime(b.displaySlot?.endTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <MdPerson size={12} className="text-brand-500" />
                          <span>{b.requester?.name || "—"} {isCoursevenue ? "(Instructor)" : `· ${b.clubName}`}</span>
                        </div>
                        {!isCoursevenue && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <MdLocationOn size={12} className="text-brand-500" />
                            <span>{b.audienceCount || "?"} attendees</span>
                          </div>
                        )}
                        {isCoursevenue && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <MdLocationOn size={12} className="text-brand-500" />
                            <span className="font-semibold text-brand-500">{b.clubName}</span>
                          </div>
                        )}
                        {b.purpose && !isCoursevenue && (
                          <div className="mt-2 p-3 rounded-xl bg-gray-50 dark:bg-navy-800 border border-gray-100 dark:border-navy-700">
                            <p className="text-gray-600 dark:text-gray-400 italic">{b.purpose}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}