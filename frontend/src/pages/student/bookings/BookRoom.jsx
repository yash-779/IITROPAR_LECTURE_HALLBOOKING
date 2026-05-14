import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdCheckCircle, MdArrowForward, MdArrowBack, MdClose } from "react-icons/md";
import { submitBookingRequest, respondToFacultyRequest } from "../../../services/api";
const venuesData = [
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
const blockNames = [...new Set(venuesData.map(v => v.block))];
const clubOptions = [
  "Board of Hostel Affairs", "Board of Sports Affairs", "Board of Science and Technology",
  "Board of Cultural Activities", "Board of Literary Activities", "Board of Academic Affairs",
  "Research Secretary", "NCC", "NSS", "Other"
];
export default function BookRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill || null;
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user") || "{}";
  let liveUser = {};
  try {
    liveUser = JSON.parse(storedUser);
  } catch {
    liveUser = {};
  }
  const enrolledCourses = liveUser.enrolledCourses || [];
  const extractDept = (email) => {
    if (!email) return "N/A";
    const match = email.match(/(csb|eeb|cyb|ceb|meb|mcb|mmb|phb)/i);
    return match ? match[1].toUpperCase() : "N/A";
  };
  const liveDepartment = extractDept(liveUser.email);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeBlock, setActiveBlock] = useState(blockNames[0]);
  const [numPriorities, setNumPriorities] = useState(1);
  const [activePriorityTab, setActivePriorityTab] = useState(0);
  const [logistics, setLogistics] = useState([
    { venues: [], date: "", startTime: "", endTime: "" }
  ]);
  const [formData, setFormData] = useState({
    clubNameSelection: "",
    clubNameOther: "",
    activityType: "",
    activityOther: "",
    targetCourse: "",
    audienceCount: "",
    purpose: "",
  });
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const departmentOptions = ["CSB", "EEB", "CYB", "CEB", "MEB", "MCB", "MMB", "PHB"];
  const [facultyEmails, setFacultyEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!prefill) return;
    const clubIsKnown = clubOptions.includes(prefill.clubName);
    setFormData(prev => ({
      ...prev,
      clubNameSelection: clubIsKnown ? prefill.clubName : 'Other',
      clubNameOther: clubIsKnown ? '' : (prefill.clubName || ''),
      activityType: prefill.activityType || '',
      activityOther: prefill.activityOther || '',
      audienceCount: String(prefill.audienceCount || 2),
      purpose: prefill.purpose || '',
    }));
    if (prefill.venueId) {
      const venueObj = venuesData.find(v => v.id === prefill.venueId);
      if (venueObj) {
        setActiveBlock(venueObj.block);
        setLogistics([{ venues: [venueObj.title], date: prefill.date || '', startTime: '', endTime: '' }]);
      } else {
        setLogistics([{ venues: [], date: prefill.date || '', startTime: '', endTime: '' }]);
      }
    }
    if (prefill.facultyEmail) setFacultyEmails([prefill.facultyEmail]);
  }, []);
  const requiresCourse = ["Lecture", "Examination", "Quiz"].includes(formData.activityType);
  const today = new Date().toISOString().split('T')[0];
  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const handlePriorityCountChange = (e) => {
    const count = parseInt(e.target.value);
    setNumPriorities(count);
    setLogistics(prev => {
      const newLogistics = [...prev];
      while (newLogistics.length < count) {
        newLogistics.push({ venues: [], date: "", startTime: "", endTime: "" });
      }
      return newLogistics.slice(0, count);
    });
    if (activePriorityTab >= count) setActivePriorityTab(count - 1);
  };
  const updateLogisticsField = (field, value) => {
    const updated = [...logistics];
    updated[activePriorityTab][field] = value;
    setLogistics(updated);
  };
  const handleTimeBlur = (field, value) => {
    if (!value) return;
    const minTime = "08:00";
    const maxTime = "23:00";
    let finalTime = value;
    if (value < minTime) finalTime = minTime;
    if (value > maxTime) finalTime = maxTime;
    updateLogisticsField(field, finalTime);
  };
  const toggleVenueSelection = (title) => {
    const currentVenues = logistics[activePriorityTab].venues;
    let newVenues;
    if (currentVenues.includes(title)) {
      newVenues = currentVenues.filter(v => v !== title);
    } else {
      newVenues = [...currentVenues, title];
    }
    updateLogisticsField("venues", newVenues);
  };
  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = emailInput.trim();
      if (val && !facultyEmails.includes(val)) {
        setFacultyEmails([...facultyEmails, val]);
      }
      setEmailInput("");
    }
  };
  const removeEmail = (emailToRemove) => {
    setFacultyEmails(facultyEmails.filter(e => e !== emailToRemove));
  };
  const getCapacityWarnings = () => {
    if (!formData.audienceCount) return [];
    const audience = parseInt(formData.audienceCount);
    const warnings = [];
    logistics.forEach((log, index) => {
      if (log.venues.length > 0) {
        const totalCapacity = log.venues.reduce((sum, vTitle) => {
          const room = venuesData.find(v => v.title === vTitle);
          return sum + (room ? room.capacity : 0);
        }, 0);
        if (audience > totalCapacity) {
          warnings.push(`Priority ${index + 1}: Audience (${audience}) exceeds combined capacity (${totalCapacity}) of selected rooms.`);
        }
      }
    });
    return warnings;
  };
  const VenueCard = ({ title, capacity, type }) => {
    const isSelected = logistics[activePriorityTab]?.venues.includes(title);
    return (
      <div 
        onClick={() => toggleVenueSelection(title)}
        className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 ${
          isSelected 
            ? "border-brand-500 bg-brand-50 shadow-md dark:bg-brand-400/10 dark:border-brand-400 transform scale-[1.02]" 
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-navy-600 dark:bg-navy-800"
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className={`text-lg font-bold ${isSelected ? "text-brand-600 dark:text-brand-400" : "text-navy-700 dark:text-white"}`}>
            {title}
          </h3>
          {isSelected && <MdCheckCircle className="h-6 w-6 text-brand-500 absolute top-4 right-4" />}
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Max Capacity: {capacity}</p>
          <p className="text-xs text-gray-400 mt-1">{type}</p>
        </div>
      </div>
    );
  };
 const handleSubmit = async () => {
    if (!liveUser || !liveUser._id) {
      return alert("Security Error: No Database ID found. Please log out and log back in.");
    }
    if (requiresCourse && !formData.targetCourse) {
      return alert("Please select a target course for this activity type.");
    }
    if (!requiresCourse && selectedDepartments.length === 0) {
      return alert("Please select at least one target department for this activity.");
    }
    if (facultyEmails.length === 0) return alert("Please enter at least one faculty email.");
    setIsSubmitting(true);
    try {
      const finalClubName = formData.clubNameSelection === "Other" ? formData.clubNameOther : formData.clubNameSelection;
      let formattedPriorities = [];
      logistics.forEach((log) => {
        log.venues.forEach((venueTitle) => {
          const venueObj = venuesData.find(v => v.title === venueTitle);
          if (venueObj) {
            formattedPriorities.push({
              date: log.date,
              startTime: log.startTime,
              endTime: log.endTime,
              venueId: venueObj.id,
              venueName: venueTitle
            });
          }
        });
      });
      const payload = {
        requester: liveUser._id || liveUser.id,
        clubName: finalClubName,
        activityType: formData.activityType,
        activityOther: formData.activityType === "Other" ? formData.activityOther : "",
        audienceCount: Number(formData.audienceCount),
        purpose: formData.purpose,
        priorities: formattedPriorities,
        facultyEmail: facultyEmails[0], 
        targetCourse: requiresCourse ? formData.targetCourse : null,
        targetDepartments: !requiresCourse ? selectedDepartments : []
      };
      console.log("📤 Submitting booking payload:", payload);
      const newBooking = await submitBookingRequest(payload);
      if (prefill && prefill.facultyRequestId && newBooking && newBooking._id) {
        try {
          await respondToFacultyRequest(prefill.facultyRequestId, "booked", { resultingBookingId: newBooking._id });
        } catch(e) { console.warn("Faculty request mark error:", e); }
      }
      alert("Request Successfully Submitted!");
      navigate("/admin/my-bookings"); 
    } catch (error) {
      console.error("Booking submission failed:", error);
      alert(error.response?.data?.message || "Scheduling conflict detected. Please verify your selected times and venues.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="mt-3 flex w-full flex-col items-center justify-center">
      <div className="w-full max-w-4xl rounded-[20px] bg-white p-8 shadow-3xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none">
        {}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-navy-700 dark:text-white mb-2">Book a Venue</h2>
          <p className="text-gray-500">Complete the steps below to submit your request to the Faculty In-charge.</p>
          <div className="mt-8 flex items-center justify-between relative px-2">
            <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 bg-gray-200 dark:bg-navy-700"></div>
            <div 
              className="absolute left-0 top-1/2 -z-10 h-1 -translate-y-1/2 bg-brand-500 transition-all duration-500"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            ></div>
            {[1, 2, 3].map((step) => (
              <div key={step} className={`flex h-10 w-10 items-center justify-center rounded-full border-4 font-bold transition-colors ${
                currentStep >= step 
                  ? "border-brand-500 bg-white text-brand-500 dark:bg-navy-800" 
                  : "border-gray-200 bg-gray-50 text-gray-400 dark:border-navy-700 dark:bg-navy-900"
              }`}>
                {step}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs font-bold uppercase text-gray-400">
            <span>Logistics</span>
            <span>Event Details</span>
            <span>Endorsement</span>
          </div>
        </div>
        {}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-bold text-navy-700 dark:text-white">1. Where and When?</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Booking Priorities:</label>
                <select 
                  value={numPriorities} 
                  onChange={handlePriorityCountChange}
                  className="rounded-xl border border-gray-200 bg-white p-2 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white"
                >
                  <option value={1}>1 Priority</option>
                  <option value={2}>2 Priorities</option>
                  <option value={3}>3 Priorities</option>
                </select>
              </div>
            </div>
            {numPriorities > 1 && (
              <div className="flex gap-2 mb-6">
                {[...Array(numPriorities)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePriorityTab(i)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      activePriorityTab === i 
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/30" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-700 dark:text-gray-300"
                    }`}
                  >
                    Priority {i + 1}
                  </button>
                ))}
              </div>
            )}
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-3">Filter by Block</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {blockNames.map(block => (
                <button
                  key={block}
                  onClick={() => setActiveBlock(block)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    activeBlock === block
                      ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-300"
                  }`}
                >
                  {block}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mb-4 italic">You can select multiple rooms for Priority {activePriorityTab + 1}.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 max-h-[300px] overflow-y-auto p-1">
              {venuesData.filter(v => v.block === activeBlock).map((v) => (
                <VenueCard key={v.id} title={v.title} capacity={v.capacity} type={v.type} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Date</label>
                <input 
                  type="date" 
                  min={today}
                  value={logistics[activePriorityTab].date}
                  onChange={(e) => updateLogisticsField("date", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Start Time (8 AM - 11 PM)</label>
                <input 
                  type="time" 
                  min="08:00" max="23:00"
                  value={logistics[activePriorityTab].startTime}
                  onChange={(e) => updateLogisticsField("startTime", e.target.value)}
                  onBlur={(e) => handleTimeBlur("startTime", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white" 
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">End Time (8 AM - 11 PM)</label>
                <input 
                  type="time" 
                  min="08:00" max="23:00"
                  value={logistics[activePriorityTab].endTime}
                  onChange={(e) => updateLogisticsField("endTime", e.target.value)}
                  onBlur={(e) => handleTimeBlur("endTime", e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white" 
                />
              </div>
            </div>
          </div>
        )}
        {}
        {currentStep === 2 && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-navy-700 dark:text-white mb-4">2. What are you planning?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Club / Organizing Body</label>
                <select 
                  value={formData.clubNameSelection}
                  onChange={(e) => setFormData({...formData, clubNameSelection: e.target.value})}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white"
                >
                  <option value="">Select Club/Board...</option>
                  {clubOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {formData.clubNameSelection === "Other" && (
                  <input 
                    type="text" 
                    placeholder="Enter custom organizing body" 
                    value={formData.clubNameOther}
                    onChange={(e) => setFormData({...formData, clubNameOther: e.target.value})}
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white" 
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Estimated Audience</label>
                <input 
                  type="number" 
                  placeholder="Number of attendees" 
                  value={formData.audienceCount}
                  onChange={(e) => setFormData({...formData, audienceCount: e.target.value})}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white" 
                />
                {getCapacityWarnings().map((msg, idx) => (
                  <p key={idx} className="text-xs text-red-500 mt-2 font-semibold">⚠️ {msg}</p>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Type of Activity</label>
                <select 
                  value={formData.activityType}
                  onChange={(e) => setFormData({...formData, activityType: e.target.value})}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white"
                >
                  <option value="">Select activity...</option>
                  <option value="Guest Lecture">Guest Lecture</option>
                  <option value="Lecture">Lecture</option>
                  <option value="Examination">Examination</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Club Activity">Club Activity</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Other">Other</option>
                </select>
                {formData.activityType === "Other" && (
                  <input 
                    type="text" 
                    placeholder="Specify activity..." 
                    value={formData.activityOther}
                    onChange={(e) => setFormData({...formData, activityOther: e.target.value})}
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white" 
                  />
                )}
              </div>
              {}
              {requiresCourse && (
                <div className="animate-fade-in p-4 rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30">
                  <label className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <span className="text-lg">📚</span> Target Course (Required)
                  </label>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 mb-3">This booking will be shown to all students enrolled in this course.</p>
                  <select 
                    value={formData.targetCourse}
                    onChange={(e) => setFormData({...formData, targetCourse: e.target.value})}
                    className="w-full rounded-xl border-2 border-blue-500 bg-white p-3 text-sm font-bold text-blue-600 outline-none dark:bg-navy-800 dark:text-blue-400 dark:border-blue-400"
                  >
                    <option value="">Select an enrolled course...</option>
                    {enrolledCourses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                  {formData.targetCourse && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">✓ Course selected: {formData.targetCourse}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300">Purpose of Booking & Resources Needed</label>
              <textarea 
                rows="4" 
                placeholder="Briefly explain the event and any specific needs (e.g., Projector, Mic, AC)" 
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white"
              ></textarea>
            </div>
          </div>
        )}
        {}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-navy-700 dark:text-white mb-4">3. Faculty Endorsement & Visibility</h3>
            <p className="text-sm text-gray-500 mb-6">Your request must be approved by a Faculty In-charge before it reaches AR Academics.</p>
            {}
            <div className={`rounded-2xl p-4 mb-6 border-l-4 ${requiresCourse ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-l-purple-500 bg-purple-50 dark:bg-purple-500/10'}`}>
              <p className={`text-sm font-bold ${requiresCourse ? 'text-blue-700 dark:text-blue-400' : 'text-purple-700 dark:text-purple-400'}`}>
                {requiresCourse ? (
                  <>📚 This booking will be visible to all students enrolled in the selected course</>
                ) : (
                  <>🏢 This booking will be visible to all students in the selected departments</>
                )}
              </p>
            </div>
            {}
            <div className="rounded-2xl bg-gray-50 p-6 border border-gray-200 dark:bg-navy-900 dark:border-navy-700 mb-6">
              <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase mb-4">Your Details (Auto-filled)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-navy-700 dark:text-white">
                <div><span className="text-gray-400 block mb-1">Name</span><span className="font-semibold">{liveUser.name || ""}</span></div>
                <div><span className="text-gray-400 block mb-1">Email</span><span className="font-semibold">{liveUser.email || ""}</span></div>
                <div><span className="text-gray-400 block mb-1">Department</span><span className="font-semibold">{liveDepartment}</span></div>
              </div>
            </div>
            {}
            {!requiresCourse && (
              <div className="mb-6 animate-fade-in p-5 rounded-2xl bg-purple-50 border-2 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30">
                <label className="text-sm font-bold text-purple-700 dark:text-purple-400 block mb-2 flex items-center gap-2">
                  <span className="text-lg">🎯</span> Target Departments (Required)
                </label>
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-4">Select which departments this booking is intended for. Students in these departments will see this request in their My Schedule.</p>
                <div className="flex flex-wrap gap-2">
                  {departmentOptions.map(dept => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                        selectedDepartments.includes(dept)
                          ? "border-purple-500 bg-purple-100 text-purple-700 shadow-md shadow-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-400"
                          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-navy-600 dark:bg-navy-800 dark:text-gray-300 dark:hover:border-purple-500"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                {selectedDepartments.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-3 font-semibold">✓ {selectedDepartments.length} department(s) selected</p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2 block">Search Faculty In-charge (Add multiple)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {facultyEmails.map((email, idx) => (
                  <span key={idx} className="flex items-center gap-2 bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400 px-3 py-1 rounded-full text-sm font-semibold border border-brand-200 dark:border-brand-400">
                    {email}
                    <MdClose className="cursor-pointer hover:text-red-500" onClick={() => removeEmail(email)} />
                  </span>
                ))}
              </div>
              <input 
                type="text" 
                placeholder="Type email and press Enter or comma..." 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-4 text-sm outline-none focus:border-brand-500 dark:border-navy-600 dark:bg-navy-700 dark:text-white" 
              />
            </div>
          </div>
        )}
        {}
        <div className="mt-10 flex justify-between border-t border-gray-200 pt-6 dark:border-navy-700">
          <button 
            onClick={handleBack} 
            disabled={currentStep === 1}
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold transition-all ${
              currentStep === 1 
                ? "text-gray-400 cursor-not-allowed opacity-50" 
                : "text-navy-700 bg-gray-100 hover:bg-gray-200 dark:text-white dark:bg-navy-700 dark:hover:bg-navy-600"
            }`}
          >
            <MdArrowBack /> Back
          </button>
          {currentStep < 3 ? (
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-bold text-white transition-all hover:bg-brand-600 active:bg-brand-700 shadow-md shadow-brand-500/30"
            >
              Continue <MdArrowForward />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 font-bold text-white transition-all shadow-lg shadow-green-500/30 ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"} <MdCheckCircle />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}