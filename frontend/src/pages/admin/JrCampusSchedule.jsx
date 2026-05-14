import React, { useState, useRef, useEffect, useCallback } from "react";
import { fetchBookingsByDate } from "../../services/api";
import courseData from "../../variables/courseData";
import { 
  MdCalendarMonth, MdAccessTime, MdLocationOn, MdPerson, MdClose, 
  MdFilterList, MdWarning, MdCheckCircle, MdInfoOutline, MdGpsFixed, MdRefresh
} from "react-icons/md";
const ALL_VENUES = [
  { id: "m1", name: "M1",    block: "Radhakrishnan Block" },
  { id: "m2", name: "M2",    block: "Radhakrishnan Block" },
  { id: "m3", name: "M3",    block: "Radhakrishnan Block" },
  { id: "m4", name: "M4",    block: "Radhakrishnan Block" },
  { id: "m5", name: "M5",    block: "Radhakrishnan Block" },
  { id: "m6", name: "M6",    block: "Radhakrishnan Block" },
  { id: "audi", name: "Auditorium", block: "Radhakrishnan Block" },
  { id: "cs1",  name: "CS1",  block: "S. Ramanujan Block" },
  { id: "cs2",  name: "CS2",  block: "S. Ramanujan Block" },
  { id: "cssh", name: "CS(SH)", block: "S. Ramanujan Block" },
  { id: "ee1",  name: "EE1",  block: "J. C. Bose Block" },
  { id: "ee2",  name: "EE2",  block: "J. C. Bose Block" },
  { id: "ee3",  name: "EE3",  block: "J. C. Bose Block" },
  { id: "eesh", name: "EE(SH)", block: "J. C. Bose Block" },
  { id: "me1",  name: "ME1",  block: "Satish Dhawan Block" },
  { id: "me2",  name: "ME2",  block: "Satish Dhawan Block" },
  { id: "mesh", name: "ME(SH)", block: "Satish Dhawan Block" },
  { id: "cy1",  name: "CY1",  block: "S. Bhatnagar Block" },
  { id: "cy2",  name: "CY2",  block: "S. Bhatnagar Block" },
  { id: "cysh", name: "CY(SH)", block: "S. Bhatnagar Block" },
  { id: "s001", name: "S-001", block: "Super Academic Block" },
  { id: "s002", name: "S-002", block: "Super Academic Block" },
  { id: "s003", name: "S-003", block: "Super Academic Block" },
  { id: "s102", name: "S-102", block: "Super Academic Block" },
  { id: "s103", name: "S-103", block: "Super Academic Block" },
  { id: "s104", name: "S-104", block: "Super Academic Block" },
  { id: "s105", name: "S-105", block: "Super Academic Block" },
  { id: "s106", name: "S-106", block: "Super Academic Block" },
  { id: "s107", name: "S-107", block: "Super Academic Block" },
];
const timeToHour = (t) => { if(!t) return 9; const [h,m] = t.split(":").map(Number); return h + m/60; };
const ALL_BLOCKS = [...new Set(ALL_VENUES.map(v => v.block))].sort();
const normalizeVenue = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
const checkVenueMatch = (courseVenue, uiName, uiId) => {
  if (!courseVenue) return false;
  const cv = normalizeVenue(courseVenue);
  const un = normalizeVenue(uiName);
  const ui = normalizeVenue(uiId);
  if (cv === un || cv === ui) return true;
  if (cv === 'AUDI' && un === 'AUDITORIUM') return true;
  return false;
};
export default function JRCampusSchedule() {
  const [selectedDate,      setSelectedDate]      = useState(new Date().toISOString().split("T")[0]);
  const [selectedBlock,     setSelectedBlock]     = useState("All Blocks");
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [selectedEvent,     setSelectedEvent]     = useState(null);
  const [activeTab,         setActiveTab]         = useState("Details");
  const [rawBookings,       setRawBookings]       = useState([]);
  const [loading,           setLoading]           = useState(false);
  const scrollRef = useRef(null);
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBookingsByDate(selectedDate);
      setRawBookings(data);
    } catch (e) {
      console.error("CampusSchedule load error:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);
  useEffect(() => { loadBookings(); }, [loadBookings]);
  const roomRows = ALL_VENUES
    .map(v => {
    const events = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const bookingEvents = rawBookings
      .filter(b => {
        if (selectedDate < todayStr && b.status !== "Approved") return false;
        if (b.allocatedSlot && b.allocatedSlot.date) {
            return b.allocatedSlot.date === selectedDate && b.allocatedSlot.venueId === v.id;
        }
        return b.priorities?.some(p => p.date === selectedDate && p.venueId === v.id);
      })
      .map(b => {
        const slot = (b.allocatedSlot && b.allocatedSlot.date) 
          ? b.allocatedSlot 
          : b.priorities?.find(p => p.venueId === v.id && p.date === selectedDate);
        if (!slot) return null;
        return {
          id: b._id,
          title: b.activityType,
          organizer: b.requester?.name || "Student",
          start: timeToHour(slot?.startTime),
          duration: timeToHour(slot?.endTime) - timeToHour(slot?.startTime),
          startTime: slot?.startTime,
          endTime:   slot?.endTime,
          status: b.tracker?.ar === 'approved' ? "Approved" : "Pending",
          purpose: b.purpose,
          clubName: b.clubName,
          audienceCount: b.audienceCount,
          rawBooking: b,
          kind: "booking"
        };
      });
    events.push(...bookingEvents);
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date(selectedDate + "T00:00:00").getDay()];
    courseData
      .forEach(course => {
        if (!course || !course.venue) return;
        if (!checkVenueMatch(course.venue, v.name, v.id)) return;
        course.schedule?.forEach(slot => {
          if (slot.day === dayName) {
            const timeStart = slot.time.split(" - ")[0];
            const timeEnd = slot.time.split(" - ")[1];
            events.push({
              id: `course-${course.code}-${slot.day}-${slot.time}`,
              title: course.name || course.code,
              organizer: course.instructor || "Faculty",
              start: timeToHour(timeStart),
              duration: timeToHour(timeEnd) - timeToHour(timeStart),
              startTime: timeStart,
              endTime: timeEnd,
              status: "Course",
              clubName: course.code,
              purpose: `Course: ${course.code}`,
              kind: "course"
            });
          }
        });
      });
    events.sort((a, b) => a.start - b.start);
    const utilization = events.length === 0 ? "low" : events.length >= 3 ? "critical" : events.length >= 2 ? "high" : "medium";
    return { id: v.id, name: v.name, block: v.block, events, utilization };
  }).filter(r => (selectedBlock === "All Blocks" || r.block === selectedBlock) && (r.events.length > 0 || !showConflictsOnly));
  const filteredRooms = showConflictsOnly ? roomRows.filter(r => r.events.length > 0) : roomRows;
  const jumpToNow = () => {
    if (scrollRef.current) {
      const scrollAmount = (scrollRef.current.scrollWidth * (5 / 11)) - 100; 
      scrollRef.current.scrollTo({ left: scrollAmount, behavior: "smooth" });
    }
  };
  const getEventColors = (status) => {
    if (status === "Course") return "bg-brand-500 border-brand-600 shadow-[0_0_10px_rgba(66,88,255,0.3)] hover:bg-brand-400";
    if (status === "Approved") return "bg-green-500 border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:bg-green-400";
    if (status === "Pending") return "bg-amber-400 border-amber-500 shadow-[0_0_10px_rgba(251,146,60,0.3)] hover:bg-amber-300 pattern-diagonal-lines pattern-amber-500 pattern-bg-amber-400 pattern-size-2 pattern-opacity-20";
    if (status === "Conflict") return "bg-red-500 border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)] hover:bg-red-400 animate-pulse";
    return "bg-brand-500";
  };
  const getUtilBadge = (util) => {
    if (util === "critical") return <span title="Critically Overbooked" className="text-red-500 text-xs">🔥🔥🔥</span>;
    if (util === "high") return <span title="High Usage" className="text-orange-500 text-xs">🔥🔥</span>;
    if (util === "medium") return <span title="Moderate Usage" className="text-amber-500 text-xs">🔥</span>;
    return <span title="Mostly Free" className="text-green-500 flex items-center gap-1"><MdCheckCircle size={10}/></span>;
  };
  const formatTime = (start, duration) => {
    const formatHour = (h) => {
      const isHalf = h % 1 !== 0;
      const hour = Math.floor(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const fHour = hour % 12 || 12;
      return `${fHour}:${isHalf ? '30' : '00'} ${ampm}`;
    };
    return `${formatHour(start)} - ${formatHour(start + duration)}`;
  };
  return (
    <div className="mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4 flex flex-col">
      {}
      <div className="mb-5 flex flex-wrap items-center gap-3 px-1">
        <button 
          onClick={jumpToNow}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500/10 px-4 py-2 text-sm font-bold text-brand-500 transition-all hover:bg-brand-500/20 dark:text-brand-400"
        >
          <MdGpsFixed size={15} /> Jump to Now
        </button>
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white" 
        />
        <select 
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white"
        >
          <option value="All Blocks">All Blocks</option>
          {ALL_BLOCKS.map(block => (
            <option key={block} value={block}>{block}</option>
          ))}
        </select>
        <button onClick={loadBookings} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors" title="Refresh">
          <MdRefresh size={18} />
        </button>
        <span className="ml-auto text-xs font-bold text-gray-400">{loading ? "Loading…" : `${rawBookings.length} event(s)`}</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <div className={`relative w-9 h-5 rounded-full transition-colors ${showConflictsOnly ? 'bg-red-500' : 'bg-gray-300 dark:bg-navy-700'}`}>
            <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow ${showConflictsOnly ? 'translate-x-4' : 'translate-x-0'}`}></div>
          </div>
          <span className={`text-sm font-semibold ${showConflictsOnly ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            Conflicts Only
          </span>
        </label>
      </div>
      {}
      <div className="flex-1 rounded-[24px] bg-white/70 backdrop-blur-md shadow-sm border border-gray-100 dark:bg-navy-800/70 dark:border-navy-700 flex overflow-hidden relative">
        {}
        <div className="w-24 md:w-32 flex-shrink-0 bg-white dark:bg-navy-800 border-r border-gray-100 dark:border-navy-700 z-20 flex flex-col shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
          {}
          <div className="h-12 border-b border-gray-100 dark:border-navy-700 flex items-center justify-center bg-gray-50/50 dark:bg-navy-900/30">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Venue</span>
          </div>
          {}
          {filteredRooms.map((room) => (
            <div key={room.id} className="h-24 border-b border-gray-100 dark:border-navy-700 flex flex-col justify-center items-center relative group">
              <span className="text-sm font-extrabold text-navy-700 dark:text-white text-center">{room.name}</span>
              <div className="mt-1 flex items-center justify-center gap-1">
                {getUtilBadge(room.utilization)}
              </div>
              {}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-navy-900 text-white text-xs font-bold rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                Usage: <span className="uppercase">{room.utilization}</span>
              </div>
            </div>
          ))}
        </div>
        {}
        <div ref={scrollRef} className="flex-1 overflow-x-auto relative custom-scrollbar flex flex-col">
          {}
          <div className="h-12 flex border-b border-gray-100 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900/30 min-w-[1100px]">
             {[9,10,11,12,1,2,3,4,5,6,7,8].map((hour, i) => (
               <div key={i} className="flex-1 border-l border-gray-200 dark:border-navy-700/50 flex items-center justify-center text-xs font-bold text-gray-400">
                  {hour}:00 {i < 3 ? 'AM' : 'PM'}
               </div>
             ))}
          </div>
          {}
          <div className="relative flex-1 min-w-[1100px]">
             {}
             <div className="absolute inset-0 flex pointer-events-none">
               {[...Array(12)].map((_, i) => (
                 <div key={i} className="flex-1 border-l border-dashed border-gray-200 dark:border-navy-700/30"></div>
               ))}
             </div>
             {}
             {filteredRooms.map((room) => (
                <div key={room.id} className="h-24 border-b border-gray-100 dark:border-navy-700 relative hover:bg-gray-50/30 dark:hover:bg-navy-700/20 transition-colors">
                  {room.events.map((ev) => {
                    const startPercent = ((ev.start - 9) / 11) * 100;
                    const widthPercent = (ev.duration / 11) * 100;
                    return (
                      <div 
                        key={ev.id}
                        onClick={() => { setSelectedEvent(ev); setActiveTab("Details"); }}
                        className={`absolute top-3 bottom-3 rounded-[12px] p-2 md:p-3 border text-white shadow-sm cursor-pointer group transition-all duration-300 overflow-hidden ${getEventColors(ev.status)}`}
                        style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                      >
                        <h4 className="text-xs md:text-sm font-bold truncate tracking-wide">{ev.title}</h4>
                        <p className="text-[10px] font-medium opacity-90 truncate mt-0.5">{ev.organizer}</p>
                        {}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-navy-900 dark:bg-black text-white p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 w-48 z-50 scale-95 group-hover:scale-100 origin-bottom border border-gray-700">
                           <div className="flex items-center justify-between mb-1">
                             <p className="font-bold text-sm truncate">{ev.title}</p>
                             {ev.status === "Conflict" && <MdWarning className="text-red-400" />}
                           </div>
                           <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><MdAccessTime/> {formatTime(ev.start, ev.duration)}</p>
                           <p className="text-xs text-gray-400 flex items-center gap-1"><MdPerson/> {ev.organizer}</p>
                           {}
                           <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-900 dark:border-t-black"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
             ))}
          </div>
        </div>
      </div>
      {}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/60 backdrop-blur-sm transition-opacity duration-500 ease-out p-4 ${selectedEvent ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSelectedEvent(null)}
      >
        <div 
          className={`relative w-full max-w-2xl overflow-hidden rounded-[24px] bg-white shadow-2xl transition-all duration-500 ease-out dark:bg-navy-800 ${selectedEvent ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}
          onClick={(e) => e.stopPropagation()} 
        >
          {}
          <div className={`p-6 border-b border-gray-100 dark:border-navy-700 flex justify-between items-start ${selectedEvent?.status === "Course" ? "bg-brand-500/10" : selectedEvent?.status === "Conflict" ? "bg-red-500/10" : selectedEvent?.status === "Pending" ? "bg-amber-500/10" : "bg-gradient-to-r from-green-500/10 to-emerald-500/10"}`}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${selectedEvent?.status === "Course" ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400" : selectedEvent?.status === "Conflict" ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : selectedEvent?.status === "Pending" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" : "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"}`}>
                  {selectedEvent?.status}
                </span>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Event ID: {selectedEvent?.id}</p>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-navy-700 dark:text-white">{selectedEvent?.title}</h2>
            </div>
            <button onClick={() => setSelectedEvent(null)} className="rounded-full p-2 bg-white/50 text-gray-500 hover:bg-white dark:bg-navy-900/50 dark:hover:bg-navy-900 transition-colors shadow-sm">
              <MdClose className="h-5 w-5" />
            </button>
          </div>
          <div className="p-8 max-h-[60vh] overflow-y-auto bg-gray-50/50 dark:bg-navy-900/20">
            {}
            {selectedEvent?.status === "Conflict" && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border-l-4 border-red-500 flex items-start gap-3 dark:bg-red-500/10 dark:border-red-500">
                <MdWarning className="text-red-500 text-xl shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">System Alert</p>
                  <p className="text-sm font-medium text-red-900 dark:text-red-200 mt-1">{selectedEvent.conflictMsg}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-6 border-b border-gray-100 pb-6 dark:border-navy-700">
               <div>
                 <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1"><MdAccessTime/> Time Slot</p>
                 <p className="font-bold text-navy-700 dark:text-white mt-1 text-lg">
                   {selectedEvent ? formatTime(selectedEvent.start, selectedEvent.duration) : ''}
                 </p>
               </div>
               <div>
                 <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1"><MdPerson/> Organizer</p>
                 <p className="font-bold text-navy-700 dark:text-white mt-1 text-lg">{selectedEvent?.organizer}</p>
               </div>
            </div>
            <div className="rounded-2xl bg-white p-5 border border-gray-100 shadow-sm dark:bg-navy-800 dark:border-navy-700 flex items-center justify-between">
               <div>
                 <p className="text-sm font-bold text-navy-700 dark:text-white">Need to resolve this?</p>
                 <p className="text-xs font-medium text-gray-500 mt-0.5">{selectedEvent?.kind === "course" ? "This is a scheduled course class." : "Go to the Triage Queue to modify or approve requests."}</p>
               </div>
               {selectedEvent?.kind !== "course" && (
                 <button onClick={() => window.location.href = '#/admin/jr-approvals'} className="px-4 py-2 rounded-lg bg-brand-50 text-brand-600 font-bold text-sm hover:bg-brand-100 transition-colors dark:bg-brand-500/10 dark:text-brand-400">
                   Open Triage Queue
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}