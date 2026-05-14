const Booking = require('../models/Booking');
const User = require('../models/User');
const courseData = require('../data/courseData'); 
const createBooking = async (req, res) => {
  try {
    const { 
      requester, clubName, activityType, activityOther, 
      audienceCount, purpose, priorities, facultyEmail, 
      targetCourse, targetDepartments 
    } = req.body;
    const facultyUser = await User.findOne({ email: facultyEmail, role: 'faculty' });
    if (!facultyUser) {
      return res.status(404).json({ 
        message: `No registered faculty member found with the email: ${facultyEmail}. Please check the spelling.` 
      });
    }
    for (let priority of priorities) {
      const existingVenueBooking = await Booking.findOne({
        'priorities.venueId': priority.venueId,
        'priorities.date': priority.date,
        status: { $ne: 'Rejected' }, 
        $or: [
          { 'priorities.startTime': { $lt: priority.endTime }, 'priorities.endTime': { $gt: priority.startTime } }
        ]
      });
      if (existingVenueBooking) {
        return res.status(400).json({ 
          message: `Venue Conflict: ${priority.venueName} is already booked on ${priority.date} during this time.` 
        });
      }
    }
    const student = await User.findById(requester);
    if (student && student.enrolledCourses && student.enrolledCourses.length > 0) {
      for (let priority of priorities) {
        const reqDate = new Date(priority.date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const reqDay = days[reqDate.getDay()]; 
        for (let courseCode of student.enrolledCourses) {
          const courseEntries = courseData.filter(c => c.code === courseCode);
          for (let entry of courseEntries) {
            for (let schedule of entry.schedule) {
              if (schedule.day === reqDay) {
                const [classStart, classEnd] = schedule.time.split(' - ').map(t => t.trim());
                if (priority.startTime < classEnd && priority.endTime > classStart) {
                  return res.status(400).json({ 
                    message: `Schedule Conflict: You have a class for ${courseCode} showing at this time on ${reqDay}. You cannot book a room during your own class.` 
                  });
                }
              }
            }
          }
        }
      }
    }
    const booking = new Booking({
      requester,
      clubName,
      activityType,
      activityOther,
      audienceCount,
      purpose,
      priorities,
      facultyInCharge: facultyUser._id,
      targetCourse,
      targetDepartments,
      status: 'Pending',
      tracker: {
        faculty: 'pending',
        jrAssistant: 'pending',
        superintendent: 'pending',
        ar: 'pending'
      }
    });
    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error("Booking Creation Error:", error);
    res.status(500).json({ message: "An internal server error occurred while processing your booking." });
  }
};
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('requester', 'name entryNo email department')
      .populate('facultyInCharge', 'name email');
    res.status(200).json(bookings);
  } catch (error) {
    console.error("CRASH IN GET BOOKINGS:", error.message); 
    res.status(500).json({ message: error.message });
  }
};
const updateBookingStatus = async (req, res) => {
  try {
    const { stage, action, comment, allocatedSlot, proposedChanges, facultyCommentScope, resubmittedPriority } = req.body;  
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!booking.tracker) {
      booking.tracker = { faculty: 'pending', jrAssistant: 'pending', superintendent: 'pending', ar: 'pending' };
    }
    if (!booking.comments) {
      booking.comments = {};
    }
    booking.tracker[stage] = action;
    if (comment) {
      booking.comments[`${stage}Comment`] = comment;
    }
    if (stage === 'faculty' && facultyCommentScope) {
      booking.comments.facultyCommentScope = facultyCommentScope;
    }
    if (stage === 'faculty' && action === 'changes_requested' && proposedChanges) {
      booking.proposedChanges = proposedChanges;
    }
    if (stage === 'faculty' && action === 'pending' && resubmittedPriority) {
       const isFromProposedChanges = booking.proposedChanges && booking.proposedChanges.length > 0;
       if (booking.priorities && booking.priorities.length > 0) {
         booking.priorities[0].date = resubmittedPriority.date;
         booking.priorities[0].startTime = resubmittedPriority.startTime;
         booking.priorities[0].endTime = resubmittedPriority.endTime;
       }
       booking.proposedChanges = []; 
       if (isFromProposedChanges) {
         booking.tracker.faculty = 'approved';
         booking.status = 'Pending'; 
       } else {
         booking.status = 'Pending'; 
       }
    }
    if (stage === 'jrAssistant' && action === 'approved' && allocatedSlot) {
       booking.allocatedSlot = allocatedSlot;
    }
    if (action === 'rejected') {
      booking.status = 'Rejected';
    } else if (action === 'changes_requested') {
      booking.status = 'Action Required';
    } else if (action === 'approved') {
      if (stage === 'ar') {
        booking.status = 'Approved';
        const timeStamp = Date.now();
        booking.qrId = `ARAUTH-${booking._id}-${timeStamp}`;
        const crypto = require('crypto');
        booking.qrCode = crypto.createHash('sha256').update(booking.qrId).digest('hex');
      }
    } else if (action === 'pending' && stage === 'faculty') {
      booking.status = 'Pending';
    }
    await booking.save();
    const updatedBooking = await Booking.findById(booking._id)
      .populate('requester', 'name entryNo email department phoneNumber')
      .populate('facultyInCharge', 'name email');
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getBookingsByFaculty = async (req, res) => {
  try {
    const bookings = await Booking.find({ facultyInCharge: req.params.facultyId })
      .populate('requester', 'name entryNo email department')
      .populate('facultyInCharge', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getBookingsByRequester = async (req, res) => {
  try {
    const bookings = await Booking.find({ requester: req.params.userId })
      .populate('requester', 'name entryNo email department')
      .populate('facultyInCharge', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getBookingsByDate = async (req, res) => {
  try {
    const date = req.params.date; 
    const bookings = await Booking.find({
      status: { $in: ['Approved', 'Pending', 'Action Required'] },
      $or: [
        { 'allocatedSlot.date': date },
        { 'priorities.date': date }
      ]
    })
      .populate('requester', 'name entryNo')
      .populate('facultyInCharge', 'name')
      .sort({ 'allocatedSlot.startTime': 1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getBookingsByVenueDate = async (req, res) => {
  try {
    const { venueId, date } = req.params;
    const bookings = await Booking.find({
      status: { $ne: 'Rejected' },
      $or: [
        { 'allocatedSlot.venueId': venueId, 'allocatedSlot.date': date },
        { 'priorities.venueId': venueId, 'priorities.date': date }
      ]
    })
      .populate('requester', 'name')
      .populate('facultyInCharge', 'name')
      .sort({ 'allocatedSlot.startTime': 1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getBookingsForStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    const extractDept = (email) => {
      if (!email) return null;
      const match = email.match(/(csb|eeb|cyb|ceb|meb|mcb|mmb|phb)/i);
      return match ? match[1].toUpperCase() : null;
    };
    const studentDept = student ? extractDept(student.email) : null;
    const enrolledCourses = student ? (student.enrolledCourses || []) : [];
    const queryConditions = {
      status: { $in: ['Approved', 'Pending', 'Action Required'] },
      $or: [
        { requester: req.params.studentId },
        ...(enrolledCourses.length > 0 ? [{ targetCourse: { $in: enrolledCourses } }] : []),
        ...(studentDept ? [{ targetDepartments: { $in: [studentDept] } }] : [])
      ]
    };
    const bookings = await Booking.find(queryConditions)
      .populate('requester', 'name entryNo email')
      .populate('facultyInCharge', 'name email')
      .sort({ 'allocatedSlot.date': 1, 'allocatedSlot.startTime': 1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get Bookings For Student Error:", error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = { createBooking, getBookings, updateBookingStatus, getBookingsByFaculty, getBookingsByRequester, getBookingsByDate, getBookingsByVenueDate, getBookingsForStudent };