import React, { useState, useEffect } from "react";
import { fetchAllBookings, updateWorkflowStatus } from "../../services/api";
import { 
  MdCheckCircle, MdCancel, MdLocationOn, MdAccessTime, 
  MdEvent, MdPerson, MdClose, MdOutlineLibraryAddCheck, MdQrCode2
} from "react-icons/md";
import QRCode from "react-qr-code";

export default function ExecutiveApprovals({ role }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");

  const currentUserRole = role || "superintendent";

  const loadBookings = async () => {
    setLoading(true);
    try {
      const dbData = await fetchAllBookings();
      // Filter based on the selected executive role
      const roleBookings = dbData.filter(b => {
        if (b.status === "Rejected") return false;
        if (currentUserRole === "superintendent") {
          return b.tracker?.jrAssistant === 'approved' && b.tracker?.superintendent === 'pending';
        } else if (currentUserRole === "ar") {
          return b.tracker?.superintendent === 'approved' && b.tracker?.ar === 'pending';
        }
        return true; // fallback
      });

      const formatted = roleBookings.map(b => {
        const displaySlot = b.allocatedSlot || (b.priorities && b.priorities[0]) || {};
        return {
          ...b,
          id: b._id,
          title: b.activityType,
          venue: displaySlot.venueName || "TBD",
          date: displaySlot.date || "",
          timeDisplay: `${displaySlot.startTime || ""} - ${displaySlot.endTime || ""}`,
          organizer: b.requester?.name || "Student",
          entryNo: b.requester?.entryNo || "N/A",
          club: b.clubName || "—",
          audience: b.audienceCount || "—",
          purpose: b.purpose || "—",
        };
      });
      setBookings(formatted);
    } catch (e) {
      console.error("Failed to load exec bookings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentUserRole]);

  const handleSelect = (e, id) => {
    e.stopPropagation();
    if (selectedCards.includes(id)) setSelectedCards(selectedCards.filter(c => c !== id));
    else setSelectedCards([...selectedCards, id]);
  };

  const handleOpen = (req) => {
    setActiveRequest(req);
    setActiveTab("Details");
    setDecision("");
    setComment("");
  };

  const handleSignOff = async () => {
    if (!activeRequest || !decision) return;
    try {
      await updateWorkflowStatus(
        activeRequest.id,
        currentUserRole,
        decision === "approve" ? "approved" : "rejected",
        comment
      );
      await loadBookings();
      setActiveRequest(null);
      setDecision("");
      setComment("");
    } catch (error) {
      console.error("Failed to sign off:", error);
      alert("Error processing decision.");
    }
  };

  const fmtDate = (d) => {
    if (!d) return "TBD";
    const parsed = new Date(d);
    return isNaN(parsed) ? d : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
     return <div className="p-8 text-center text-gray-500 font-bold">Loading requests...</div>;
  }

  return (
    <div className="mt-5 w-full min-h-[85vh] rounded-[20px] dark:bg-navy-900 p-2 lg:p-4">
      
      {/* FILTER ROW */}
      <div className="mb-6 flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-2">
           <span className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">Current Role:</span>
           <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-bold uppercase tracking-widest">{currentUserRole}</span>
        </div>
        <div className="flex-1"></div>
        <input type="date" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white" />
        <select className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white">
          <option>All Venues</option>
        </select>
        <select className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-800 dark:border-navy-700 dark:text-white">
          <option>Priority: All</option>
        </select>
      </div>

      {selectedCards.length > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-2xl bg-navy-700 px-6 py-4 text-white shadow-lg dark:bg-navy-800 border border-navy-600">
          <div className="font-bold flex items-center gap-2"><MdOutlineLibraryAddCheck size={20}/> {selectedCards.length} Selected</div>
          <div className="flex gap-3">
            <button className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold hover:bg-red-600 transition-all shadow-md">Reject All</button>
            <button className="rounded-lg bg-green-500 px-4 py-2 text-xs font-bold hover:bg-green-600 transition-all shadow-md">Approve All</button>
          </div>
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {bookings.length === 0 ? (
           <div className="col-span-full py-12 text-center text-gray-400 font-bold">No pending requests for your authorization.</div>
        ) : bookings.map((req) => (
          <div 
            key={req.id}
            onClick={() => handleOpen(req)}
            className="group cursor-pointer flex flex-col rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:border-brand-500 hover:shadow-md transition-all dark:bg-navy-800 dark:border-navy-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={selectedCards.includes(req.id)}
                  onChange={(e) => handleSelect(e, req.id)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-500 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-navy-700 dark:text-white leading-tight">{req.title}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{req.id.substring(req.id.length - 6).toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-5 bg-gray-50 dark:bg-navy-900 p-3 rounded-xl border border-gray-100 dark:border-navy-700">
              <div className="flex items-center gap-1.5"><MdLocationOn className="text-gray-400" /> {req.venue}</div>
              <div className="flex items-center gap-1.5"><MdEvent className="text-gray-400" /> {fmtDate(req.date)}</div>
              <div className="col-span-2 flex items-center gap-1.5"><MdAccessTime className="text-gray-400" /> {req.timeDisplay}</div>
            </div>
            
            <div className="border-t border-gray-100 dark:border-navy-700 pt-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Pre-Approvals Completed</p>
              <div className="flex items-center gap-4 text-xs font-bold text-green-600 dark:text-green-400">
                <span className="flex items-center gap-1"><MdCheckCircle/> Faculty</span>
                <span className="flex items-center gap-1"><MdCheckCircle/> JR Assist</span>
                {currentUserRole === 'ar' && req.tracker?.superintendent === 'approved' && (
                  <span className="flex items-center gap-1"><MdCheckCircle/> Superintend</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/60 backdrop-blur-sm transition-opacity duration-300 p-4 ${activeRequest ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className={`relative w-full max-w-3xl overflow-hidden rounded-[24px] bg-white shadow-2xl transition-transform duration-300 dark:bg-navy-800 ${activeRequest ? "scale-100" : "scale-95"}`}>
          
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-navy-700 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-navy-800 dark:to-brand-900/20">
            <div>
               <h2 className="text-2xl font-black text-navy-700 dark:text-white">Authorization Required</h2>
               <p className="text-xs text-brand-500 font-bold uppercase tracking-widest mt-1">Role: {currentUserRole}</p>
            </div>
            <button onClick={() => setActiveRequest(null)} className="rounded-full p-2 bg-white/50 text-gray-500 hover:bg-white dark:bg-navy-900 dark:hover:bg-navy-700 shadow-sm transition-all duration-200">
              <MdClose size={20} />
            </button>
          </div>

          <div className="flex border-b border-gray-100 px-6 dark:border-navy-700 bg-gray-50/50 dark:bg-navy-900/30">
            {["Details", "Tracker", "E-Ticket", "Decision"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mr-8 py-4 text-sm font-bold transition-all relative ${activeTab === tab ? "text-brand-500" : "text-gray-400 hover:text-navy-700 dark:hover:text-white"}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-brand-500 rounded-t-full"></div>}
              </button>
            ))}
          </div>

          <div className="p-8 h-[50vh] overflow-y-auto bg-white dark:bg-navy-800">
            
            {activeTab === "Details" && (
              <div className="animate-fade-in space-y-6">
                 <div className="grid grid-cols-2 gap-6 p-5 rounded-xl border border-gray-100 bg-gray-50 dark:bg-navy-900 dark:border-navy-700">
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Activity</p><p className="font-bold text-navy-700 dark:text-white text-lg">{activeRequest?.title}</p></div>
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Logistics</p><p className="font-bold text-navy-700 dark:text-white">{activeRequest?.venue} • <span className="text-gray-500 text-sm font-medium">{fmtDate(activeRequest?.date)} {activeRequest?.timeDisplay}</span></p></div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6 p-5 rounded-xl border border-gray-100 bg-white dark:bg-navy-800 dark:border-navy-700">
                    <div>
                      <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3 flex items-center gap-1"><MdPerson/> Organizer Info</h4>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">{activeRequest?.organizer}</p>
                      <p className="text-xs font-medium text-gray-500">{activeRequest?.entryNo}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-3">Event Stats</h4>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">{activeRequest?.club}</p>
                      <p className="text-xs font-medium text-gray-500">Audience: {activeRequest?.audience}</p>
                    </div>
                 </div>

                 <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Purpose</p>
                   <p className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium text-navy-700 dark:bg-navy-900 dark:border-navy-700 dark:text-gray-300 leading-relaxed">{activeRequest?.purpose}</p>
                 </div>
              </div>
            )}

            {activeTab === "Tracker" && (
              <div className="animate-fade-in flex flex-col justify-center py-6 h-full">
                <div className="flex items-center justify-between relative px-2 md:px-8">
                  <div className="absolute left-10 right-10 top-1/2 h-1 -translate-y-1/2 bg-gray-200 dark:bg-navy-700 -z-10"></div>
                  {["faculty", "jrAssistant", "superintendent", "ar"].map((stageKey, i) => {
                    const status = activeRequest?.tracker?.[stageKey] || "pending";
                    const isCompleted = status === "approved";
                    const isCurrent = status === "pending" && 
                                     (i === 0 || activeRequest?.tracker?.[["faculty", "jrAssistant", "superintendent", "ar"][i-1]] === "approved");
                    
                    const labels = ["Faculty", "JR Assist", "Superin.", "AR"];
                    
                    return (
                      <div key={i} className="flex flex-col items-center gap-3 bg-white dark:bg-navy-800 px-2 relative z-10">
                        <div className={`h-10 w-10 rounded-full border-4 flex items-center justify-center font-bold text-sm ${isCompleted ? 'bg-green-500 border-white text-white dark:border-navy-800 shadow-md shadow-green-500/20' : isCurrent ? 'bg-amber-100 border-amber-500 text-amber-600 animate-pulse dark:bg-amber-500/20' : 'bg-gray-100 border-white text-gray-400 dark:bg-navy-900 dark:border-navy-800'}`}>
                          {isCompleted ? "✔" : isCurrent ? "⏳" : "○"}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-green-500' : isCurrent ? 'text-amber-500' : 'text-gray-400'}`}>{labels[i]}</span>
                      </div>
                    )
                  })}
                </div>
                {activeRequest?.comments && (
                  <div className="mt-12 space-y-3 px-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Previous Comments</p>
                    {activeRequest.comments.facultyComment && (
                       <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg dark:bg-navy-900 dark:border-navy-700 text-sm"><span className="font-bold text-gray-500 text-xs">Faculty:</span> {activeRequest.comments.facultyComment}</div>
                    )}
                    {activeRequest.comments.jrAssistantComment && (
                       <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg dark:bg-navy-900 dark:border-navy-700 text-sm"><span className="font-bold text-gray-500 text-xs">JR Assistant:</span> {activeRequest.comments.jrAssistantComment}</div>
                    )}
                     {activeRequest.comments.superintendentComment && (
                       <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg dark:bg-navy-900 dark:border-navy-700 text-sm"><span className="font-bold text-gray-500 text-xs">Superintendent:</span> {activeRequest.comments.superintendentComment}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* E-Ticket Preview for Execution View */}
            {activeTab === "E-Ticket" && (
                <div className="py-2 animate-fade-in flex justify-center h-full items-center">
                    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-200 dark:bg-navy-900 dark:border-navy-700">
                      <div className="bg-gradient-to-r from-brand-500 to-indigo-600 py-4 text-center">
                        <h3 className="text-sm font-black tracking-widest text-white">IITR SYNC</h3>
                        <p className="text-[10px] text-white/70 mt-0.5 uppercase tracking-widest">E-Ticket Preview</p>
                      </div>
                      <div className="border-b-2 border-dashed border-gray-200 p-5 text-center dark:border-navy-700">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Booking Title</p>
                        <p className="text-lg font-black text-navy-700 dark:text-white mt-1 ">{activeRequest?.title}</p>
                      </div>
                      <div className="p-5 flex justify-center">
                        <div className="p-3 border border-gray-100 rounded-xl bg-white dark:bg-white shadow-sm flex flex-col items-center justify-center opacity-40">
                          <MdQrCode2 className="h-24 w-24 text-navy-900" />
                          <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-2 uppercase">Pending AR</p>
                        </div>
                      </div>
                    </div>
                </div>
            )}

            {activeTab === "Decision" && (
              <div className="animate-fade-in py-2">
                <div className="flex gap-6 mb-8 mt-4">
                  <label className={`flex-1 cursor-pointer rounded-2xl border-2 p-6 text-center transition-all ${decision === 'approve' ? 'border-green-500 bg-green-50 shadow-[0_8px_30px_rgba(34,197,94,0.15)] dark:bg-green-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-navy-700'}`}>
                    <input type="radio" name="exec_decision" className="hidden" onChange={() => setDecision('approve')} />
                    <MdCheckCircle className={`mx-auto mb-3 h-8 w-8 transition-transform ${decision === 'approve' ? 'text-green-500 scale-110' : 'text-gray-300 dark:text-gray-600'}`} />
                    <span className={`text-lg font-black tracking-tight ${decision === 'approve' ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>Approve</span>
                  </label>
                  <label className={`flex-1 cursor-pointer rounded-2xl border-2 p-6 text-center transition-all ${decision === 'reject' ? 'border-red-500 bg-red-50 shadow-[0_8px_30px_rgba(239,68,68,0.15)] dark:bg-red-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-navy-700'}`}>
                    <input type="radio" name="exec_decision" className="hidden" onChange={() => setDecision('reject')} />
                    <MdCancel className={`mx-auto mb-3 h-8 w-8 transition-transform ${decision === 'reject' ? 'text-red-500 scale-110' : 'text-gray-300 dark:text-gray-600'}`} />
                    <span className={`text-lg font-black tracking-tight ${decision === 'reject' ? 'text-red-700 dark:text-red-400' : 'text-gray-500'}`}>Reject</span>
                  </label>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-2 block">Official Remarks (Optional unless Rejecting)</label>
                  <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-500 dark:bg-navy-900 dark:border-navy-700 dark:text-white transition-all shadow-inner" placeholder="Add any final administrative notes here..."></textarea>
                </div>
              </div>
            )}

          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 dark:bg-navy-900/50 dark:border-navy-700 flex justify-end">
             {activeTab !== "Decision" ? (
                <button 
                  onClick={() => setActiveTab("Decision")}
                  className="px-8 py-3 rounded-xl font-bold bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-all dark:bg-brand-400 dark:hover:bg-brand-500"
                >
                  Go To Decision
                </button>
             ) : (
                <button 
                  disabled={!decision}
                  onClick={handleSignOff}
                  className={`px-8 py-3 rounded-xl font-bold transition-all ${decision ? (decision === 'approve' ? 'bg-green-500 shadow-green-500/30 text-white hover:bg-green-600' : 'bg-red-500 shadow-red-500/30 text-white hover:bg-red-600') + ' shadow-lg' : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-navy-700"}`}
                >
                  Conclude & Sign-Off
                </button>
             )}
          </div>

        </div>
      </div>

    </div>
  );
}