import axios from 'axios';
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});
export const fetchAllBookings = async () => {
  try { const r = await API.get('/bookings'); return r.data; }
  catch (e) { console.error("fetchAllBookings:", e); return []; }
};
export const submitBookingRequest = async (bookingData) => {
  try { const r = await API.post('/bookings', bookingData); return r.data; }
  catch (e) { console.error("submitBookingRequest:", e); throw e; }
};
export const fetchBookingsByFaculty = async (facultyId) => {
  try { const r = await API.get(`/bookings/faculty/${facultyId}`); return r.data; }
  catch (e) { console.error("fetchBookingsByFaculty:", e); return []; }
};
export const fetchBookingsByRequester = async (userId) => {
  try { const r = await API.get(`/bookings/requester/${userId}`); return r.data; }
  catch (e) { console.error("fetchBookingsByRequester:", e); return []; }
};
export const updateUserCourses = async (userId, courses) => {
  try { const r = await API.put('/auth/update-courses', { userId, courses }); return r.data; }
  catch (e) { console.error("updateUserCourses:", e); throw e; }
};
export const updateWorkflowStatus = async (
  bookingId, stage, action,
  comment = "", allocatedSlot = null, proposedChanges = null,
  facultyCommentScope = null, resubmittedPriority = null
) => {
  try {
    const r = await API.put(`/bookings/${bookingId}/status`, {
      stage, action, comment, allocatedSlot, proposedChanges,
      facultyCommentScope, resubmittedPriority,
    });
    return r.data;
  } catch (e) { console.error("updateWorkflowStatus:", e); throw e; }
};
export const submitFacultyDecision = async (bookingId, action, comment = '', proposedChanges = null, facultyCommentScope = null) =>
  updateWorkflowStatus(bookingId, 'faculty', action, comment, null, proposedChanges, facultyCommentScope);
export const resubmitBooking = async (bookingId, resubmittedPriority) =>
  updateWorkflowStatus(bookingId, 'faculty', 'pending', '', null, null, null, resubmittedPriority);
export const submitJrDecision = async (bookingId, action, allocatedSlot = null, comment = '') => {
  if (action === 'approved') return updateWorkflowStatus(bookingId, 'jrAssistant', action, '', allocatedSlot);
  return updateWorkflowStatus(bookingId, 'jrAssistant', action, comment);
};
export const fetchBookingsByDate = async (date) => {
  try { const r = await API.get(`/bookings/date/${date}`); return r.data; }
  catch (e) { console.error("fetchBookingsByDate:", e); return []; }
};
export const fetchBookingsByVenueDate = async (venueId, date) => {
  try { const r = await API.get(`/bookings/venue/${venueId}/date/${date}`); return r.data; }
  catch (e) { console.error("fetchBookingsByVenueDate:", e); return []; }
};
export const fetchBookingsForStudent = async (studentId) => {
  try { const r = await API.get(`/bookings/for-student/${studentId}`); return r.data; }
  catch (e) { console.error("fetchBookingsForStudent:", e); return []; }
};
export const createFacultyBookingRequest = async (requestData) => {
  try { const r = await API.post('/faculty-requests', requestData); return r.data; }
  catch (e) { console.error("createFacultyBookingRequest:", e); throw e; }
};
export const fetchFacultyRequests = async (facultyId) => {
  try { const r = await API.get(`/faculty-requests/by-faculty/${facultyId}`); return r.data; }
  catch (e) { console.error("fetchFacultyRequests:", e); return []; }
};
export const fetchStudentFacultyRequests = async (studentId) => {
  try { const r = await API.get(`/faculty-requests/for-student/${studentId}`); return r.data; }
  catch (e) { console.error("fetchStudentFacultyRequests:", e); return []; }
};
export const fetchUnseenRequestCount = async (studentId) => {
  try { const r = await API.get(`/faculty-requests/unseen-count/${studentId}`); return r.data.count; }
  catch (e) { console.error("fetchUnseenRequestCount:", e); return 0; }
};
export const markRequestsAsSeen = async (studentId) => {
  try { const r = await API.put(`/faculty-requests/mark-seen/${studentId}`); return r.data; }
  catch (e) { console.error("markRequestsAsSeen:", e); }
};
export const respondToFacultyRequest = async (requestId, action, options = {}) => {
  try {
    const r = await API.put(`/faculty-requests/${requestId}/respond`, {
      action,
      rejectionReason:    options.rejectionReason    || '',
      resultingBookingId: options.resultingBookingId || null,
    });
    return r.data;
  } catch (e) { console.error("respondToFacultyRequest:", e); throw e; }
};
export const searchStudents = async (query) => {
  try { const r = await API.get(`/faculty-requests/search-students?q=${encodeURIComponent(query)}`); return r.data; }
  catch (e) { console.error("searchStudents:", e); return []; }
};
export default API;