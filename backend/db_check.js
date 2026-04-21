require('dotenv').config();
const mongoose = require('mongoose');

if (!process.env.MONGO_URI) {
  console.error("No MONGO_URI found in .env");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const User = require('./models/User');
      const faculty = await User.findOne({ email: 'balwinder@iitrpr.ac.in' });
      console.log('--- Faculty Lookup ---');
      console.log(faculty ? `Found! ID: ${faculty._id}, email: ${faculty.email}` : 'Not Found');

      const Booking = require('./models/Booking');
      const bookings = await Booking.find({});
      console.log(`\n--- Total Bookings: ${bookings.length} ---`);
      
      bookings.forEach(b => {
        let facultyP = faculty ? faculty._id.toString() : '';
        let bFac = b.facultyInCharge ? b.facultyInCharge.toString() : '';
        let match = (facultyP === bFac && bFac !== '') ? 'YES' : 'NO';
        console.log(`ID: ${b._id} | req: ${b.requester} | FacID: ${bFac} (Matches Balwinder? ${match}) | tracker: ${JSON.stringify(b.tracker)}`);
      });
      
    } catch (e) {
      console.error('Error:', e);
    } finally {
      mongoose.connection.close();
    }
  });
