// routes/enrollment.routes.js

import express from 'express';
import EnrollmentController from '../controllers/enrollment.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

// Student routes - manage their own enrollments
router.get('/my-enrollments', 
  authMiddleware, 
  roleMiddleware(['STUDENT']), 
  EnrollmentController.getMyEnrollments
);

router.post('/my-enrollments', 
  authMiddleware, 
  roleMiddleware(['STUDENT']), 
  EnrollmentController.createMyEnrollment
);

router.put('/my-enrollments/:id', 
  authMiddleware, 
  roleMiddleware(['STUDENT']), 
  EnrollmentController.updateMyEnrollment
);

router.delete('/my-enrollments/:id', 
  authMiddleware, 
  roleMiddleware(['STUDENT']), 
  EnrollmentController.deleteMyEnrollment
);

// Public routes (accessible by authenticated users)
router.get('/student/:studentProfileId', 
  authMiddleware, 
  EnrollmentController.getEnrollmentsByStudent
);

router.get('/unit/:unitId', 
  authMiddleware, 
  EnrollmentController.getEnrollmentsByUnit
);

router.get('/semester/:semesterId', 
  authMiddleware, 
  EnrollmentController.getEnrollmentsBySemester
);

router.get('/:id', 
  authMiddleware, 
  EnrollmentController.getEnrollmentById
);

// Admin and Tutor routes - full enrollment management
router.get('/', 
  authMiddleware, 
  // roleMiddleware(['ADMIN', 'TUTOR']), 
  EnrollmentController.getAllEnrollments
);

router.post('/', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'TUTOR']), 
  EnrollmentController.createEnrollment
);

router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'TUTOR']), 
  EnrollmentController.updateEnrollment
);

router.delete('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'TUTOR']), 
  EnrollmentController.deleteEnrollment
);

export default router;