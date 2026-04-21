const express = require('express');
const router = express.Router();
const { registerUser, loginUser, approveFaculty, updateUserCourses } = require('../controllers/authController');
// @route   POST /api/auth/register
// @desc    Register a student (auto-approved) or faculty (pending approval)
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Login for all users (checks if approved first)
router.post('/login', loginUser);

// @route   GET /api/auth/approve-faculty/:id
// @desc    The magic link Yash clicks in his email to approve faculty
router.get('/approve-faculty/:id', approveFaculty);
router.put('/update-courses', updateUserCourses);

module.exports = router;