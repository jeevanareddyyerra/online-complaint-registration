const jwt = require('jsonwebtoken');

/**
 * Generates a signed JSON Web Token (JWT) for a user
 * @param {string} id - The MongoDB ObjectId of the user
 * @returns {string} - The signed JWT string
 */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing from environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
