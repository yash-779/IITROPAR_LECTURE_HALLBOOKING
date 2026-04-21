// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Your Node.js backend URL
});

// --- BOOKING ENDPOINTS ---

export const fetchAllBookings = async () => {
  try {
    const response = await API.get('/bookings');
    return response.data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
};

export const submitBookingRequest = async (bookingData) => {
  try {
    const response = await API.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    console.error("Error submitting booking:", error);
    throw error;
  }
};

// Bookings where this faculty is the in-charge (incoming approvals for the faculty)
export const fetchBookingsByFaculty = async (facultyId) => {
  try {
    const response = await API.get(`/bookings/faculty/${facultyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching faculty bookings:", error);
    return [];
  }
};

// Bookings submitted by a specific user (student's own bookings, or faculty's own requests)
export const fetchBookingsByRequester = async (userId) => {
  try {
    const response = await API.get(`/bookings/requester/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching requester bookings:", error);
    return [];
  }
};

export const updateUserCourses = async (userId, courses) => {
  try {
    const response = await API.put('/auth/update-courses', { userId, courses });
    return response.data;
  } catch (error) {
    console.error("Error updating user courses:", error);
    throw error;
  }
};

export const updateWorkflowStatus = async (bookingId, stage, action, comment = "", allocatedSlot = null, proposedChanges = null, facultyCommentScope = null, resubmittedPriority = null) => {
  try {
    const response = await API.put(`/bookings/${bookingId}/status`, {
      stage,
      action,
      comment,
      allocatedSlot,
      proposedChanges,
      facultyCommentScope,
      resubmittedPriority
    });
    return response.data;
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
};

export const submitFacultyDecision = async (bookingId, action, comment = '', proposedChanges = null, facultyCommentScope = null) => {
  return updateWorkflowStatus(bookingId, 'faculty', action, comment, null, proposedChanges, facultyCommentScope);
};

// Shorthand for student resubmitting their request with a new time slot
export const resubmitBooking = async (bookingId, resubmittedPriority) => {
  return updateWorkflowStatus(bookingId, 'faculty', 'pending', '', null, null, null, resubmittedPriority);
};

// Shorthand for JR decision (stage = 'jrAssistant')
export const submitJrDecision = async (bookingId, action, allocatedSlot = null, comment = '') => {
  if (action === 'approved') {
    return updateWorkflowStatus(bookingId, 'jrAssistant', action, '', allocatedSlot);
  }
  return updateWorkflowStatus(bookingId, 'jrAssistant', action, comment);
};

// Fetch bookings by date
export const fetchBookingsByDate = async (date) => {
  try {
    const response = await API.get(`/bookings/date/${date}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bookings by date:", error);
    return [];
  }
};

// Fetch bookings by venue and date
export const fetchBookingsByVenueDate = async (venueId, date) => {
  try {
    const response = await API.get(`/bookings/venue/${venueId}/date/${date}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bookings by venue and date:", error);
    return [];
  }
};

// Fetch bookings visible to a specific student (based on course or department)
export const fetchBookingsForStudent = async (studentId) => {
  try {
    const response = await API.get(`/bookings/for-student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bookings for student:", error);
    return [];
  }
};

export default API;