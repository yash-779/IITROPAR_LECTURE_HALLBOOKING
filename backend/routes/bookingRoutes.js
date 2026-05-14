const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBookingStatus,
  getBookingsByFaculty,
  getBookingsByRequester,
  getBookingsByDate,
  getBookingsByVenueDate,
  getBookingsForStudent
} = require('../controllers/bookingController');
router.get('/test', (req, res) => res.send("Hello Test"));
router.get('/faculty/:facultyId',        getBookingsByFaculty);
router.get('/requester/:userId',         getBookingsByRequester);
router.get('/for-student/:studentId',    getBookingsForStudent);
router.get('/date/:date',                getBookingsByDate);
router.get('/venue/:venueId/date/:date', getBookingsByVenueDate);
router.post('/',         createBooking);
router.get('/',          getBookings);
router.put('/:id/status', updateBookingStatus);
module.exports = router;