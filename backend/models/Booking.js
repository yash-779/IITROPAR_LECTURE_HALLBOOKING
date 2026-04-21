const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clubName: { type: String, required: true },
  activityType: { type: String, required: true },
  
  // --- NEW DYNAMIC FIELDS ---
  activityOther: { type: String },
  targetCourse: { type: String, default: null },
  targetDepartments: { type: [String], default: [] },
  
  audienceCount: { type: Number, required: true },
  purpose: { type: String },

  // --- CHANGES PROPOSED BY FACULTY ---
  proposedChanges: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  
  // Handling the multiple priorities array from your BookRoom.jsx
  priorities: [{
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venueId: { type: String, required: true },
    venueName: { type: String }
  }],
  
  // The final allocated slot (decided by JR Assistant)
  allocatedSlot: {
    date: String,
    startTime: String,
    endTime: String,
    venueId: String,
    venueName: String
  },

  facultyInCharge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Overall Status
  status: { 
    type: String, 
    enum: ['Pending', 'Action Required', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },

  // The State-Machine Tracker
  tracker: {
    faculty: { type: String, enum: ['pending', 'approved', 'changes_requested', 'rejected'], default: 'pending' },
    jrAssistant: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    superintendent: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    ar : { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },

  comments: {
    facultyComment: String,
    facultyCommentScope: { type: [String], default: [] }, // e.g. ["Student", "JrAssistant"]
    jrAssistantComment: String,
    execComment: String
  },

  // --- GENERATED IDENTIFIERS ---
  qrId: { type: String, default: null },
  qrCode: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);