import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { successResponse, errorResponse } from '../utils/response.js';

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'A user with this email address already exists', 409);
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user);

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      },
      'User registered successfully',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, 'Invalid email or password credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password credentials', 401);
    }

    const token = generateToken(user);

    return successResponse(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    return successResponse(
      res,
      {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          createdAt: req.user.createdAt,
        },
      },
      'Current user profile retrieved'
    );
  } catch (err) {
    next(err);
  }
}
