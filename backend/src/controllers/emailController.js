import {
  createScheduledEmail,
  getEmailsByUser,
  getEmailById as fetchEmailById,
  cancelScheduledEmail,
  getUserDashboardStats,
} from '../services/emailService.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export async function scheduleEmail(req, res, next) {
  try {
    const { recipient, subject, body, scheduledAt } = req.body;
    const userId = req.user._id;

    const email = await createScheduledEmail({
      userId,
      recipient,
      subject,
      body,
      scheduledAt,
    });

    return successResponse(res, email, 'Email scheduled successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getEmails(req, res, next) {
  try {
    const userId = req.user._id;
    const { status, page, limit, search } = req.query;

    const result = await getEmailsByUser({
      userId,
      status,
      page,
      limit,
      search,
    });

    return paginatedResponse(res, result, 'Emails retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getEmailDetails(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const email = await fetchEmailById({ userId, emailId: id });
    return successResponse(res, email, 'Email details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function cancelEmail(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const email = await cancelScheduledEmail({ userId, emailId: id });
    return successResponse(res, email, 'Scheduled email cancelled successfully');
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user._id;
    const stats = await getUserDashboardStats({ userId });
    return successResponse(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
}
