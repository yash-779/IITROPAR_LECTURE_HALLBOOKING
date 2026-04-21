const Booking = require('../models/Booking');
const User = require('../models/User');
// Make sure you have the courseData.js file in your backend/data folder from Phase 1!
const courseData = require('../data/courseData'); 

// @desc    Create new room booking request
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { 
      requester, clubName, activityType, activityOther, 
      audienceCount, purpose, priorities, facultyEmail, 
      targetCourse, targetDepartments 
    } = req.body;

    // ==========================================
    // 1. FACULTY LOOKUP (POINT 6)
    // ==========================================
    const facultyUser = await User.findOne({ email: facultyEmail, role: 'faculty' });
    if (!facultyUser) {
      return res.status(404).json({ 
        message: `No registered faculty member found with the email: ${facultyEmail}. Please check the spelling.` 
      });
    }

    // ==========================================
    // 2. VENUE CONFLICT CHECK (POINT 3)
    // ==========================================
    for (let priority of priorities) {
      const existingVenueBooking = await Booking.findOne({
        'priorities.venueId': priority.venueId,
        'priorities.date': priority.date,
        status: { $ne: 'Rejected' }, // Ignore rejected bookings
        $or: [
          // Logic: Does the new request overlap with an existing time slot?
          { 'priorities.startTime': { $lt: priority.endTime }, 'priorities.endTime': { $gt: priority.startTime } }
        ]
      });

      if (existingVenueBooking) {
        return res.status(400).json({ 
          message: `Venue Conflict: ${priority.venueName} is already booked on ${priority.date} during this time.` 
        });
      }
    }

    // ==========================================
    // 3. STUDENT PERSONAL SCHEDULE CONFLICT CHECK (POINT 3)
    // ==========================================
    const student = await User.findById(requester);
    if (student && student.enrolledCourses && student.enrolledCourses.length > 0) {
      for (let priority of priorities) {
        const reqDate = new Date(priority.date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const reqDay = days[reqDate.getDay()]; // Gets 'Monday', 'Tuesday', etc.

        for (let courseCode of student.enrolledCourses) {
          // Find the course in our master data array
          const courseEntries = courseData.filter(c => c.code === courseCode);
          
          for (let entry of courseEntries) {
            for (let schedule of entry.schedule) {
              if (schedule.day === reqDay) {
                // Time format in courseData is "HH:MM - HH:MM"
                const [classStart, classEnd] = schedule.time.split(' - ').map(t => t.trim());
                
                // If there is a time overlap with their own class
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

    // ==========================================
    // 4. SAVE THE BOOKING
    // ==========================================
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

// @desc    Get bookings (can filter by role/status)
// @route   GET /api/bookings
const getBookings = async (req, res) => {
  try {
    // We use .populate() here to automatically grab the requester and faculty names!
    const bookings = await Booking.find()
      .populate('requester', 'name entryNo email department')
      .populate('facultyInCharge', 'name email');
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error("CRASH IN GET BOOKINGS:", error.message); 
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking tracker status (The Workflow Engine)
// @route   PUT /api/bookings/:id/status
const updateBookingStatus = async (req, res) => {
  try {
    const { stage, action, comment, allocatedSlot, proposedChanges, facultyCommentScope, resubmittedPriority } = req.body;  

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Ensure tracker and comments exist
    if (!booking.tracker) {
      booking.tracker = { faculty: 'pending', jrAssistant: 'pending', superintendent: 'pending', ar: 'pending' };
    }
    if (!booking.comments) {
      booking.comments = {};
    }

    // Update the specific tracker stage
    booking.tracker[stage] = action;

    // Save comments configuration if provided
    if (comment) {
      booking.comments[`${stage}Comment`] = comment;
    }
    if (stage === 'faculty' && facultyCommentScope) {
      booking.comments.facultyCommentScope = facultyCommentScope;
    }

    // Save proposed changes if requested
    if (stage === 'faculty' && action === 'changes_requested' && proposedChanges) {
      booking.proposedChanges = proposedChanges;
    }

    // Student Resubmission Flow
    if (stage === 'faculty' && action === 'pending' && resubmittedPriority) {
       // Check if there are proposed changes - if yes, this is an auto-approval scenario
       const isFromProposedChanges = booking.proposedChanges && booking.proposedChanges.length > 0;
       
       // update the active priority (defaulting to 0) with their new choice
       if (booking.priorities && booking.priorities.length > 0) {
         booking.priorities[0].date = resubmittedPriority.date;
         booking.priorities[0].startTime = resubmittedPriority.startTime;
         booking.priorities[0].endTime = resubmittedPriority.endTime;
       }
       
       booking.proposedChanges = []; // clear the proposed changes
       
       // AUTO-APPROVE: If student selected from faculty's proposed options, auto-approve the faculty stage
       if (isFromProposedChanges) {
         booking.tracker.faculty = 'approved';
         booking.status = 'Pending'; // Moves to next stage (jrAssistant)
       } else {
         booking.status = 'Pending'; // Goes back to pending
       }
    }

    // If JR assistant approves, they must provide the final allocated slot
    if (stage === 'jrAssistant' && action === 'approved' && allocatedSlot) {
       booking.allocatedSlot = allocatedSlot;
    }

    // --- WORKFLOW LOGIC ---
    if (action === 'rejected') {
      booking.status = 'Rejected';
    } else if (action === 'changes_requested') {
      booking.status = 'Action Required';
    } else if (action === 'approved') {
      // Check if this was the final stage
      if (stage === 'ar') {
        booking.status = 'Approved';
        
        // Generate Unique QR ID based on timestamp and booking ID
        const timeStamp = Date.now();
        booking.qrId = `ARAUTH-${booking._id}-${timeStamp}`;
        
        // Create a hashed version to simulate the QR Data or Signature
        const crypto = require('crypto');
        booking.qrCode = crypto.createHash('sha256').update(booking.qrId).digest('hex');
      }
    } else if (action === 'pending' && stage === 'faculty') {
      booking.status = 'Pending';
    }

    const updatedBooking = await booking.save();
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get bookings where I am the faculty in-charge
// @route GET /api/bookings/faculty/:facultyId
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

// @desc  Get bookings submitted by a specific user (student or faculty)
// @route GET /api/bookings/requester/:userId
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

// @desc  Get all bookings (approved or pending) for a specific date — for campus schedule
// @route GET /api/bookings/date/:date
const getBookingsByDate = async (req, res) => {
  try {
    const date = req.params.date; // expects YYYY-MM-DD
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

// @desc  Get all events on a specific venue + date — for room calendar timeline
// @route GET /api/bookings/venue/:venueId/date/:date
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

// @desc  Get bookings visible to a specific student (based on course or department)
// @route GET /api/bookings/for-student/:studentId
const getBookingsForStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: "Student not found" });
    }

    // Extract department from email (e.g., "2023csb1157@iitrpr.ac.in" -> "CSB")
    const extractDept = (email) => {
      if (!email) return null;
      const match = email.match(/\d{4}([a-z]{3})/i);
      return match ? match[1].toUpperCase() : null;
    };
    const studentDept = extractDept(student.email);
    const enrolledCourses = student.enrolledCourses || [];

    // Build the query conditions
    const queryConditions = {
      status: { $in: ['Approved', 'Pending', 'Action Required'] },
      $or: [
        // Bookings for courses the student is enrolled in
        { 
          targetCourse: { $in: enrolledCourses }
        },
        // Bookings for the student's department (only if department extracted successfully)
        ...(studentDept ? [{ targetDepartments: studentDept }] : [])
      ]
    };

    // Query: Bookings that match either by course OR by department
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