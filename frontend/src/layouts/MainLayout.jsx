import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar"; 
import Navbar from "../components/navbar"; 
import routes from "../routes.js"; 

export default function MainLayout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  const [userRole, setUserRole] = useState("student"); 

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      const user = JSON.parse(storedUser);
      setUserRole(user?.role);
    }
  }, []);

  const filteredRoutes = routes.filter((route) => {
    if (!userRole) return false;
    if (userRole === "student") return ["my-bookings", "book-room", "room-calendar", "student-schedule"].includes(route.path);
    if (userRole === "faculty") return ["my-schedule", "approvals", "faculty-calendar"].includes(route.path);
    if (userRole === "jr_assistant") return ["jr-approvals", "campus-schedule", "jr-dashboard"].includes(route.path);
    if (userRole === "superintendent") return ["exec-dashboard", "exec-approvals"].includes(route.path);
    if (userRole === "ar") return ["ar-dashboard", "ar-approvals"].includes(route.path);
    return false;
  });

  const getActiveRoute = (routesArray) => {
    for (let i = 0; i < routesArray.length; i++) {
      if (location.pathname.includes(routesArray[i].path)) {
        return routesArray[i].name;
      }
    }
    return "Dashboard";
  };

  return (
    // FIX 1: Changed to min-h-screen to allow proper page scrolling
     <div className="flex min-h-screen w-full bg-navy-900 dark:bg-navy-900">      
      <Sidebar open={open} onClose={() => setOpen(false)} routes={filteredRoutes} />

      {/* FIX 2: Adjusted margin-left (ml-[80px] to ml-[280px] on hover) to prevent overlap */}
<div className="flex-1 flex flex-col transition-all duration-300 ml-[80px]">        
        {/* Navbar Wrapper */}
        <div className="pt-3 pr-4">
          <Navbar brandText={getActiveRoute(filteredRoutes)} />
        </div>

        {/* Content Wrapper - Removed h-full restrictions to restore scrolling */}
        <div className="p-4 flex-1">
          <Outlet />
        </div>

      </div>
    </div>
  );
}