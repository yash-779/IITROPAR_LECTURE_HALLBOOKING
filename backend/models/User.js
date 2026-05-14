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
  entryNo: { type: String }, 
  department: { type: String },
  enrolledCourses: { 
    type: [String], 
    validate: [arrayLimit, '{PATH} exceeds the limit of 8'] 
  },
  phoneNumber: { type: String },
  facultyRole: {
    type: String,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Adjunct Faculty']
  },
  isApproved: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });
function arrayLimit(val) {
  return val.length <= 8;
}
module.exports = mongoose.model('User', userSchema);