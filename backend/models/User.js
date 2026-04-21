const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'faculty', 'jr_assistant', 'superintendent', 'ar'], 
    required: true 
  },
  // --- STUDENT FIELDS ---
  entryNo: { type: String }, 
  department: { type: String },
  enrolledCourses: { 
    type: [String], 
    validate: [arrayLimit, '{PATH} exceeds the limit of 8'] 
  },
  // --- FACULTY FIELDS ---
  phoneNumber: { type: String },
  facultyRole: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Adjunct Faculty']
  },

  // --- SECURITY / WORKFLOW ---
  isApproved: { 
    type: Boolean, 
    default: true // Students get auto-approved, Faculty start as false
  }
}, { timestamps: true });
function arrayLimit(val) {
  return val.length <= 8;
}

module.exports = mongoose.model('User', userSchema);