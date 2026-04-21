const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  venueId: { type: String, required: true, unique: true }, // e.g., 'm1', 'audi'
  title: { type: String, required: true },
  capacity: { type: Number, required: true },
  type: { type: String }, // Classroom, Seminar Hall, etc.
  block: { type: String }
});

module.exports = mongoose.model('Venue', venueSchema);