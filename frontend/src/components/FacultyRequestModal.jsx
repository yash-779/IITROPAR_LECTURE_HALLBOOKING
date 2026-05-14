import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdClose, MdCheckCircle, MdCancel, MdLocationOn, MdCalendarMonth,
  MdPerson, MdAccessTime, MdInfo, MdArrowForward, MdOutlineEventNote, MdSchool
} from "react-icons/md";
import { respondToFacultyRequest } from "../services/api";
const fmtDate = (d) => {
  if (!d) return "—";
  const parsed = new Date(d + "T00:00:00");
  return isNaN(parsed) ? d : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
export default function FacultyRequestModal({ request, onClose, onRespond }) {
  const navigate = useNavigate();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const backdropRef = useRef(null);
  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };
  const handleReject = async () => {
    setIsSaving(true);
    try {
      await respondToFacultyRequest(request._id, "rejected", { rejectionReason });
      onRespond({ ...request, status: "rejected", rejectionReason });
      onClose();
    } catch (err) {
      alert("Failed to decline request. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleBookThis = () => {
    const prefillData = {
      facultyRequestId: request._id,
      clubName: request.clubName,
      activityType: request.activityType,
      activityOther: request.activityOther || "",
      purpose: request.purpose,
      audienceCount: request.audienceCount || 2,
      venueId: request.venueId,
      venueName: request.venueName,
      date: request.date,
      facultyEmail: request.faculty?.email || "",
      facultyName: request.faculty?.name || "",
    };
    navigate("/admin/book-room", { state: { prefill: prefillData } });
    onClose();
  };
  if (!request) return null;
  const faculty = request.faculty || {};
  const isAlreadyActioned = request.status !== "pending";
  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-900/70 backdrop-blur-md p-4"
    >
      <div
        className="relative w-full max-w-lg rounded-[24px] bg-white shadow-2xl dark:bg-navy-800 overflow-hidden"
        style={{ animation: "fadeInUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="relative bg-gradient-to-br from-violet-600 via-brand-500 to-indigo-600 px-6 pt-6 pb-10">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
          >
            <MdClose size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <MdOutlineEventNote size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                Private Booking Request
              </p>
              <h2 className="text-xl font-extrabold text-white leading-tight">
                {request.activityType === "Other" ? request.activityOther || "Special Request" : request.activityType}
              </h2>
            </div>
          </div>
          {isAlreadyActioned && (
            <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
              request.status === "booked" ? "bg-green-500/30 text-green-100" : "bg-red-500/30 text-red-100"
            }`}>
              {request.status === "booked" ? <MdCheckCircle size={12} /> : <MdCancel size={12} />}
              {request.status === "booked" ? "Already Booked" : "Declined"}
            </div>
          )}
        </div>
        {}
        <div className="mx-6 -mt-5 rounded-2xl bg-white shadow-lg border border-gray-100 dark:bg-navy-700 dark:border-navy-600 p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <MdPerson size={22} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Faculty In-Charge</p>
            <p className="font-bold text-navy-700 dark:text-white text-sm truncate">{faculty.name || "—"}</p>
            <p className="text-xs text-brand-500 font-semibold truncate">{faculty.email || ""}</p>
          </div>
          {faculty.facultyRole && (
            <span className="hidden sm:block text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-navy-800 rounded-lg px-2 py-1 flex-shrink-0">
              {faculty.facultyRole}
            </span>
          )}
        </div>
        {}
        <div className="px-6 pt-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-navy-900 p-3 border border-gray-100 dark:border-navy-700">
              <div className="flex items-center gap-1.5 mb-1">
                <MdLocationOn size={12} className="text-brand-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Preferred Venue</p>
              </div>
              <p className="font-bold text-navy-700 dark:text-white text-sm">{request.venueName || request.venueId || "—"}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-navy-900 p-3 border border-gray-100 dark:border-navy-700">
              <div className="flex items-center gap-1.5 mb-1">
                <MdCalendarMonth size={12} className="text-violet-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Proposed Date</p>
              </div>
              <p className="font-bold text-navy-700 dark:text-white text-sm">{fmtDate(request.date)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-navy-900 p-3 border border-gray-100 dark:border-navy-700">
              <div className="flex items-center gap-1.5 mb-1">
                <MdSchool size={12} className="text-indigo-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Club / Body</p>
              </div>
              <p className="font-bold text-navy-700 dark:text-white text-sm">{request.clubName || "—"}</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-navy-900 p-3 border border-gray-100 dark:border-navy-700">
              <div className="flex items-center gap-1.5 mb-1">
                <MdPerson size={12} className="text-emerald-500" />
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Audience</p>
              </div>
              <p className="font-bold text-navy-700 dark:text-white text-sm">{request.audienceCount || 2} people</p>
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-navy-900 p-3 border border-gray-100 dark:border-navy-700">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MdInfo size={12} className="text-amber-500" />
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Purpose / Note from Faculty</p>
            </div>
            <p className="text-sm text-navy-700 dark:text-gray-300 font-medium leading-relaxed">{request.purpose || "—"}</p>
            {request.message && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic border-t border-gray-100 dark:border-navy-700 pt-2">
                "{request.message}"
              </p>
            )}
          </div>
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 flex items-start gap-2">
            <MdAccessTime size={15} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
              Time slot is <strong>not pre-set</strong> — you choose the opening &amp; closing time when booking.
            </p>
          </div>
          {request.status === "rejected" && request.rejectionReason && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-3">
              <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Your Rejection Reason</p>
              <p className="text-xs text-red-700 dark:text-red-300">{request.rejectionReason}</p>
            </div>
          )}
        </div>
        {}
        {!isAlreadyActioned && (
          <div className="px-6 pb-6">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  <MdCancel size={18} /> Decline
                </button>
                <button
                  onClick={handleBookThis}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Book This Room <MdArrowForward size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">
                  Reason for declining (optional)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, venue not suitable..."
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:bg-navy-900 dark:border-navy-700 dark:text-white"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 rounded-2xl border border-gray-200 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:border-navy-700 dark:hover:bg-navy-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isSaving}
                    className="flex-1 rounded-2xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? "Declining..." : "Confirm Decline"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
