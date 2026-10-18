import express from 'express';
import {
  scheduleEmail,
  getEmails,
  getEmailDetails,
  cancelEmail,
  getDashboardStats,
} from '../controllers/emailController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateScheduleEmail } from '../middleware/validateMiddleware.js';

const router = express.Router();

// All email routes require authentication
router.use(protect);

router.post('/schedule', validateScheduleEmail, scheduleEmail);
router.get('/', getEmails);
router.get('/stats', getDashboardStats);
router.get('/:id', getEmailDetails);
router.delete('/:id/cancel', cancelEmail);

export default router;
