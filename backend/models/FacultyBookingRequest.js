const mongoose = require('mongoose');
const facultyBookingRequestSchema = new mongoose.Schema({
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clubName: { type: String, required: true },
  activityType: { type: String, required: true },
  activityOther: { type: String },
  purpose: { type: String, required: true },
  audienceCount: { type: Number, required: true, default: 2 },
  venueId: { type: String, required: true },
  venueName: { type: String },
  date: { type: String, required: true },
  status: { type: String, enum: ['pending', 'booked', 'rejected'], default: 'pending' },
  resultingBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  message: { type: String },
  rejectionReason: { type: String },
  seenByStudent: { type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('FacultyBookingRequest', facultyBookingRequestSchema);
