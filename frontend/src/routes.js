import React from "react";
import { MdLock, MdGavel, MdOutlineVerifiedUser, MdEvent, MdAddCircle, MdCalendarMonth, MdSchedule, MdCheckCircle, MdDashboard, MdOutlineLibraryAddCheck } from "react-icons/md";

// --- IMPORTS ---
import StudentSchedule from "pages/student/bookings/StudentSchedule";
import MySchedule from "pages/faculty/MySchedule";
import ExecutiveDashboard from "pages/admin/ExecutiveDashboard";
import ExecutiveApprovals from "pages/admin/ExecutiveApprovals";
import Approvals from "pages/faculty/Approvals";
import JRApprovals from "pages/admin/JrApprovals";
import JRCampusSchedule from "pages/admin/JrCampusSchedule";
import JRDashboard from "pages/admin/JrDashboard";
import FacultyRoomCalendar from "pages/faculty/FacultyRoomCalendar";
import StudentBookings from "pages/student/bookings/StudentBookings";
import BookRoom from "pages/student/bookings/BookRoom";
import RoomCalendar from "pages/student/bookings/RoomCalendar";
import SignIn from "pages/SignIn";
// EXPLICIT STUDENT SCHEDULE IMPORT

const routes = [
  // ==========================================
  // STUDENT ROUTES
  // ==========================================
  {
    name: "My Bookings",
    layout: "/admin", 
    path: "my-bookings",
    icon: <MdEvent className="h-5 w-5" />,
    component: <StudentBookings />,
  },
  {
    name: "Book a Room",
    layout: "/admin",
    path: "book-room",
    icon: <MdAddCircle className="h-5 w-5" />,
    component: <BookRoom />,
  },
  {
    name: "Room Calendar",
    layout: "/admin",
    path: "room-calendar",
    icon: <MdCalendarMonth className="h-5 w-5" />, 
    component: <RoomCalendar />,
  },
 {
    name: "Student Schedule",
    layout: "/admin",
    path: "student-schedule", 
    icon: <MdSchedule className="h-5 w-5" />,
    component: <StudentSchedule />, 
},

  // ==========================================
  // JR ASSISTANT / ADMIN ROUTES (Hidden for Students in prod)
  // ==========================================
  {
    name: "My Schedule",
    layout: "/admin",
    path: "my-schedule",
    icon: <MdSchedule className="h-5 w-5" />,
    component: <MySchedule />,
  },
  {
    name: "Approvals",
    layout: "/admin",
    path: "approvals",
    icon: <MdCheckCircle className="h-5 w-5" />,
    component: <Approvals />,
  },
  {
    name: "Faculty Calendar",
    layout: "/admin",
    path: "faculty-calendar", 
    icon: <MdCalendarMonth className="h-5 w-5" />,
    component: <FacultyRoomCalendar />,
  },
  {
    name: "Campus Schedule",
    layout: "/admin",
    path: "campus-schedule",
    icon: <MdCalendarMonth className="h-5 w-5" />,
    component: <JRCampusSchedule />,
  }, 
  {
    name: "Dashboard",
    layout: "/admin",
    path: "jr-dashboard",
    icon: <MdDashboard className="h-5 w-5" />,
    component: <JRDashboard />,
  },
  {
    name: "Triage Queue", 
    layout: "/admin",
    path: "jr-approvals",
    icon: <MdOutlineLibraryAddCheck className="h-5 w-5" />,
    component: <JRApprovals />,
  },
  {
    name: "Superintendent Dash",
    layout: "/admin",
    path: "exec-dashboard",
    icon: <MdGavel className="h-5 w-5" />,
    component: <ExecutiveDashboard role="superintendent" />,
  },
  {
    name: "Superintendent Approvals",
    layout: "/admin",
    path: "exec-approvals",
    icon: <MdOutlineVerifiedUser className="h-5 w-5" />,
    component: <ExecutiveApprovals role="superintendent" />,
  },
  {
    name: "AR Dashboard",
    layout: "/admin",
    path: "ar-dashboard",
    icon: <MdGavel className="h-5 w-5" />,
    component: <ExecutiveDashboard role="ar" />,
  },
  {
    name: "AR Approvals",
    layout: "/admin",
    path: "ar-approvals",
    icon: <MdOutlineVerifiedUser className="h-5 w-5" />,
    component: <ExecutiveApprovals role="ar" />,
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "portal",
    icon: <MdLock className="h-5 w-5" />,
    component: <SignIn />,
  }
];

export default routes;