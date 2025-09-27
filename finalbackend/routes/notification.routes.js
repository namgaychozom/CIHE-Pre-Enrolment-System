// routes/notification.routes.js
import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

// Public routes (accessible by authenticated users)
router.get('/active', authMiddleware, NotificationController.getActiveNotifications);
router.get('/:id', authMiddleware, NotificationController.getNotificationById);

// Admin-only routes
router.get('/', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  NotificationController.getAllNotifications
);

router.post('/', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  NotificationController.createNotification
);

router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  NotificationController.updateNotification
);

router.patch('/:id/toggle', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  NotificationController.toggleNotificationStatus
);

router.delete('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  NotificationController.deleteNotification
);

export default router;
