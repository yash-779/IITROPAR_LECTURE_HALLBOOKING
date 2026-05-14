import React, { useState, useEffect } from "react";
import { fetchAllBookings } from "../../../services/api"; 
import { MdCalendarMonth, MdAccessTime, MdClose, MdSchool, MdEvent, MdLocationCity, MdPerson } from "react-icons/md";
import courseData from "../../../variables/courseData"; 
const rawVenues = [
  { id: "m1", title: "M1", capacity: 50, type: "Classroom", block: "Radhakrishnan Block" },
  { id: "m2", title: "M2", capacity: 50, type: "Classroom", block: "Radhakrishnan Block" },
  { id: "m3", title: "M3", capacity: 100, type: "Classroom", block: "Radhakrishnan Block" },
  { id: "m4", title: "M4", capacity: 100, type: "Classroom", block: "Radhakrishnan Block" },
  { id: "m5", title: "M5", capacity: 195, type: "Classroom", block: "Radhakrishnan Block" },
  { id: "m6", title: "M6", capacity: 180, type: "Classroom", block: "Radhakrishnan Block" },
  { id: "audi", title: "Auditorium", capacity: 500, type: "Major Events", block: "Radhakrishnan Block" },
  { id: "cs1", title: "CS1", capacity: 60, type: "Classroom", block: "S. Ramanujan Block" },
  { id: "cs2", title: "CS2", capacity: 40, type: "Classroom", block: "S. Ramanujan Block" },
  { id: "cssh", title: "CS(SH)", capacity: 90, type: "Seminar Hall", block: "S. Ramanujan Block" },
  { id: "ee1", title: "EE1", capacity: 65, type: "Classroom", block: "J. C. Bose Block" },
  { id: "ee2", title: "EE2", capacity: 35, type: "Classroom", block: "J. C. Bose Block" },
  { id: "ee3", title: "EE3", capacity: 60, type: "Classroom", block: "J. C. Bose Block" },
  { id: "eesh", title: "EE(SH)", capacity: 80, type: "Seminar Hall", block: "J. C. Bose Block" },
  { id: "me1", title: "ME1", capacity: 70, type: "Classroom", block: "Satish Dhawan Block" },
  { id: "me2", title: "ME2", capacity: 35, type: "Classroom", block: "Satish Dhawan Block" },
  { id: "mesh", title: "ME(SH)", capacity: 90, type: "Seminar Hall", block: "Satish Dhawan Block" },
  { id: "cy1", title: "CY1", capacity: 35, type: "Classroom", block: "S. Bhatnagar Block" },
  { id: "cy2", title: "CY2", capacity: 30, type: "Classroom", block: "S. Bhatnagar Block" },
  { id: "cysh", title: "CY(SH)", capacity: 90, type: "Seminar Hall", block: "S. Bhatnagar Block" },
  { id: "s001", title: "S-001", capacity: 72, type: "Classroom", block: "Super Academic Block" },
  { id: "s002", title: "S-002", capacity: 72, type: "Classroom", block: "Super Academic Block" },
  { id: "s003", title: "S-003", capacity: 72, type: "Classroom", block: "Super Academic Block" },
  { id: "s102", title: "S-102", capacity: 72, type: "Classroom", block: "Super Academic Block" },
  { id: "s103", title: "S-103", capacity: 72, type: "Classroom", block: "Super Academic Block" },
  { id: "s104", title: "S-104", capacity: 72, type: "Classroom", block: "Super Academic Block" },
  { id: "s105", title: "S-105", capacity: 72, type: "Classroom", block: "Super Academic Block" },
  { id: "s106", title: "S-106", capacity: 72, type: "Classroom", block: "Super Academic Block" },
  { id: "s107", title: "S-107", capacity: 72, type: "Classroom", block: "Super Academic Block" },
];
const blockGradients = {
  "Radhakrishnan Block": "from-blue-500 to-cyan-400",
  "S. Ramanujan Block": "from-purple-500 to-indigo-500",
  "J. C. Bose Block": "from-brand-400 to-brand-600",
  "Satish Dhawan Block": "from-orange-400 to-red-500",
  "S. Bhatnagar Block": "from-emerald-400 to-teal-500",
  "Super Academic Block": "from-pink-500 to-rose-500"
};
const venuesData = rawVenues.map(v => ({ ...v, gradient: blockGradients[v.block] || "from-gray-400 to-gray-600" }));
const blockNames = [...new Set(venuesData.map(v => v.block))];
export default function RoomCalendar() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [allLiveBookings, setAllLiveBookings] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterBlock, setFilterBlock] = useState("all");
  const [modalDate, setModalDate] = useState("");
  useEffect(() => {
    const getBookings = async () => {
      try {
        const dbBookings = await fetchAllBookings();
        const validBookings = dbBookings.filter(b => b.status !== "Rejected");
        setAllLiveBookings(validBookings);
      } catch (error) {
        console.error("Failed to load live bookings for calendar", error);
      }
    };
    getBookings();
  }, []);
  const handleOpenTimeline = (venue) => {
    setSelectedVenue(venue);
    setModalDate(filterDate || new Date().toISOString().split('T')[0]); 
  };
  const displayedVenues = venuesData.filter((v) => filterBlock === "all" || v.block === filterBlock);
  const checkVenueMatch = (courseVenue, uiVenueTitle, uiVenueId) => {
    if (!courseVenue) return false;
    const normalize = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(); 
    const cv = normalize(courseVenue);
    const ut = normalize(uiVenueTitle);
    const ui = normalize(uiVenueId);
    if (cv === ut || cv === ui) return true;
    if (cv === 'AUDI' && ut === 'AUDITORIUM') return true; 
    return false;
  };
  const generateTimeline = () => {
    if (!selectedVenue || !modalDate) return [];
    const timeline = [];
    const dateObj = new Date(modalDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[dateObj.getDay()];
    courseData.forEach(course => {
      if (!course || !course.venue) return; 
      if (checkVenueMatch(course.venue, selectedVenue.title, selectedVenue.id)) {
        if (course.schedule && Array.isArray(course.schedule)) {
          course.schedule.forEach(slot => {
            if (slot.day === dayOfWeek) {
              timeline.push({
                title: `${course.code} Class`,
                time: slot.time, 
                startTime: slot.time.split(" - ")[0], 
                type: "Academic Course",
                isClass: true,
                isPending: false
              });
            }
          });
        }
      }
    });
    allLiveBookings.forEach(booking => {
      let slot = null;
      if (booking.allocatedSlot && booking.allocatedSlot.date) {
         slot = booking.allocatedSlot;
      } else if (booking.priorities) {
         slot = booking.priorities.find(p => checkVenueMatch(p.venueName, selectedVenue.title, p.venueId) && p.date === modalDate);
      }
      if (!slot || !checkVenueMatch(slot.venueName, selectedVenue.title, slot.venueId) || slot.date !== modalDate) return;
      const isPending = booking.status !== "Approved" || booking.tracker?.ar !== 'approved';
      const todayStr = new Date().toISOString().split('T')[0];
      if (modalDate < todayStr && booking.status !== "Approved") return;
      timeline.push({
        title: booking.activityType || "Event",
        time: `${slot.startTime} - ${slot.endTime}`,
        startTime: slot.startTime, 
        type: booking.clubName || "Custom Booking",
        isClass: false,
        isPending: isPending,
        status: booking.status
      });
    });
    return timeline.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };
  const currentTimeline = generateTimeline();
  const selectedDayName = modalDate ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(modalDate).getDay()] : "";
  return (
    <div className="mt-3 w-full relative">
      {}
      <div className="mb-6 flex flex-col items-center justify-between rounded-[20px] bg-white p-6 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:flex-row">
        <div>
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">Venue Matrix</h2>
          <p className="text-sm text-gray-500">View daily academic schedules and live club bookings.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 md:mt-0">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 dark:!bg-navy-700 dark:border-none">
            <MdCalendarMonth className="text-brand-500" />
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                if (selectedVenue) setModalDate(e.target.value);
              }}
              className="text-sm font-bold text-navy-700 outline-none bg-transparent dark:text-white" 
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 dark:!bg-navy-700 dark:border-none">
            <MdLocationCity className="text-brand-500" />
            <select 
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="text-sm font-bold text-navy-700 outline-none bg-transparent focus:ring-0 dark:text-white"
            >
              <option value="all">All Blocks</option>
              {blockNames.map(block => <option key={block} value={block}>{block}</option>)}
            </select>
          </div>
        </div>
      </div>
      {}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedVenues.map((venue) => (
          <div key={venue.id} className="group relative overflow-hidden rounded-[20px] bg-white shadow-sm border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl dark:!bg-navy-800 dark:border-navy-700">
            <div className={`h-32 w-full bg-gradient-to-br ${venue.gradient} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="absolute bottom-3 left-4 rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm uppercase tracking-widest">
                {venue.block}
              </div>
            </div>
            <div className="p-5">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-black text-navy-700 dark:text-white">{venue.title}</h3>
                  <p className="text-sm font-bold text-gray-400 mt-1 flex items-center gap-1">
                    <MdPerson size={16} /> Capacity: {venue.capacity}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleOpenTimeline(venue)}
                className="w-full rounded-xl bg-gray-50 border border-gray-200 py-2.5 text-sm font-bold text-navy-700 transition-all hover:bg-brand-500 hover:border-brand-500 hover:text-white hover:shadow-md dark:bg-navy-900 dark:border-navy-700 dark:text-white dark:hover:bg-brand-400 dark:hover:border-brand-400 dark:hover:text-navy-900"
              >
                View Timeline
              </button>
            </div>
          </div>
        ))}
      </div>
      {}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/70 p-4 backdrop-blur-sm transition-opacity duration-300 ${selectedVenue ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSelectedVenue(null)}
      >
        <div 
          className={`relative w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-3xl transition-all duration-300 dark:bg-navy-800 ${selectedVenue ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}
          onClick={(e) => e.stopPropagation()} 
        >
          <div className={`bg-gradient-to-r ${selectedVenue?.gradient || 'from-brand-400 to-brand-600'} p-6 text-white relative`}>
             <button onClick={() => setSelectedVenue(null)} className="absolute top-5 right-5 rounded-full bg-black/20 p-2 hover:bg-black/40 transition">
               <MdClose className="h-5 w-5" />
             </button>
             <p className="text-[10px] font-black tracking-widest text-white/80 uppercase mb-1">{selectedVenue?.block}</p>
             <h2 className="text-4xl font-black">{selectedVenue?.title}</h2>
             <div className="mt-4 flex items-center gap-3">
               <input 
                 type="date" 
                 value={modalDate}
                 onChange={(e) => setModalDate(e.target.value)}
                 className="rounded-lg bg-white/20 px-3 py-2 text-sm font-bold text-white outline-none backdrop-blur-md focus:bg-white/30 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)] border border-white/10"
               />
               <span className="rounded-lg bg-black/20 px-3 py-2 text-sm font-bold backdrop-blur-md border border-white/10">
                 {selectedDayName}
               </span>
             </div>
          </div>
          <div className="p-6 h-[400px] overflow-y-auto bg-gray-50 dark:bg-navy-900 custom-scrollbar">
            {!modalDate ? (
               <div className="flex h-full flex-col items-center justify-center text-gray-400">
                 <MdCalendarMonth className="mb-4 h-16 w-16 opacity-20" />
                 <p className="text-lg font-bold">Please select a date.</p>
               </div>
            ) : currentTimeline.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <div className="rounded-full bg-white p-4 shadow-sm mb-4 dark:bg-navy-800">
                  <MdCalendarMonth className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-lg font-bold text-navy-700 dark:text-white">No scheduled events.</p>
                <p className="text-sm mt-1">This venue is completely free on this date.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-200 ml-4 dark:border-navy-700">
                {currentTimeline.map((event, index) => {
                  let dotColor = "bg-brand-500";
                  let borderColor = "border-gray-100 dark:border-navy-700";
                  let bgColor = "bg-white dark:bg-navy-800";
                  let textAccentColor = "text-brand-500";
                  let typeColor = "text-brand-500";
                  let iconBgColor = "text-brand-500";
                  if (event.isClass) {
                    dotColor = "bg-orange-500";
                    textAccentColor = "text-orange-500";
                    borderColor = "border-orange-100 dark:border-orange-500/20";
                    bgColor = "bg-orange-50/50 dark:bg-orange-950/30";
                  } else if (event.isPending) {
                    dotColor = "bg-amber-500";
                    textAccentColor = "text-amber-500";
                    borderColor = "border-amber-100 dark:border-amber-500/20";
                    bgColor = "bg-amber-50/50 dark:bg-amber-950/30";
                    typeColor = "text-amber-600 dark:text-amber-400";
                  } else {
                    dotColor = "bg-emerald-500";
                    textAccentColor = "text-emerald-500";
                    borderColor = "border-emerald-100 dark:border-emerald-500/20";
                    bgColor = "bg-emerald-50/50 dark:bg-emerald-950/30";
                    typeColor = "text-emerald-600 dark:text-emerald-400";
                  }
                  return (
                    <div key={index} className="mb-8 pl-6 relative animate-fade-in">
                      {}
                      <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-[5px] border-gray-50 dark:border-navy-900 ${dotColor}`}></div>
                      <p className={`text-xs font-bold flex items-center gap-1 mb-2 ${textAccentColor}`}>
                        <MdAccessTime className="h-4 w-4" /> {event.time}
                      </p>
                      <div className={`rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md ${bgColor} ${borderColor}`}>
                        <h4 className={`text-lg font-bold dark:text-white flex items-center gap-2 ${event.isClass ? 'text-orange-700 dark:text-orange-300' : event.isPending ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                          {event.isClass ? <MdSchool className={textAccentColor}/> : <MdEvent className={textAccentColor}/>} 
                          {event.title}
                        </h4>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-[10px] uppercase tracking-widest font-black inline-block px-2 py-1 rounded ${event.isClass ? 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950/50' : event.isPending ? 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/50 animate-pulse' : 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50'}`}>
                            {event.isClass ? 'Class' : event.isPending ? 'Pending' : 'Approved'}
                          </p>
                          {event.type && <p className={`text-[10px] font-semibold ${typeColor}`}>{event.type}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 bg-white p-4 dark:border-navy-700 dark:bg-navy-800 flex justify-end">
             <button 
               onClick={() => window.location.href = '/admin/book-room'}
               className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 transition shadow-lg shadow-brand-500/30"
             >
               Book this Venue
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}