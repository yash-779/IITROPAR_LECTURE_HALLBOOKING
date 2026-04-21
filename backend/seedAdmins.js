require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust this path if your model is elsewhere

const seedAdminUsers = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 Connected to MongoDB for seeding...");

    // 2. Define your hardcoded admin users
    // Note: We set isApproved: true so they bypass the manual approval workflow
    const adminUsers = [
      {
        name: "JR Assistant Admin",
        email: "jrassistant@iitrpr.ac.in",
        password: "Password123!", 
        role: "jr_assistant",
        isApproved: true, 
      },
      {
        name: "Superintendent Admin",
        email: "superintendent@iitrpr.ac.in",
        password: "Password123!",
        role: "superintendent",
        isApproved: true,
      },
      {
        name: "Assistant Registrar",
        email: "ar@iitrpr.ac.in",
        password: "Password123!",
        role: "ar",
        isApproved: true,
      }
    ];

    // 3. Loop through and create them
    for (const admin of adminUsers) {
      // Check if user already exists to prevent duplicates
      const existingUser = await User.findOne({ email: admin.email });
      if (existingUser) {
        console.log(`🟡 User ${admin.email} already exists. Skipping.`);
        continue;
      }

      // Hash the password securely
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.password, salt);

      // Create the user in the database
      await User.create({
        ...admin,
        password: hashedPassword,
      });

      console.log(`✅ Successfully created: ${admin.role} (${admin.email})`);
    }

    console.log("🎉 Seeding complete!");
    process.exit(); // Close the script cleanly

  } catch (error) {
    console.error("🚨 Error seeding database:", error);
    process.exit(1);
  }
};

seedAdminUsers();