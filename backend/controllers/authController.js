const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');



const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_super_secret_key', { expiresIn: '30d' });
};

// @desc    Register a new user with Strict Constraints
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, facultyRole, department } = req.body;

    // 1. BLOCK ADMIN REGISTRATIONS
    if (['jr_assistant', 'superintendent', 'ar'].includes(role)) {
      return res.status(403).json({ message: "Admin accounts cannot be registered publicly. Contact IT." });
    }

    // 2. CHECK IF USER EXISTS (MongoDB also checks, but this gives a cleaner error)
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email is already registered.' });

    let isApproved = true; // Default
    let entryNo = null;

    // 3. STRICT STUDENT VALIDATION
    if (role === 'student') {
      // Regex: Year (2022-2026) + Dept Code + Roll Digits + @iitrpr.ac.in
      const studentEmailRegex = /^(2022|2023|2024|2025|2026)(csb|eeb|chb|mmb|ceb|mab|meb|phb|aib)\d+@iitrpr\.ac\.in$/i;
      
      if (!studentEmailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid Student Email. Must be from batch 2022-2026 with valid program code." });
      }
      // Extract entry number from the email (e.g., "2024csb1034" from "2024csb1034@iitrpr.ac.in")
      entryNo = email.split('@')[0].toUpperCase();
    }

    // 4. STRICT FACULTY VALIDATION
    if (role === 'faculty') {
      if (!email.endsWith('@iitrpr.ac.in')) {
        return res.status(400).json({ message: "Faculty email must end with @iitrpr.ac.in" });
      }
      if (!phoneNumber || !facultyRole || !department) {
        return res.status(400).json({ message: "Phone number, Faculty Role, and Department are required." });
      }
      isApproved = false; // Requires Yash's approval
    }

    // 5. HASH PASSWORD & CREATE USER
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name, email, password: hashedPassword, role, department, entryNo, phoneNumber, facultyRole, isApproved
    });

    // 6. FACULTY WORKFLOW: Email Yash for approval
    if (role === 'faculty') {
      // --- NODEMAILER SETUP ---
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // MAKE SURE IT IS EXACTLY HERE (inside the main curly braces, with a comma above it)
  tls: {
    rejectUnauthorized: false 
  }
});
      const approvalLink = `http://localhost:5000/api/auth/approve-faculty/${user._id}`;
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'yashbalacvr@gmail.com', // Sent to Yash
        subject: `ACTION REQUIRED: New Faculty Registration - ${name}`,
        html: `
          <h3>New Faculty Account Pending Approval</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Role:</strong> ${facultyRole}</p>
          <p><strong>Department:</strong> ${department}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phoneNumber}</p>
          <br/>
          <a href="${approvalLink}" style="padding:10px 20px; background:green; color:white; text-decoration:none; border-radius:5px;">Approve Faculty Account</a>
        `
      });

      return res.status(201).json({ 
        message: "Registration received! Your account is pending admin approval. You will receive an email once approved." 
      });
    }

    // 7. STUDENT WORKFLOW: Immediate Login
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrolledCourses: user.enrolledCourses || [],
      token: generateToken(user._id, user.role),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update a user's enrolled courses
// @route   PUT /api/auth/update-courses
const updateUserCourses = async (req, res) => {
  try {
    const { userId, courses } = req.body;
    if (!Array.isArray(courses)) {
      return res.status(400).json({ message: "Invalid courses payload." });
    }

    // Strict validation
    if (courses.length > 8) {
      return res.status(400).json({ message: "Maximum 8 courses allowed." });
    }

    const user = await User.findByIdAndUpdate(userId, { enrolledCourses: courses }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user.enrolledCourses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update your exports at the bottom:


// @desc    Approve Faculty Account (Triggered by Yash's email click)
// @route   GET /api/auth/approve-faculty/:id
const approveFaculty = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found.");

    user.isApproved = true;
    await user.save();

    // Send confirmation to the faculty
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Account Approved: Welcome to IITR HallSync!`,
      html: `<h3>Welcome ${user.name}!</h3><p>Your faculty account has been approved. You can now login to the portal.</p>`
    });

    res.send("<h1>Faculty Account Successfully Approved!</h1><p>An email has been sent to the faculty member.</p>");
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

// @desc    Authenticate/Login a user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // CHECK IF APPROVED
      if (!user.isApproved) {
        return res.status(403).json({ message: "Your account is still pending admin approval." });
      }

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrolledCourses: user.enrolledCourses || [],
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, approveFaculty, updateUserCourses };