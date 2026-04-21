import { Routes, Route, Navigate } from "react-router-dom"; 
// Adjust this path if your SignIn is actually in "views/auth/SignIn"
import SignIn from "./pages/SignIn"; 
import MainLayout from "./layouts/MainLayout";

// --- STUDENT PAGES ---
import StudentBookings from "./pages/student/bookings/StudentBookings";
import BookRoom from "./pages/student/bookings/BookRoom";
import RoomCalendar from "./pages/student/bookings/RoomCalendar";
import StudentSchedule from "./pages/student/bookings/StudentSchedule";

// --- FACULTY PAGES ---
import MySchedule from "./pages/faculty/MySchedule";
import Approvals from "./pages/faculty/Approvals";
import FacultyRoomCalendar from "./pages/faculty/FacultyRoomCalendar";

// --- JR ASSISTANT PAGES ---
import JrApprovals from "./pages/admin/JrApprovals";
import JrCampusSchedule from "./pages/admin/JrCampusSchedule";
import JrDashboard from "./pages/admin/JrDashboard";

// --- SUPERINTENDENT PAGES ---
import ExecutiveDashboard from "./pages/admin/ExecutiveDashboard";

// --- AR (ADMINISTRATIVE REGISTRAR) PAGES ---
import ExecutiveApprovals from "./pages/admin/ExecutiveApprovals";

export default function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES (No layout wrapper) */}
      <Route path="/" element={<SignIn />} />
      <Route path="/auth/sign-in" element={<SignIn />} />

      {/* PROTECTED ROUTES (Wrapped in MainLayout) */}
      <Route element={<MainLayout />}>
        {/* STUDENT */}
        <Route path="/admin/my-bookings" element={<StudentBookings />} />
        <Route path="/admin/book-room" element={<BookRoom />} />
        <Route path="/admin/room-calendar" element={<RoomCalendar />} />
        <Route path="/admin/student-schedule" element={<StudentSchedule />} />

        {/* FACULTY */}
        <Route path="/admin/my-schedule" element={<MySchedule />} />
        <Route path="/admin/approvals" element={<Approvals />} />
        <Route path="/admin/faculty-calendar" element={<FacultyRoomCalendar />} />

        {/* JR ASSISTANT */}
        <Route path="/admin/jr-approvals" element={<JrApprovals />} />
        <Route path="/admin/campus-schedule" element={<JrCampusSchedule />} />
        <Route path="/admin/jr-dashboard" element={<JrDashboard />} />

        {/* SUPERINTENDENT */}
        <Route path="/admin/exec-dashboard" element={<ExecutiveDashboard role="superintendent" />} />
        <Route path="/admin/exec-approvals" element={<ExecutiveApprovals role="superintendent" />} />

        {/* AR (ADMINISTRATIVE REGISTRAR) */}
        <Route path="/admin/ar-dashboard" element={<ExecutiveDashboard role="ar" />} />
        <Route path="/admin/ar-approvals" element={<ExecutiveApprovals role="ar" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}