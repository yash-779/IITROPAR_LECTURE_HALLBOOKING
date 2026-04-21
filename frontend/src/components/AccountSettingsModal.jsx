import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // <-- THIS FIXES THE LAYOUT BUG!
import { MdClose, MdSchool, MdSave } from "react-icons/md";
import courseData from "../variables/courseData"; // Adjust path if needed
import { updateUserCourses } from "../services/api";

export default function AccountSettingsModal({ isOpen, onClose }) {
  const availableCourseCodes = [...new Set(courseData.map(c => c.code))];
  
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [studentInfo, setStudentInfo] = useState({ id: "", name: "", email: "" });
useEffect(() => {
    if (isOpen) {
      const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user") || "{}";
      let liveUser = {};
      try {
        liveUser = JSON.parse(storedUser);
      } catch {
        liveUser = {};
      }
      if (liveUser && liveUser._id) {
        setStudentInfo({
          id: liveUser._id, // STRICTLY pulls your MongoDB ID
          name: liveUser.name,
          email: liveUser.email
        });
        setSelectedCourses(liveUser.enrolledCourses || []);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleCourse = (courseCode) => {
    if (selectedCourses.includes(courseCode)) {
      setSelectedCourses(selectedCourses.filter(c => c !== courseCode));
    } else {
      if (selectedCourses.length < 8) {
        setSelectedCourses([...selectedCourses, courseCode]);
      } else {
        alert("Maximum limit reached! You can only select up to 8 courses.");
      }
    }
  };

  const handleSave = async () => {
    if (!studentInfo.id) return alert("Security Error: No Database ID found. Please log out and log back in.");
    setIsSaving(true);
    
    try {
      const updatedCourses = await updateUserCourses(studentInfo.id, selectedCourses);
      const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
      let currentUser = {};
      try {
        currentUser = JSON.parse(storage.getItem("user") || "{}");
      } catch {
        currentUser = {};
      }
      storage.setItem("user", JSON.stringify({ ...currentUser, enrolledCourses: updatedCourses }));

      // Notify all listening components (e.g. StudentSchedule) that courses changed
      window.dispatchEvent(new Event("coursesUpdated"));

      alert("Credentials successfully updated!");
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update courses.";
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // --- THE PORTAL CONTENT ---
  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-navy-900/80 backdrop-blur-sm p-4 transition-opacity">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-3xl dark:bg-navy-800 flex flex-col max-h-[90vh]">
        
        <button onClick={onClose} className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-navy-700 dark:text-gray-300">
          <MdClose size={20} />
        </button>
        
        <div className="shrink-0 mb-4">
          <h2 className="text-2xl font-bold text-navy-700 dark:text-white">Account Settings</h2>
          <p className="text-sm text-gray-500">Manage your profile and course credentials.</p>
        </div>
        
        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
            <div className="flex flex-col md:flex-row gap-4 rounded-xl bg-gray-50 p-4 mb-6 border border-gray-100 dark:bg-navy-900 dark:border-navy-700">
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-widest text-brand-500 uppercase">Registered Name</span>
                <p className="font-bold text-navy-700 dark:text-white text-lg mt-1">{studentInfo.name || "Loading..."}</p>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold tracking-widest text-brand-500 uppercase">Institutional Email</span>
                <p className="font-bold text-navy-700 dark:text-white text-lg mt-1">{studentInfo.email || "Loading..."}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-base font-bold text-navy-700 dark:text-white">
                  <MdSchool className="text-brand-500 h-5 w-5" /> Course Credentials
                </h3>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedCourses.length === 8 ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400'}`}>
                  {selectedCourses.length} / 8 Selected
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 p-3 border border-gray-100 rounded-xl bg-gray-50/50 dark:bg-navy-900/50 dark:border-navy-700">
                {availableCourseCodes.map(code => {
                  const isSelected = selectedCourses.includes(code);
                  return (
                    <button
                      key={code}
                      onClick={() => toggleCourse(code)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-2 ${
                        isSelected ? "bg-brand-500 text-white border-brand-500 shadow-md transform scale-105" : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 dark:bg-navy-800 dark:border-navy-600 dark:text-gray-300"
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 mt-6 flex justify-end border-t border-gray-100 dark:border-navy-700 pt-4">
          <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-2 rounded-xl px-6 py-2.5 font-bold text-white transition-all shadow-md ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600'}`}>
            {isSaving ? "Syncing..." : "Save Credentials"} <MdSave size={18} />
          </button>
        </div>

      </div>
    </div>
  );

  // Use Portal to attach it to the root document body!
  return createPortal(modalContent, document.body);
}