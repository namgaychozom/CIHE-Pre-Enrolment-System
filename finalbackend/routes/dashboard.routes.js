// routes/dashboard.routes.js
import express from 'express';
import DashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

// Admin dashboard statistics
router.get('/admin/stats', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  DashboardController.getAdminStats
);

// Student dashboard statistics
router.get('/student/stats', 
  authMiddleware, 
  DashboardController.getStudentStats
);

export default router;
