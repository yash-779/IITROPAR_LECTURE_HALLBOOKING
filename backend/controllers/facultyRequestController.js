const FacultyBookingRequest = require('../models/FacultyBookingRequest');
const User = require('../models/User');
const Booking = require('../models/Booking');
const createFacultyRequest = async (req, res) => {
  try {
    const { facultyId, studentId, clubName, activityType, activityOther, purpose, audienceCount, venueId, venueName, date, message } = req.body;
    if (!facultyId || !studentId || !clubName || !activityType || !purpose || !venueId || !date)
      return res.status(400).json({ message: 'Missing required fields' });
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') return res.status(403).json({ message: 'Only faculty can create booking requests' });
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Target student not found' });
    const request = await FacultyBookingRequest.create({
      faculty: facultyId, student: studentId, clubName, activityType,
      activityOther: activityOther || '', purpose, audienceCount: audienceCount || 2,
      venueId, venueName: venueName || venueId, date, message: message || '',
      status: 'pending', seenByStudent: false
    });
    const populated = await FacultyBookingRequest.findById(request._id)
      .populate('faculty', 'name email facultyRole')
      .populate('student', 'name email entryNo');
    res.status(201).json(populated);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const getRequestsByFaculty = async (req, res) => {
  try {
    const requests = await FacultyBookingRequest.find({ faculty: req.params.facultyId })
      .populate('faculty', 'name email facultyRole')
      .populate('student', 'name email entryNo department')
      .populate('resultingBooking', '_id status')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const getRequestsForStudent = async (req, res) => {
  try {
    const requests = await FacultyBookingRequest.find({ student: req.params.studentId })
      .populate('faculty', 'name email facultyRole phoneNumber')
      .populate('student', 'name email entryNo')
      .populate('resultingBooking', '_id status')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const getUnseenCount = async (req, res) => {
  try {
    const count = await FacultyBookingRequest.countDocuments({ student: req.params.studentId, status: 'pending', seenByStudent: false });
    res.status(200).json({ count });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const markAllSeen = async (req, res) => {
  try {
    await FacultyBookingRequest.updateMany({ student: req.params.studentId, seenByStudent: false }, { '$set': { seenByStudent: true } });
    res.status(200).json({ message: 'Marked as seen' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const respondToRequest = async (req, res) => {
  try {
    const { action, rejectionReason, resultingBookingId } = req.body;
    if (!['rejected', 'booked'].includes(action)) return res.status(400).json({ message: 'action must be rejected or booked' });
    const request = await FacultyBookingRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already responded to' });
    request.status = action;
    request.seenByStudent = true;
    if (action === 'rejected' && rejectionReason) request.rejectionReason = rejectionReason;
    if (action === 'booked' && resultingBookingId) request.resultingBooking = resultingBookingId;
    const updated = await request.save();
    const populated = await FacultyBookingRequest.findById(updated._id)
      .populate('faculty', 'name email facultyRole')
      .populate('student', 'name email entryNo')
      .populate('resultingBooking', '_id status');
    res.status(200).json(populated);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
const searchStudents = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.status(200).json([]);
    const regex = new RegExp(q, 'i');
    const students = await User.find({ role: 'student', '$or': [{ name: regex }, { entryNo: regex }, { email: regex }] }).select('name email entryNo department').limit(10);
    res.status(200).json(students);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
module.exports = { createFacultyRequest, getRequestsByFaculty, getRequestsForStudent, getUnseenCount, markAllSeen, respondToRequest, searchStudents };