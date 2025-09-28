// controllers/user.controller.js

import UserService from '../services/user.service.js';
import AuthService from '../services/auth.service.js';
import { AppError } from '../utils/errors.js';

export default class UserController {
  /**
   * Get current user profile
   */
  static async getCurrentUser(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.id);

      res.status(200).json({
        success: true,
        message: 'User profile fetched successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  static async updateCurrentUser(req, res, next) {
  try {
    const { email } = req.body;
    let updatedUser = req.user;

    if (email && email !== req.user.email) {
      updatedUser = await UserService.updateUserEmail(req.user.id, email);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'No changes provided, profile not updated',
        data: updatedUser
      });
    }
  } catch (error) {
    next(error);
  }
}

  /**
   * Change password
   */
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      await AuthService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        role, 
        isActive, 
        search 
      } = req.query;
      
      const filters = { role, isActive, search };

      const result = await UserService.getAllUsers(
        filters, 
        parseInt(page), 
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: 'Users fetched successfully',
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   */
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await UserService.getUserById(id);

      res.status(200).json({
        success: true,
        message: 'User fetched successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { email, role, isActive } = req.body;
      
      // Prevent admin from changing their own role or deactivating their account
      if (id === req.user.id) {
        throw new AppError('Cannot change your own role or deactivate your account', 403);
      }

      const user = await UserService.getUserByEmail(email);
      if (user && user.id !== id) {
        throw new AppError('Email is already in use by another account', 400);
      }

      const updatedUser = await UserService.updateUser(id, { email, role, isActive });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      // ✅ Correct fix: compare ID strings directly
      if (id === req.user.id) {
        throw new AppError('Cannot delete your own account', 400);
      }

      await UserService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  static async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        throw new AppError('Cannot deactivate your own account', 400);
      }

      const user = await UserService.deactivateUser(id);

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async activateUser(req, res, next) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        throw new AppError('Cannot activate your own account', 400);
      }

      const user = await UserService.activateUser(id);

      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}





