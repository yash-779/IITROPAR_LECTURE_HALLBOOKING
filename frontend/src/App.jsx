import { Routes, Route, Navigate } from "react-router-dom"; 
import SignIn from "./pages/SignIn"; 
import LandingPage from "./pages/LandingPage";
import MainLayout from "./layouts/MainLayout";
import StudentBookings from "./pages/student/bookings/StudentBookings";
import BookRoom from "./pages/student/bookings/BookRoom";
import RoomCalendar from "./pages/student/bookings/RoomCalendar";
import StudentSchedule from "./pages/student/bookings/StudentSchedule";
import MySchedule from "./pages/faculty/MySchedule";
import Approvals from "./pages/faculty/Approvals";
import FacultyRoomCalendar from "./pages/faculty/FacultyRoomCalendar";
import JrApprovals from "./pages/admin/JrApprovals";
import JrCampusSchedule from "./pages/admin/JrCampusSchedule";
import JrDashboard from "./pages/admin/JrDashboard";
import ExecutiveDashboard from "./pages/admin/ExecutiveDashboard";
import ExecutiveApprovals from "./pages/admin/ExecutiveApprovals";
export default function App() {
  return (
    <Routes>
      {}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      {}
      <Route element={<MainLayout />}>
        {}
        <Route path="/admin/my-bookings" element={<StudentBookings />} />
        <Route path="/admin/book-room" element={<BookRoom />} />
        <Route path="/admin/room-calendar" element={<RoomCalendar />} />
        <Route path="/admin/student-schedule" element={<StudentSchedule />} />
        {}
        <Route path="/admin/my-schedule" element={<MySchedule />} />
        <Route path="/admin/approvals" element={<Approvals />} />
        <Route path="/admin/faculty-calendar" element={<FacultyRoomCalendar />} />
        {}
        <Route path="/admin/jr-approvals" element={<JrApprovals />} />
        <Route path="/admin/campus-schedule" element={<JrCampusSchedule />} />
        <Route path="/admin/jr-dashboard" element={<JrDashboard />} />
        {}
        <Route path="/admin/exec-dashboard" element={<ExecutiveDashboard role="superintendent" />} />
        <Route path="/admin/exec-approvals" element={<ExecutiveApprovals role="superintendent" />} />
        {}
        <Route path="/admin/ar-dashboard" element={<ExecutiveDashboard role="ar" />} />
        <Route path="/admin/ar-approvals" element={<ExecutiveApprovals role="ar" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}