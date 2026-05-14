const express = require('express');
const router = express.Router();
const {
  createFacultyRequest,
  getRequestsByFaculty,
  getRequestsForStudent,
  getUnseenCount,
  markAllSeen,
  respondToRequest,
  searchStudents
} = require('../controllers/facultyRequestController');
router.get('/search-students', searchStudents);
router.post('/', createFacultyRequest);
router.get('/by-faculty/:facultyId', getRequestsByFaculty);
router.get('/for-student/:studentId', getRequestsForStudent);
router.get('/unseen-count/:studentId', getUnseenCount);
router.put('/mark-seen/:studentId', markAllSeen);
router.put('/:id/respond', respondToRequest);
module.exports = router;
