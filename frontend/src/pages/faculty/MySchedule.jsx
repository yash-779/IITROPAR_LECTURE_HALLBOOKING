import React, { useState, useEffect, useCallback } from "react";
import { fetchBookingsByFaculty } from "../../services/api";
import courseData from "../../variables/courseData";
import {
  MdCalendarMonth, MdAccessTime, MdLocationOn, MdClose,
  MdCheckCircle, MdSchedule, MdInfoOutline, MdEvent, MdRefresh
} from "react-icons/md";

// ── Helpers ──────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0];

const fmtTime = (t) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
};

const fmtDate = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Color decisions ───────────────────────────────────────────────
// event.kind: "course" | "booking-approved" | "booking-pending"
const eventCfg = (kind) => {
  if (kind === "course")            return { border: "border-l-brand-500",   bg: "bg-brand-500/8",   badge: "bg-brand-500/15 text-brand-500",   label: "Class",    dot: "bg-brand-500" };
  if (kind === "booking-approved")  return { border: "border-l-green-500",   bg: "bg-green-500/8",   badge: "bg-green-500/15 text-green-500",   label: "Approved", dot: "bg-green-500" };
  return                                   { border: "border-l-amber-500",   bg: "bg-amber-500/8",   badge: "bg-amber-500/15 text-amber-400 animate-pulse", label: "Pending AR", dot: "bg-amber-500" };
};

export default function MySchedule() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);

  // Read logged-in user
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });

  const facultyId = user._id || user.id;
  const facultyName = user.name || "";
  
  // Get all courses taught by this faculty from courseData (by matching instructor name)
  const enrolledCourses = user.enrolledCourses || user.taughtCourses || [];
  const taughtCourses = enrolledCourses.length > 0 
    ? enrolledCourses 
    : courseData
        .filter((c) => c.instructor && c.instructor.toLowerCase() === facultyName.toLowerCase())
        .map((c) => c.code);

  const buildEvents = useCallback(async () => {
    setLoading(true);
    const result = [];

    // ① Course-based schedule events
    const dayName = DAY_NAMES[new Date(selectedDate + "T00:00:00").getDay()];
    taughtCourses.forEach((code) => {
      const entries = courseData.filter((c) => c.code === code);
      entries.forEach((entry) => {
        entry.schedule?.forEach((slot) => {
          if (slot.day !== dayName) return;
          const [start, end] = slot.time.split(" - ");
          result.push({
            id: `${code}-${slot.day}-${start}`,
            kind: "course",
            title: entry.name || code,
            subtitle: `${code} · ${entry.instructor || ""}`,
            venue: slot.room || "TBD",
            startTime: start,
            endTime: end,
          });
        });
      });
    });

    // ② Booking-based events (approved bookings where I'm faculty in-charge)
    if (facultyId) {
      try {
        const bookings = await fetchBookingsByFaculty(facultyId);
        bookings.forEach((b) => {
          const slot = b.allocatedSlot || (b.priorities && b.priorities[0]);
          if (!slot?.date || slot.date !== selectedDate) return;
          const isPendingAR = b.tracker?.ar === "pending" && b.tracker?.jrAssistant === "approved";
          result.push({
            id: b._id,
            kind: isPendingAR ? "booking-pending" : "booking-approved",
            title: b.activityType,
            subtitle: `${b.clubName} · ${b.requester?.name || "Student"}`,
            venue: slot.venueName || "TBD",
            startTime: slot.startTime,
            endTime: slot.endTime,
            booking: b,
          });
        });
      } catch (e) {
        console.error("MySchedule booking fetch error:", e);
      }
    }

    // Sort by start time
    result.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
    setEvents(result);
    setLoading(false);
  }, [selectedDate, facultyId, taughtCourses.join(",")]);

  useEffect(() => { buildEvents(); }, [buildEvents]);

  const nextEvent = events.find((e) => e.kind === "booking-approved");
  const pendingCount = events.filter((e) => e.kind === "booking-pending").length;

  return (
    <div className="mt-5 w-full min-h-[80vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">

      {/* DATE + CONTROLS */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
          {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedDate(TODAY)}
            className="rounded-xl bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-sm font-bold text-brand-500 hover:bg-brand-500/20 transition-all">Today</button>
          <div className="relative flex items-center">
            <MdCalendarMonth className="absolute left-3 text-brand-500" size={15} />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-navy-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white" />
          </div>
          <button onClick={buildEvents} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors" title="Refresh">
            <MdRefresh size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── MAIN TIMELINE (left 2 cols) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* UPCOMING BANNER */}
          {nextEvent && selectedDate === TODAY && (
            <div className="mb-2 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 p-6 shadow-lg shadow-brand-500/20 text-white">
              <p className="text-[10px] uppercase tracking-widest font-black text-white/70 mb-2 flex items-center gap-1.5">
                <MdCheckCircle size={13} /> Next Upcoming Event
              </p>
              <h3 className="text-2xl font-bold">{nextEvent.title}</h3>
              <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
                <MdAccessTime size={13} /> {fmtTime(nextEvent.startTime)} – {fmtTime(nextEvent.endTime)}
                <span className="mx-1">·</span>
                <MdLocationOn size={13} /> {nextEvent.venue}
              </p>
            </div>
          )}

          {/* PENDING AR BANNER */}
          {pendingCount > 0 && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {pendingCount} event{pendingCount > 1 ? "s" : ""} today pending final AR approval — shown in amber
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 px-1">
            {[
              { kind: "course", label: "Course Class" },
              { kind: "booking-approved", label: "Fully Approved" },
              { kind: "booking-pending", label: "Pending AR" },
            ].map(({ kind, label }) => {
              const cfg = eventCfg(kind);
              return (
                <div key={kind} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} /> {label}
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
              <p className="text-sm font-bold">Building your schedule…</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 flex flex-col items-center rounded-[20px] border-2 border-dashed border-gray-200 dark:border-navy-700">
              <MdEvent className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-navy-700 dark:text-white">No events on this day</h3>
              <p className="text-sm text-gray-500 mt-1">Either a free day or no approved bookings.</p>
            </div>
          ) : (
            <div className="relative pl-8">
              {/* Timeline spine */}
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-brand-500/40 to-transparent dark:from-brand-500/20" />

              {events.map((ev) => {
                const cfg = eventCfg(ev.kind);
                return (
                  <div key={ev.id} onClick={() => setSelected(ev)}
                    className={`relative mb-5 cursor-pointer rounded-[16px] border border-gray-100 dark:border-navy-700 border-l-4 ${cfg.border} ${cfg.bg} p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}>
                    {/* Timeline dot */}
                    <div className={`absolute -left-[25px] top-5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-navy-800 ${cfg.dot}`} />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${cfg.badge}`}>{cfg.label}</span>
                          {ev.kind === "booking-pending" && <span className="text-[10px] text-amber-500 font-bold">Awaiting AR Approval</span>}
                        </div>
                        <h3 className="text-base font-bold text-navy-700 dark:text-white truncate">{ev.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ev.subtitle}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-navy-700 dark:text-white">{fmtTime(ev.startTime)}</p>
                        <p className="text-xs text-gray-400">– {fmtTime(ev.endTime)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <MdLocationOn size={12} className="text-brand-500 flex-shrink-0" />
                      <span className="font-semibold">{ev.venue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-5">
          {/* Day summary */}
          <div className="rounded-2xl bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 p-5 shadow-sm">
            <h3 className="text-sm font-black text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MdSchedule size={16} /> Day Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Events", value: events.length, color: "text-navy-700 dark:text-white" },
                { label: "Classes",  value: events.filter(e => e.kind === "course").length,            color: "text-brand-500" },
                { label: "Approved", value: events.filter(e => e.kind === "booking-approved").length,  color: "text-green-500" },
                { label: "Pending",  value: events.filter(e => e.kind === "booking-pending").length,   color: "text-amber-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-gray-50 dark:bg-navy-900/60 p-3 text-center">
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-2xl bg-gray-50 dark:bg-navy-900/50 border border-gray-100 dark:border-navy-700 p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <MdInfoOutline size={13} /> How Events Appear
            </p>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2"><span className="text-brand-500 font-bold mt-0.5">●</span> <span><b className="text-navy-700 dark:text-white">Blue</b> — Your course classes from enrolled timetable</span></li>
              <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">●</span> <span><b className="text-navy-700 dark:text-white">Green</b> — Bookings fully approved through the workflow</span></li>
              <li className="flex items-start gap-2"><span className="text-amber-500 font-bold mt-0.5">●</span> <span><b className="text-navy-700 dark:text-white">Amber</b> — Bookings awaiting final AR sign-off</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── EVENT DETAIL DRAWER ── */}
      <div className={`fixed inset-0 z-[100] bg-navy-900/60 backdrop-blur-sm transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSelected(null)} />
      <div className={`fixed right-0 top-0 z-[101] h-full w-full max-w-md bg-white shadow-2xl dark:bg-navy-800 transition-all duration-300 ease-out ${selected ? "translate-x-0" : "translate-x-full"}`}>
        {selected && (
          <>
            <div className={`p-6 border-b border-gray-100 dark:border-navy-700 ${eventCfg(selected.kind).bg}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${eventCfg(selected.kind).badge} mb-2 inline-block`}>
                    {eventCfg(selected.kind).label}
                  </span>
                  <h2 className="text-xl font-extrabold text-navy-700 dark:text-white">{selected.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.subtitle}</p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-full p-2 bg-gray-100 dark:bg-navy-700 text-gray-500 hover:bg-gray-200">
                  <MdClose className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { icon: MdCalendarMonth, label: "Date",       value: fmtDate(selectedDate) },
                { icon: MdAccessTime,    label: "Time",       value: `${fmtTime(selected.startTime)} – ${fmtTime(selected.endTime)}` },
                { icon: MdLocationOn,   label: "Venue",      value: selected.venue },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl bg-gray-50 dark:bg-navy-900/60 border border-gray-100 dark:border-navy-700 p-4 flex items-center gap-3">
                  <Icon className="text-brand-500 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
                    <p className="font-bold text-navy-700 dark:text-white text-sm">{value}</p>
                  </div>
                </div>
              ))}
              {selected.kind !== "course" && selected.booking && (
                <div className="rounded-xl bg-gray-50 dark:bg-navy-900/60 border border-gray-100 dark:border-navy-700 p-4">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Booking Status</p>
                  <p className="font-bold text-navy-700 dark:text-white text-sm">{selected.booking.status}</p>
                  {selected.booking.purpose && <p className="text-xs text-gray-500 mt-1">{selected.booking.purpose}</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}