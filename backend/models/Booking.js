const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clubName: { type: String, required: true },
  activityType: { type: String, required: true },
  activityOther: { type: String },
  targetCourse: { type: String, default: null },
  targetDepartments: { type: [String], default: [] },
  audienceCount: { type: Number, required: true },
  purpose: { type: String },
  proposedChanges: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  priorities: [{
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venueId: { type: String, required: true },
    venueName: { type: String }
  }],
  allocatedSlot: {
    date: String,
    startTime: String,
    endTime: String,
    venueId: String,
    venueName: String
  },
  facultyInCharge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['Pending', 'Action Required', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  tracker: {
    faculty: { type: String, enum: ['pending', 'approved', 'changes_requested', 'rejected'], default: 'pending' },
    jrAssistant: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    superintendent: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    ar : { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  comments: {
    facultyComment: String,
    facultyCommentScope: { type: [String], default: [] }, 
    jrAssistantComment: String,
    execComment: String
  },
  qrId: { type: String, default: null },
  qrCode: { type: String, default: null }
}, { timestamps: true });
module.exports = mongoose.model('Booking', bookingSchema);