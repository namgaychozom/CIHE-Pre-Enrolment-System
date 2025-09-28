import express from 'express';
import UserController from '../controllers/user.controller.js'; // This is a class
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = express.Router();

router.get('/profile', authMiddleware, UserController.getCurrentUser); 
router.put('/profile', authMiddleware, UserController.updateCurrentUser); 
router.post('/change-password', authMiddleware, UserController.changePassword); 

const adminRouter = express.Router();
adminRouter.use(authMiddleware, roleMiddleware(['ADMIN']));

adminRouter.get('/', UserController.getAllUsers); 
adminRouter.get('/:id', UserController.getUserById); 
adminRouter.delete('/:id', UserController.deleteUser); 
adminRouter.put('/:id', UserController.updateUser);
adminRouter.post('/deactivate/:id', UserController.deactivateUser);
adminRouter.post('/activate/:id', UserController.activateUser);

router.use('/', adminRouter);

export default router;