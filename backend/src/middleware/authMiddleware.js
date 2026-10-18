import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { errorResponse } from '../utils/response.js';

export async function protect(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'Authentication required. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(res, 'User not found or token has expired.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid token. Authorization denied.', 401);
  }
}
