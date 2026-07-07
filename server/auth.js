import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserById } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'resumecraft-ai-super-secret-key-123456';

// Hash password
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' }); // Keep logged in for 30 days
};

// Auth middleware for Express routes
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    // Retrieve user details
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User associated with this token not found.' });
    }

    // Attach user information to request context
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Authentication token has expired. Please log in again.' });
    }
    return res.status(500).json({ error: 'Internal server error checking credentials.' });
  }
};
