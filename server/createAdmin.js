require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log("Updated existing user admin@example.com to admin role.");
      } else {
        console.log("Admin account already exists!");
      }
    } else {
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: 'AdminPassword123!',
        phone: '9999999999',
        role: 'admin',
        isEmailVerified: true
      });
      console.log("Admin account created successfully!");
    }
    
    console.log("\nYou can now login at /login with:");
    console.log("Email: admin@example.com");
    console.log("Password: AdminPassword123!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
