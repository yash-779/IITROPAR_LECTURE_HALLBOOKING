import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MdAdd, MdClose, MdSend, MdPerson, MdLocationOn, MdCalendarMonth,
  MdCheckCircle, MdCancel, MdPendingActions, MdRefresh, MdOutlineEventNote,
  MdSearch, MdInfo, MdAccessTime
} from "react-icons/md";
import {
  createFacultyBookingRequest,
  fetchFacultyRequests,
  searchStudents
} from "../../services/api";
import { VENUES } from "../../variables/constants";
const CLUB_OPTIONS = [
  "Board of Hostel Affairs", "Board of Sports Affairs", "Board of Science and Technology",
  "Board of Cultural Activities", "Board of Literary Activities", "Board of Academic Affairs",
  "Research Secretary", "NCC", "NSS", "Other"
];
const ACTIVITY_OPTIONS = [
  "Guest Lecture", "Lecture", "Examination", "Quiz", "Club Activity",
  "Workshop", "Seminar", "Private Discussion", "Other"
];
const fmtDate = (d) => {
  if (!d) return "—";
  const p = new Date(d + "T00:00:00");
  return isNaN(p) ? d : p.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const statusConfig = (s) => {
  if (s === "booked")   return { bg: "bg-green-500/10",  text: "text-green-400",  dot: "bg-green-500",              label: "Student Booked" };
  if (s === "rejected") return { bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-500",                label: "Student Declined" };
  return                      { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400 animate-pulse", label: "Awaiting Student" };
};
export default function FacultyRequests() {
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isSaving, setIsSaving]         = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [studentQuery, setStudentQuery]     = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchLoading, setSearchLoading]   = useState(false);
  const searchTimeout = useRef(null);
  const [form, setForm] = useState({
    clubName: "", activityType: "", activityOther: "",
    purpose: "", audienceCount: 2, venueId: "", date: "", message: ""
  });
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const facultyId = user._id || user.id;
  const load = useCallback(async () => {
    if (!facultyId) return;
    setLoading(true);
    try {
      const data = await fetchFacultyRequests(facultyId);
      setRequests(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [facultyId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (studentQuery.length < 2) { setStudentResults([]); return; }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchStudents(studentQuery);
        setStudentResults(results || []);
      } catch { setStudentResults([]); }
      finally { setSearchLoading(false); }
    }, 350);
    return () => clearTimeout(searchTimeout.current);
  }, [studentQuery]);
  const resetForm = () => {
    setForm({ clubName: "", activityType: "", activityOther: "", purpose: "", audienceCount: 2, venueId: "", date: "", message: "" });
    setSelectedStudent(null); setStudentQuery(""); setStudentResults([]);
  };
  const handleSubmit = async () => {
    if (!selectedStudent) return alert("Please select a student.");
    if (!form.clubName || !form.activityType || !form.purpose || !form.venueId || !form.date)
      return alert("Please fill in all required fields.");
    setIsSaving(true);
    try {
      const venueObj = VENUES.find(v => v.id === form.venueId);
      await createFacultyBookingRequest({
        facultyId, studentId: selectedStudent._id,
        clubName: form.clubName, activityType: form.activityType, activityOther: form.activityOther,
        purpose: form.purpose, audienceCount: form.audienceCount,
        venueId: form.venueId, venueName: venueObj?.name || form.venueId,
        date: form.date, message: form.message
      });
      await load();
      setIsModalOpen(false);
      resetForm();
    } catch (e) { alert(e.response?.data?.message || "Failed to send request."); }
    finally { setIsSaving(false); }
  };
  const filtered = requests.filter(r => filterStatus === "all" || r.status === filterStatus);
  const pendingCount = requests.filter(r => r.status === "pending").length;
  return (
    <div className="relative mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-gradient-to-br dark:from-navy-900 dark:to-navy-800 p-2 lg:p-4">
      {}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-2xl font-extrabold text-navy-700 dark:text-white">My Booking Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Private discussion requests sent to students</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white">
            <option value="all">All Status</option>
            <option value="pending">Awaiting</option>
            <option value="booked">Booked</option>
            <option value="rejected">Declined</option>
          </select>
          <button onClick={load} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors" title="Refresh">
            <MdRefresh size={20} />
          </button>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:opacity-90 transition-all"
          >
            <MdAdd size={18} /> Request a Booking
          </button>
        </div>
      </div>
      {}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Total Sent",  value: requests.length, color: "text-brand-400",  bg: "bg-brand-500/10" },
          { label: "Awaiting",    value: pendingCount,    color: "text-violet-400", bg: "bg-violet-500/10" },
          { label: "Room Booked", value: requests.filter(r => r.status === "booked").length, color: "text-green-400", bg: "bg-green-500/10" }
        ].map(s => (
          <div key={s.label} className={`rounded-2xl ${s.bg} border border-white/5 p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs font-bold text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm font-bold">Loading requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-[20px] border-2 border-dashed border-gray-200 dark:border-navy-700">
          <MdOutlineEventNote className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-navy-700 dark:text-white">No requests yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">Send a private booking request to a student.</p>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-md shadow-brand-500/25">
            <MdAdd size={18} /> Send Your First Request
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(req => {
            const sc = statusConfig(req.status);
            const student = req.student || {};
            return (
              <div key={req._id} className={`relative rounded-2xl border border-white/5 ${sc.bg} p-5 transition-all hover:shadow-xl hover:-translate-y-0.5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${sc.dot}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${sc.text}`}>{sc.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{fmtDate(req.createdAt)}</span>
                </div>
                <h3 className="font-extrabold text-navy-700 dark:text-white text-base leading-tight mb-1">
                  {req.activityType === "Other" ? req.activityOther || "Request" : req.activityType}
                </h3>
                <p className="text-xs text-gray-500 mb-4">{req.clubName}</p>
                <div className="rounded-xl bg-white/60 dark:bg-navy-800/60 p-3 mb-3 flex items-center gap-3 border border-white/20 dark:border-navy-700/50">
                  <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <MdPerson size={16} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-700 dark:text-white truncate">{student.name || "—"}</p>
                    <p className="text-[10px] text-gray-400 truncate">{student.entryNo || student.email || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-3 mb-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><MdLocationOn size={12} className="text-brand-500" />{req.venueName || req.venueId}</div>
                  <span className="text-gray-300">·</span>
                  <div className="flex items-center gap-1"><MdCalendarMonth size={12} className="text-violet-500" />{fmtDate(req.date)}</div>
                </div>
                {req.status === "rejected" && req.rejectionReason && (
                  <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2">
                    <p className="text-[10px] font-black uppercase text-red-500 mb-0.5">Student's reason</p>
                    <p className="text-xs text-red-400 italic">"{req.rejectionReason}"</p>
                  </div>
                )}
                {req.status === "booked" && (
                  <div className="mt-2 rounded-lg bg-green-500/10 border border-green-500/20 p-2 flex items-center gap-2">
                    <MdCheckCircle size={14} className="text-green-500" />
                    <p className="text-xs font-bold text-green-500">Room booked by student!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-900/70 backdrop-blur-md p-4">
          <div className="relative w-full max-w-2xl rounded-[24px] bg-white dark:bg-navy-800 shadow-2xl flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-violet-600 to-brand-500 px-7 py-5 flex items-center justify-between flex-shrink-0 rounded-t-[24px]">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Private Booking Request</p>
                <h2 className="text-xl font-extrabold text-white">Send Room Request to Student</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors">
                <MdClose size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-7 py-6 space-y-5">
              <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 p-3 flex items-start gap-2">
                <MdInfo size={15} className="text-violet-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                  The student will receive a notification. They can book the room with your details pre-filled — except the time slot, which they must choose.
                </p>
              </div>
              {}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Select Student <span className="text-red-400">*</span></label>
                {selectedStudent ? (
                  <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 p-3">
                    <div className="h-9 w-9 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <MdPerson size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-navy-700 dark:text-white text-sm">{selectedStudent.name}</p>
                      <p className="text-xs text-gray-500">{selectedStudent.entryNo} · {selectedStudent.email}</p>
                    </div>
                    <button onClick={() => { setSelectedStudent(null); setStudentQuery(""); }} className="rounded-full p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <MdClose size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch size={16} /></div>
                    <input type="text" value={studentQuery} onChange={e => setStudentQuery(e.target.value)}
                      placeholder="Search by name, entry no, or email…"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" />
                    {(studentResults.length > 0 || searchLoading) && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl bg-white dark:bg-navy-700 shadow-xl border border-gray-100 dark:border-navy-600 overflow-hidden">
                        {searchLoading ? (
                          <div className="p-4 text-center text-xs text-gray-400">Searching…</div>
                        ) : studentResults.map(s => (
                          <button key={s._id} onClick={() => { setSelectedStudent(s); setStudentQuery(""); setStudentResults([]); }}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-navy-600 transition-colors border-b border-gray-100 dark:border-navy-600 last:border-b-0">
                            <p className="font-bold text-navy-700 dark:text-white">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.entryNo} · {s.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Club / Organizing Body <span className="text-red-400">*</span></label>
                <select value={form.clubName} onChange={e => setForm({ ...form, clubName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm">
                  <option value="">Select club…</option>
                  {CLUB_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Type of Activity <span className="text-red-400">*</span></label>
                <select value={form.activityType} onChange={e => setForm({ ...form, activityType: e.target.value, activityOther: "" })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm">
                  <option value="">Select activity…</option>
                  {ACTIVITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {form.activityType === "Other" && (
                  <input type="text" value={form.activityOther} onChange={e => setForm({ ...form, activityOther: e.target.value })} placeholder="Specify activity…"
                    className="mt-2 w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" />
                )}
              </div>
              {}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Preferred Venue <span className="text-red-400">*</span></label>
                  <select value={form.venueId} onChange={e => setForm({ ...form, venueId: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm">
                    <option value="">Select venue…</option>
                    {VENUES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Proposed Date <span className="text-red-400">*</span></label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" />
                </div>
              </div>
              {}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Audience Count</label>
                <input type="number" min={1} max={500} value={form.audienceCount} onChange={e => setForm({ ...form, audienceCount: parseInt(e.target.value) || 2 })}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" />
              </div>
              {}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Purpose / Description <span className="text-red-400">*</span></label>
                <textarea rows={3} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
                  placeholder="Describe the reason for this private meeting / booking…"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm resize-none" />
              </div>
              {}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Personal Message (optional)</label>
                <input type="text" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="e.g. Please book at your earliest convenience…"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white outline-none text-sm" />
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 flex items-start gap-2">
                <MdAccessTime size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Note:</strong> You are not setting the exact time. The student will choose the time slot when they book the room.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 px-7 py-4 border-t border-gray-100 dark:border-navy-700 flex justify-end gap-3 rounded-b-[24px]">
              <button onClick={() => setIsModalOpen(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:border-navy-700 dark:hover:bg-navy-700 transition-all">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-brand-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:opacity-90 disabled:opacity-50 transition-all">
                {isSaving ? "Sending…" : <><MdSend size={16} /> Send Request</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
