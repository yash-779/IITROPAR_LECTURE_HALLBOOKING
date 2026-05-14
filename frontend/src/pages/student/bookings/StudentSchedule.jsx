import React, { useState, useEffect, useCallback } from "react";
import { MdCalendarMonth, MdAccessTime, MdLocationOn, MdSchool, MdSchedule, MdClose, MdQrCode2, MdCheckCircle } from "react-icons/md";
import QRCode from "react-qr-code";
import courseData from "../../../variables/courseData";
import { fetchBookingsForStudent } from "../../../services/api";
function buildEvents(enrolledCodes, dateStr) {
  const dateObj = new Date(dateStr + "T00:00:00"); 
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[dateObj.getDay()];
  let events = [];
  enrolledCodes.forEach(courseCode => {
    const courseEntries = courseData.filter(c => c.code === courseCode);
    courseEntries.forEach(entry => {
      entry.schedule.forEach(slot => {
        if (slot.day === dayOfWeek) {
          events.push({
            id: `${entry.code}-${entry.venue}-${slot.time}`,
            code: entry.code,
            title: `${entry.code}`,
            venue: entry.venue,
            time: slot.time,
            startTime: slot.time.split(" - ")[0],
            status: "Official Class",
            type: "class"
          });
        }
      });
    });
  });
  events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return events;
}
function buildBookingEvents(bookings, dateStr, studentEnrolledCourses) {
  const selectedDate = dateStr;
  let bookingEvents = [];
  const todayStr = new Date().toISOString().split('T')[0];
  bookings.forEach(booking => {
    if (selectedDate < todayStr && booking.status !== "Approved") return;
    let bookingDate = null;
    let startTime = "";
    let endTime = "";
    let venueName = "TBD";
    if (booking.allocatedSlot && booking.allocatedSlot.date) {
        bookingDate = booking.allocatedSlot.date;
        startTime = booking.allocatedSlot.startTime;
        endTime = booking.allocatedSlot.endTime;
        venueName = booking.allocatedSlot.venueName;
    } else if (booking.priorities && booking.priorities.length > 0) {
        const p = booking.priorities.find(p => p.date === selectedDate);
        if (p) {
           bookingDate = p.date;
           startTime = p.startTime;
           endTime = p.endTime;
           venueName = p.venueName;
        }
    }
    if (bookingDate === selectedDate) {
      let bookingSource = "Department";
      let sourceInfo = booking.targetDepartments?.join(", ") || "N/A";
      if (booking.targetCourse) {
        bookingSource = "Course";
        sourceInfo = booking.targetCourse;
      }
      bookingEvents.push({
        id: booking._id,
        title: booking.clubName,
        venue: venueName,
        time: `${startTime} - ${endTime}`,
        startTime: startTime,
        status: booking.tracker?.ar === 'approved' ? "Approved" : "Pending",
        type: "booking",
        bookingData: booking,
        source: bookingSource,
        sourceInfo: sourceInfo
      });
    }
  });
  return bookingEvents;
}
export default function StudentSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [studentInfo, setStudentInfo] = useState({ name: "", enrolled: [], _id: "" });
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const refreshSchedule = useCallback(async (dateStr) => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user") || "{}";
    let liveUser = {};
    try { liveUser = JSON.parse(storedUser); } catch { liveUser = {}; }
    const enrolledCodes = liveUser.enrolledCourses || [];
    setStudentInfo({ name: liveUser.name || "Student", enrolled: enrolledCodes, _id: liveUser._id });
    const classEvents = buildEvents(enrolledCodes, dateStr);
    if (liveUser._id) {
      setLoadingBookings(true);
      try {
        const bookings = await fetchBookingsForStudent(liveUser._id);
        const bookingEvents = buildBookingEvents(bookings, dateStr, enrolledCodes);
        const allEvents = [...classEvents, ...bookingEvents];
        allEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setTodayEvents(allEvents);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setTodayEvents(classEvents);
      } finally {
        setLoadingBookings(false);
      }
    } else {
      setTodayEvents(classEvents);
    }
  }, []);
  useEffect(() => {
    refreshSchedule(selectedDate);
  }, [selectedDate, refreshSchedule]);
  useEffect(() => {
    const handler = () => refreshSchedule(selectedDate);
    window.addEventListener("coursesUpdated", handler);
    return () => window.removeEventListener("coursesUpdated", handler);
  }, [selectedDate, refreshSchedule]);
  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };
  const nextClass = todayEvents.length > 0 ? todayEvents[0] : null;
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  return (
    <div className="mt-5 w-full min-h-[80vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">
      {}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-500">
          {new Date(selectedDate + "T00:00:00").toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSetToday}
            className="rounded-xl bg-navy-800/60 border border-navy-700/50 px-3 py-1.5 text-sm font-bold text-gray-300 transition-all hover:bg-navy-700 hover:text-white"
          >
            Today
          </button>
          <div className="relative flex items-center">
            <MdCalendarMonth className="absolute left-3 text-brand-500" size={15} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-navy-700 outline-none transition-all focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2">
          {}
          {nextClass && isToday && (
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-brand-500 to-indigo-600 p-5 shadow-lg shadow-brand-500/20 text-white transform transition-all hover:scale-[1.01]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2 flex items-center gap-1.5">
                <MdSchedule size={14} /> First Class of the Day
              </p>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{nextClass.title}</h3>
                  <p className="text-white/80 mt-0.5 flex items-center gap-1.5 text-sm font-medium">
                    <MdAccessTime size={14} /> {nextClass.time}
                  </p>
                </div>
                <div className="rounded-xl bg-white/20 backdrop-blur-md px-4 py-2 flex items-center gap-2 border border-white/10 shadow-inner">
                  <MdLocationOn size={16} />
                  <span className="font-bold tracking-wide">{nextClass.venue}</span>
                </div>
              </div>
            </div>
          )}
          {}
          {studentInfo.enrolled.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-navy-700">
              <div className="mx-auto h-16 w-16 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
                <MdSchool className="h-8 w-8 text-brand-400" />
              </div>
              <h3 className="text-xl font-bold text-navy-700 dark:text-white mb-1">No Courses Enrolled</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto">
                Go to <span className="font-bold text-brand-500">Account Settings → Course Credentials</span> and select your courses to see your schedule here.
              </p>
            </div>
          ) : (
            <div className="relative pl-4 md:pl-8">
              {}
              <div className="absolute left-[27px] md:left-[43px] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-navy-700"></div>
              {todayEvents.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3 dark:bg-navy-800">
                    <MdSchool className="h-7 w-7 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-700 dark:text-white mb-1">No Classes Today</h3>
                  <p className="text-sm text-gray-500 font-medium">You have a free day — enjoy it!</p>
                </div>
              ) : (
                todayEvents.map((event) => {
                  const isBooking = event.type === 'booking';
                  const isPending = event.status === 'Pending';
                  let dotColor = "bg-brand-500";
                  let borderColor = "border-l-brand-500";
                  let bgColor = "bg-white/80 dark:bg-navy-800";
                  let statusBgColor = "bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400";
                  let shadowColor = "hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]";
                  if (isBooking) {
                    if (isPending) {
                      dotColor = "bg-orange-500";
                      borderColor = "border-l-orange-500";
                      bgColor = "bg-orange-50/80 dark:bg-orange-950/40";
                      statusBgColor = "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400";
                      shadowColor = "hover:shadow-[0_8px_30px_rgba(234,88,12,0.15)]";
                    } else {
                      dotColor = "bg-emerald-500";
                      borderColor = "border-l-emerald-500";
                      bgColor = "bg-emerald-50/80 dark:bg-emerald-950/40";
                      statusBgColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
                      shadowColor = "hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]";
                    }
                  }
                  return (
                    <div key={event.id} className="relative flex items-start gap-6 mb-8 group">
                      {}
                      <div className="flex flex-col items-center mt-1 z-10 w-16 md:w-20 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                          {event.startTime}
                        </span>
                        <div className={`h-3 w-3 rounded-full ${dotColor} shadow-[0_0_0_4px_rgba(99,102,241,0.12)]`}></div>
                      </div>
                      {}
                      <div 
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full rounded-[16px] ${bgColor} backdrop-blur-md p-5 shadow-sm border-y border-r border-gray-100 ${borderColor} border-l-4 transition-all duration-300 hover:-translate-y-1 ${shadowColor} dark:border-navy-700 cursor-pointer`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className={`text-lg font-bold tracking-wide flex items-center gap-2 ${isBooking ? (isPending ? "text-orange-700 dark:text-orange-300" : "text-emerald-700 dark:text-emerald-300") : "text-navy-700 dark:text-white"}`}>
                            {isBooking ? (
                              <div className="text-base">🎉</div>
                            ) : (
                              <MdSchool className={isBooking ? (isPending ? "text-orange-500" : "text-emerald-500") : "text-brand-500"} size={18} />
                            )}
                            {event.title}
                          </h3>
                          <span className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${statusBgColor}`}>
                            {event.status}
                          </span>
                        </div>
                        {}
                        {isBooking && event.source && (
                          <div className="mb-3 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 bg-gray-100/50 dark:bg-navy-900/50 border border-gray-200 dark:border-navy-700">
                            <span className={isBooking ? (isPending ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400") : "text-brand-600"}>
                              {event.source === 'Course' ? '📚' : '🏢'}
                            </span>
                            <span className={isBooking ? (isPending ? "text-orange-700 dark:text-orange-300" : "text-emerald-700 dark:text-emerald-300") : "text-gray-700 dark:text-gray-300"}>
                              {event.source === 'Course' ? 'For course' : 'For department'}: {event.sourceInfo}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isBooking ? (isPending ? "bg-orange-100 border-orange-200 dark:bg-orange-950/50 dark:border-orange-700" : "bg-emerald-100 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-700") : "bg-gray-50 border-gray-100 dark:bg-navy-900 dark:border-navy-700"}`}>
                            <MdLocationOn className={isBooking ? (isPending ? "text-orange-500" : "text-emerald-500") : "text-brand-500"} size={15} />
                            <span className={`font-bold ${isBooking ? (isPending ? "text-orange-700 dark:text-orange-300" : "text-emerald-700 dark:text-emerald-300") : "text-navy-700 dark:text-white"}`}>{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MdAccessTime className="text-gray-400" size={14} />
                            <span>{event.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
        {}
        <div className="hidden lg:block">
          <div className="rounded-2xl bg-white/70 backdrop-blur-md p-6 border border-gray-100 shadow-sm dark:bg-navy-800/70 dark:border-navy-700 sticky top-24">
            <h3 className="text-xs font-black uppercase tracking-widest text-navy-700 dark:text-white mb-4">Academic Summary</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-navy-900 flex justify-between items-center border border-gray-100 dark:border-navy-700">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Enrolled Courses</span>
                <span className="h-8 w-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-sm dark:bg-brand-400/10 dark:text-brand-400">
                  {studentInfo.enrolled.length}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-navy-900 flex justify-between items-center border border-gray-100 dark:border-navy-700">
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Classes This Day</span>
                <span className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm dark:bg-orange-500/10 dark:text-orange-500">
                  {todayEvents.length}
                </span>
              </div>
              {}
              {studentInfo.enrolled.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-navy-700">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Your Courses</p>
                  <div className="flex flex-wrap gap-1.5">
                    {studentInfo.enrolled.map(code => (
                      <span
                        key={code}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-navy-700">
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed text-center">
                Schedule auto-syncs from your <span className="font-bold text-brand-400">Account Settings → Course Credentials</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
      {}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[24px] bg-white shadow-2xl overflow-hidden dark:bg-navy-800 border border-gray-100 dark:border-navy-700">
            {}
            <div className="bg-gradient-to-r from-brand-500 to-indigo-600 py-4 px-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black tracking-widest text-white">IITR SYNC</h3>
                <p className="text-[10px] text-white/70 mt-0.5 uppercase tracking-widest">
                  {selectedEvent.type === 'class' ? "Academic Class" : "Booking Info"}
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="rounded-full p-1.5 bg-white/20 text-white hover:bg-white/40 transition-colors">
                <MdClose size={18} />
              </button>
            </div>
            <div className="border-b-2 border-dashed border-gray-200 p-5 text-center dark:border-navy-700">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Title</p>
              <p className="text-xl font-black text-navy-700 dark:text-white mt-1 ">{selectedEvent.title}</p>
            </div>
            <div className="border-b-2 border-dashed border-gray-200 p-5 grid grid-cols-2 gap-4 dark:border-navy-700">
              <div><p className="text-[10px] font-bold uppercase text-gray-400">Venue</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{selectedEvent.venue}</p></div>
              <div className="text-right"><p className="text-[10px] font-bold uppercase text-gray-400">Date</p><p className="font-bold text-navy-700 dark:text-white text-sm mt-1">{selectedDate.split("-").reverse().join("-")}</p></div>
              <div className="col-span-2 text-center">
                <p className="text-[10px] font-bold uppercase text-gray-400">Time</p>
                <p className="font-bold text-navy-700 dark:text-white mt-1 text-sm">{selectedEvent.time}</p>
              </div>
            </div>
            {selectedEvent.type === 'booking' ? (
              <div className="p-5 flex flex-col justify-center items-center">
                {selectedEvent.status === 'Approved' ? (
                  <>
                    <div className="p-3 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center">
                      {selectedEvent.bookingData?.qrCode ? (
                         <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-100">
                           <QRCode value={selectedEvent.bookingData.qrCode} size={96} />
                         </div>
                      ) : (
                         <MdQrCode2 className="h-24 w-24 text-navy-900" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-2 uppercase">Valid E-Ticket</p>
                  </>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                      <MdSchedule className="h-7 w-7 text-amber-500 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-500">Approval Pending</p>
                    <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-widest">E-Ticket not generated</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 flex justify-center">
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-3">
                    <MdSchool className="h-7 w-7 text-brand-500" />
                  </div>
                  <p className="text-sm font-bold text-brand-600 dark:text-brand-400">Official Schedule</p>
                  <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-widest">No ticket required</p>
                </div>
              </div>
            )}
            {selectedEvent.type === 'booking' && selectedEvent.status === 'Approved' && (
              <div className="bg-green-50 py-3 text-center dark:bg-green-500/10">
                <p className="text-xs font-black tracking-widest text-green-600 dark:text-green-400 uppercase flex items-center justify-center gap-1.5">
                  <MdCheckCircle size={14} /> Approved
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}