const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user (Ordinary User or Agent)
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created through registration.',
      });
    }
    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and phone number.',
      });
    }

    // Check if user already exists
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email or phone number already exists.',
      });
    }

    // Create user (password hashing is handled in pre-save hook in User model)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'Ordinary',
    });

    if (user) {
      // If the registered user is an Agent, notify all Admin users
      if (user.role === 'Agent') {
        try {
          const { createNotification } = require('../utils/notificationHelper');
          const admins = await User.find({ role: 'Admin' });
          await Promise.all(
            admins.map((admin) =>
              createNotification({
                recipientId: admin._id,
                title: 'New Agent Registration',
                message: `${user.name} is awaiting approval.`,
                type: 'agent',
                relatedComplaintId: null,
              })
            )
          );
        } catch (notifError) {
          console.error('Error creating notifications for new agent registration:', notifError.message);
        }
      }

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isApproved: user.isApproved,
          },
          token,
        },
        message:
          user.role === 'Agent'
            ? 'Registration successful. Waiting for admin approval.'
            : 'Registration successful.',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data provided.',
      });
    }
  } catch (error) {
    console.error(`Register Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
};

// @desc    Authenticate user and get token
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Check for user
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password matches (using model instance method)
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isApproved: user.isApproved,
        },
        token,
      },
      message: 'Login successful.',
    });
  } catch (error) {
    console.error(`Login Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

// @desc    Get current logged in user details
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: { user },
      message: 'User profile retrieved successfully.',
    });
  } catch (error) {
    console.error(`GetMe Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile.',
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { role: 'Ordinary' };

    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    const items = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        items,
        currentPage: page,
        totalPages,
        totalItems,
      },
      message: 'Users list retrieved successfully.',
    });
  } catch (error) {
    console.error(`GetAllUsers Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users list.',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
};
