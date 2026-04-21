import React, { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdEvent, MdMenu } from "react-icons/md";

// 1. ACCEPT ROUTES AS A PROP
export default function Sidebar({ routes = [] }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const location = useLocation();
  const hoverTimeout = useRef(null);

  const handleMouseEnter = () => {
    if (isPinned) return;
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 150); 
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    clearTimeout(hoverTimeout.current);
    setIsHovered(false);
  };

  const closeSidebar = () => {
    if (!isPinned) setIsHovered(false);
  };

  const isExpanded = isHovered || isPinned;

  // 2. HARDCODED ROUTES ARRAY DELETED! 
  // It now relies entirely on the 'routes' prop passed from MainLayout.

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed left-0 top-0 z-[100] h-screen bg-navy-900/95 backdrop-blur-md border-r border-navy-700 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col shadow-2xl ${
        isExpanded ? "w-[280px]" : "w-[80px]"
      }`}
    >
      {/* ☰ HEADER & PIN BUTTON */}
      <div className="flex h-24 items-center justify-between px-6 border-b border-navy-700 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/20">
            <MdEvent size={24} />
          </div>
          <h1 className={`text-2xl font-black text-white transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 w-0 hidden"}`}>
            IITR <span className="text-brand-400">SYNC</span>
          </h1>
        </div>
        
        <button 
          onClick={() => setIsPinned(!isPinned)}
          className={`shrink-0 rounded-lg p-2 text-gray-400 hover:bg-navy-800 hover:text-white transition-all ${isExpanded ? "opacity-100" : "opacity-0 pointer-events-none hidden"}`}
        >
          <MdMenu size={24} className={isPinned ? "text-brand-400" : ""} />
        </button>
      </div>

      {/* LINKS LIST */}
      <div className="no-scrollbar flex flex-col gap-2 p-4 mt-4 overflow-y-auto pb-24">
        {routes.map((route) => {
          // 3. COMBINE LAYOUT AND PATH (e.g., "/admin" + "/" + "my-bookings")
          const fullPath = route.layout ? `${route.layout}/${route.path}` : route.path;
          const isActive = location.pathname === fullPath;
          
          return (
            <Link
              key={route.name}
              to={fullPath}
              onClick={closeSidebar}
              className={`group relative flex items-center gap-4 rounded-xl px-3 py-3 transition-all duration-200 ${
                isActive 
                  ? "bg-brand-500/10 text-brand-400" 
                  : "text-gray-400 hover:bg-navy-800 hover:text-white"
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand-500"></div>}
              
              <div className="shrink-0">{route.icon}</div>
              
              <span className={`font-bold whitespace-nowrap transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 w-0 hidden"}`}>
                {route.name}
              </span>

              {!isExpanded && (
                <div className="absolute left-20 rounded-md bg-navy-800 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                  {route.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}