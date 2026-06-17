const path = require('path');
const mongoose = require('mongoose');
const connectToDB = require('../config/db');
const User = require('../models/User');

// Load environment variables from parent directory .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const resetPassword = async () => {
  try {
    // Establish DB connection
    await connectToDB();

    const email = 'jeevana@test.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found.`);
      process.exit(1);
    }

    // Set new password (this will trigger userSchema pre-save hook for bcrypt hashing)
    user.password = '123456';
    await user.save();

    console.log(`Success: Password for ${email} has been reset to '123456'`);
    process.exit(0);
  } catch (error) {
    console.error('Error during password reset:', error);
    process.exit(1);
  }
};

resetPassword();
