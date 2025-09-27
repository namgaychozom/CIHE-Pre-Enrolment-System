// routes/semester.routes.js
import express from 'express';
import SemesterController from '../controllers/semester.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all semesters
router.get('/', authMiddleware, SemesterController.getAllSemesters);

// Get active semester
router.get('/active', authMiddleware, SemesterController.getActiveSemester);

// Get semester by ID
router.get('/:id', authMiddleware, SemesterController.getSemesterById);

// Create semester (admin only)
router.post('/', authMiddleware, SemesterController.createSemester);

// Update semester (admin only)
router.put('/:id', authMiddleware, SemesterController.updateSemester);

// Delete semester (admin only)
router.delete('/:id', authMiddleware, SemesterController.deleteSemester);

export default router;
