const mongoose = require('mongoose');
const venueSchema = new mongoose.Schema({
  venueId: { type: String, required: true, unique: true }, 
  title: { type: String, required: true },
  capacity: { type: Number, required: true },
  type: { type: String }, 
  block: { type: String }
});
module.exports = mongoose.model('Venue', venueSchema);