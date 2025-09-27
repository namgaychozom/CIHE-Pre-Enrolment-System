// routes/day.routes.js

import express from 'express';
import DayController from '../controllers/day.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

// Public routes (accessible by authenticated students and admins)
router.get('/', authMiddleware, DayController.getAllDays);
router.get('/weekdays', authMiddleware, DayController.getWeekDays);
router.get('/weekends', authMiddleware, DayController.getWeekendDays);
router.get('/with-availabilities', authMiddleware, DayController.getDaysWithAvailabilities);
router.get('/:id', authMiddleware, DayController.getDayById);
router.get('/name/:name', authMiddleware, DayController.getDayByName);

// Admin-only routes
router.post('/', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  DayController.createDay
);

router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  DayController.updateDay
);

router.delete('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  DayController.deleteDay
);

export default router;