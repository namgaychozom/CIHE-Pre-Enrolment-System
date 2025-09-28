// routes/unit.routes.js
import express from 'express';
import UnitController from '../controllers/unit.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';


const router = express.Router();

// Public routes (accessible by authenticated students and admins)
router.get('/', authMiddleware, UnitController.getAllUnits);
router.get('/search', authMiddleware, UnitController.searchUnits);
router.get('/:id', authMiddleware, UnitController.getUnitById);

// Admin-only routes
router.post('/', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  UnitController.createUnit
);

router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  UnitController.updateUnit
);

router.delete('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  UnitController.deleteUnit
);

export default router;