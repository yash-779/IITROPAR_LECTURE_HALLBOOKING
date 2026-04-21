import React, { useState, useEffect, useRef } from "react";
import { MdNotifications, MdSettings, MdLogout, MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";

// IMPORT YOUR MODAL HERE (Adjust the path if your modal is saved in a different folder!)
import AccountSettingsModal from "../../components/AccountSettingsModal"; 

export default function Navbar({ brandText = "Dashboard" }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // --- ADDED STATE FOR SETTINGS MODAL ---
  const [settingsOpen, setSettingsOpen] = useState(false); 
  
  const popoverRef = useRef(null);
  const navigate = useNavigate();

  const [user, setUser] = useState({ name: "Guest", email: "", role: "User" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/auth/sign-in"); 
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatRole = (role) => {
    if (!role) return "User";
    return role.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <nav 
      className="relative mt-4 mb-6 z-[90] mx-4 flex flex-row flex-wrap items-center justify-between rounded-2xl bg-navy-800/50 p-4 backdrop-blur-xl border border-navy-700/80 shadow-2xl transition-all" 
      ref={popoverRef}
    >
      <h1 className="ml-2 text-2xl font-black tracking-tight text-white">
        {brandText}
      </h1>

      <div className="relative flex h-14 items-center gap-3 rounded-full bg-navy-900/90 px-3 shadow-inner border border-navy-700">
        
        <div className="relative flex items-center justify-center pl-2 pr-1">
          <button 
            onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
            className="group relative text-gray-400 transition-colors hover:text-brand-400"
          >
            <MdNotifications size={22} className="transition-transform group-hover:rotate-12 group-hover:scale-110" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-navy-900 animate-pulse"></span>
          </button>
        </div>

        <div className="h-6 w-px bg-navy-700 mx-1"></div>

        <div className="hidden md:flex items-center rounded-full bg-brand-500/10 px-4 py-1.5 border border-brand-500/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">
            {formatRole(user.role)}
          </span>
        </div>

        <div className="relative ml-1">
          <button 
            onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
            className="group relative h-10 w-10 overflow-hidden rounded-full border-2 border-navy-700 transition-all hover:border-brand-500 shadow-md"
          >
            <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 flex items-center justify-center bg-navy-900/60 opacity-0 transition-opacity group-hover:opacity-100">
              <MdEdit className="text-white" size={16} />
            </div>
          </button>

          <div 
            className={`absolute right-0 top-14 w-72 origin-top-right rounded-[20px] bg-navy-800 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-navy-700 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              profileOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-4 border-b border-navy-700 pb-4 mb-4">
              <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="h-12 w-12 rounded-full object-cover border-2 border-navy-600 shadow-md" />
              <div className="overflow-hidden">
                <h4 className="text-base font-bold text-white leading-tight truncate">{user.name}</h4>
                <p className="text-xs font-medium text-brand-400 mt-1 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              
              {/* --- ADDED ONCLICK EVENT HERE --- */}
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

      {/* --- ADDED RENDERED MODAL COMPONENT HERE --- */}
      <AccountSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
    </nav>
  );
}