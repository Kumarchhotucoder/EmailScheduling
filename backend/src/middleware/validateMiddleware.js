import { errorResponse } from '../utils/response.js';

export function validateRegister(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

export function validateScheduleEmail(req, res, next) {
  const { recipient, subject, body, scheduledAt } = req.body;
  const errors = [];

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!recipient || !emailRegex.test(recipient)) {
    errors.push('A valid recipient email address is required');
  }

  if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
    errors.push('Subject cannot be empty');
  } else if (subject.trim().length > 200) {
    errors.push('Subject cannot exceed 200 characters');
  }

  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    errors.push('Email message body cannot be empty');
  }

  if (!scheduledAt) {
    errors.push('Scheduled time (scheduledAt) is required');
  } else {
    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      errors.push('Scheduled time must be a valid date/time format');
    } else {
      const now = new Date();
      // Allow a 5-second grace window for slight network transmission latency
      if (scheduledDate.getTime() <= now.getTime() - 5000) {
        errors.push('Scheduled time must be in the future');
      }
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  req.body.recipient = recipient.trim().toLowerCase();
  req.body.subject = subject.trim();
  req.body.body = body.trim();
  req.body.scheduledAt = new Date(scheduledAt);
  next();
}
