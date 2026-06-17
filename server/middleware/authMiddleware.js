const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT and attach authenticated user to request
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header for Bearer token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and attach to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found matching this token.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`JWT Auth Error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Token verification failed. Not authorized.',
    });
  }
};

// Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not authorized to access this resource.`,
      });
    }
    next();
  };
};

// Middleware to verify if an Agent user is approved by Admin
const checkApproved = (req, res, next) => {
  if (req.user && req.user.role === 'Agent' && !req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Your agent account is currently awaiting admin approval.',
    });
  }
  next();
};

module.exports = {
  protect,
  restrictTo,
  checkApproved,
};
