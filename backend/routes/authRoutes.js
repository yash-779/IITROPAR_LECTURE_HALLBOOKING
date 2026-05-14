const express = require('express');
const router = express.Router();
const { registerUser, loginUser, approveFaculty, updateUserCourses } = require('../controllers/authController');
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/approve-faculty/:id', approveFaculty);
router.put('/update-courses', updateUserCourses);
module.exports = router;