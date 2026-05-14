import React, { useState, useEffect, useRef } from "react";
import { MdNotifications, MdSettings, MdLogout, MdEdit, MdOutlineEventNote, MdClose } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import AccountSettingsModal from "../../components/AccountSettingsModal";
import FacultyRequestModal from "../../components/FacultyRequestModal";
import { fetchStudentFacultyRequests, fetchUnseenRequestCount, markRequestsAsSeen } from "../../services/api";
const fmtDate = (d) => {
  if (!d) return "—";
  const parsed = new Date(d + "T00:00:00");
  return isNaN(parsed) ? d : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
const readUser = () => {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (raw && raw !== "undefined") return JSON.parse(raw);
  } catch {}
  return { name: "Guest", email: "", role: "" };
};
export default function Navbar({ brandText = "Dashboard" }) {
  const [user, setUser]                   = useState(readUser);
  const [profileOpen, setProfileOpen]     = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [facultyRequests, setFacultyRequests] = useState([]);
  const [unseenCount, setUnseenCount]     = useState(0);
  const popoverRef  = useRef(null);
  const intervalRef = useRef(null);
  const navigate    = useNavigate();
  useEffect(() => {
    const u = readUser();
    setUser(u);
  }, []);
  const loadRequests = async (u) => {
    const currentUser = u || readUser();
    const id = currentUser._id || currentUser.id;
    if (!id || currentUser.role !== "student") return;
    try {
      const [reqs, count] = await Promise.all([
        fetchStudentFacultyRequests(id),
        fetchUnseenRequestCount(id),
      ]);
      setFacultyRequests(reqs || []);
      setUnseenCount(typeof count === "number" ? count : 0);
    } catch (err) {
      console.error("Navbar: failed to load faculty requests", err);
    }
  };
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (user.role === "student") {
      loadRequests(user);
      intervalRef.current = setInterval(() => loadRequests(user), 30000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user.role, user._id, user.id]); 
  const handleBellClick = async () => {
    const wasOpen = notificationsOpen;
    setNotificationsOpen(!wasOpen);
    setProfileOpen(false);
    if (!wasOpen && user.role === "student" && unseenCount > 0) {
      const id = user._id || user.id;
      if (id) {
        try {
          await markRequestsAsSeen(id);
          setUnseenCount(0);
          setTimeout(() => loadRequests(user), 500);
        } catch {}
      }
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");   localStorage.removeItem("user");
    sessionStorage.removeItem("token"); sessionStorage.removeItem("user");
    navigate("/auth/sign-in");
  };
  useEffect(() => {
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const formatRole = (role) =>
    role ? role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "User";
  const isStudent     = user.role === "student";
  const pendingReqs   = facultyRequests.filter((r) => r.status === "pending");
  const displayedReqs = facultyRequests.slice(0, 8);
  const badgeCount    = isStudent ? unseenCount : 0;
  const handleRequestClick = (req) => {
    setSelectedRequest(req);
    setNotificationsOpen(false);
  };
  const handleRequestRespond = (updated) => {
    setFacultyRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    loadRequests(user);
  };
  return (
    <>
      <nav
        className="relative mt-4 mb-6 z-[90] mx-4 flex flex-row flex-wrap items-center justify-between rounded-2xl bg-navy-800/50 p-4 backdrop-blur-xl border border-navy-700/80 shadow-2xl"
        ref={popoverRef}
      >
        <h1 className="ml-2 text-2xl font-black tracking-tight text-white">{brandText}</h1>
        <div className="relative flex h-14 items-center gap-3 rounded-full bg-navy-900/90 px-3 shadow-inner border border-navy-700">
          {}
          <div className="relative flex items-center justify-center pl-2 pr-1">
            <button
              onClick={handleBellClick}
              className="group relative text-gray-400 transition-colors hover:text-brand-400"
              aria-label="Notifications"
            >
              <MdNotifications size={22} className="transition-transform group-hover:rotate-12 group-hover:scale-110" />
              {badgeCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-navy-900 animate-bounce">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              ) : (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-navy-900 animate-pulse" />
              )}
            </button>
            {}
            <div
              className={`absolute right-0 top-11 w-96 origin-top-right rounded-[20px] bg-navy-800 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-navy-700 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
                notificationsOpen
                  ? "scale-100 opacity-100 translate-y-0"
                  : "scale-95 opacity-0 translate-y-4 pointer-events-none"
              }`}
              style={{ zIndex: 110 }}
            >
              {}
              <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700">
                <div>
                  <h3 className="font-bold text-white text-sm">Notifications</h3>
                  {isStudent && pendingReqs.length > 0 && (
                    <p className="text-[10px] text-violet-400 font-bold mt-0.5">
                      {pendingReqs.length} request{pendingReqs.length > 1 ? "s" : ""} need your action
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-navy-700 hover:text-white transition-colors"
                >
                  <MdClose size={16} />
                </button>
              </div>
              {}
              <div className="max-h-[420px] overflow-y-auto">
                {!isStudent ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <MdNotifications size={32} className="text-gray-600 mb-3" />
                    <p className="text-sm font-bold text-gray-500">No new notifications</p>
                  </div>
                ) : displayedReqs.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center text-center px-6">
                    <MdOutlineEventNote size={32} className="text-gray-600 mb-3" />
                    <p className="text-sm font-bold text-gray-500">No booking requests yet</p>
                    <p className="text-xs text-gray-600 mt-1">Faculty-sent requests will appear here</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {displayedReqs.map((req) => {
                      const isPending = req.status === "pending";
                      const isNew     = !req.seenByStudent && isPending;
                      return (
                        <button
                          key={req._id}
                          onClick={() => handleRequestClick(req)}
                          className={`w-full text-left px-5 py-3.5 transition-all hover:bg-navy-700/60 border-b border-navy-700/50 last:border-b-0 ${
                            isNew ? "bg-violet-500/10" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                              isPending           ? "bg-violet-500/20"
                              : req.status === "booked" ? "bg-green-500/20"
                              : "bg-gray-500/20"
                            }`}>
                              <MdOutlineEventNote size={18} className={
                                isPending           ? "text-violet-400"
                                : req.status === "booked" ? "text-green-400"
                                : "text-gray-400"
                              } />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-white truncate">
                                  {req.faculty?.name || "Faculty"} → Room Request
                                </p>
                                {isNew && (
                                  <span className="flex-shrink-0 h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                {req.activityType === "Other" ? req.activityOther : req.activityType}
                                {req.venueName ? ` · ${req.venueName}` : ""}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] text-gray-500">{fmtDate(req.date)}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isPending           ? "bg-violet-500/20 text-violet-400"
                                  : req.status === "booked" ? "bg-green-500/20 text-green-400"
                                  : "bg-gray-500/20 text-gray-400"
                                }`}>
                                  {isPending ? "Action Required"
                                    : req.status === "booked" ? "Booked"
                                    : "Declined"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {}
              {isStudent && displayedReqs.length > 0 && (
                <div className="border-t border-navy-700 px-5 py-3">
                  <button
                    onClick={() => { navigate("/admin/faculty-requests"); setNotificationsOpen(false); }}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    View all faculty requests →
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="h-6 w-px bg-navy-700 mx-1" />
          {}
          <div className="hidden md:flex items-center rounded-full bg-brand-500/10 px-4 py-1.5 border border-brand-500/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">
              {formatRole(user.role)}
            </span>
          </div>
          {}
          <div className="relative ml-1">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
              className="group relative h-10 w-10 overflow-hidden rounded-full border-2 border-navy-700 transition-all hover:border-brand-500 shadow-md"
            >
              <img
                src="https://i.pravatar.cc/150?img=11"
                alt="Profile"
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-navy-900/60 opacity-0 transition-opacity group-hover:opacity-100">
                <MdEdit className="text-white" size={16} />
              </div>
            </button>
            <div className={`absolute right-0 top-14 w-72 origin-top-right rounded-[20px] bg-navy-800 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-navy-700 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              profileOpen
                ? "scale-100 opacity-100 translate-y-0"
                : "scale-95 opacity-0 translate-y-4 pointer-events-none"
            }`}>
              <div className="flex items-center gap-4 border-b border-navy-700 pb-4 mb-4">
                <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="h-12 w-12 rounded-full object-cover border-2 border-navy-600 shadow-md" />
                <div className="overflow-hidden">
                  <h4 className="text-base font-bold text-white leading-tight truncate">{user.name}</h4>
                  <p className="text-xs font-medium text-brand-400 mt-1 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-gray-300 transition-all hover:bg-navy-700 hover:text-white hover:translate-x-1"
                >
                  <MdSettings size={18} className="text-gray-400" /> Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 hover:translate-x-1 mt-1"
                >
                  <MdLogout size={18} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
        <AccountSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </nav>
      {}
      {selectedRequest && (
        <FacultyRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onRespond={handleRequestRespond}
        />
      )}
    </>
  );
}