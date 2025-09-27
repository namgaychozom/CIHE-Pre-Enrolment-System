// controllers/notification.controller.js
import NotificationService from '../services/notification.service.js';
import { AppError } from '../utils/errors.js';

export default class NotificationController {
  /**
   * Create new notification (Admin only)
   */
  static async createNotification(req, res, next) {
    try {
      const { title, message, type, sendEmail, role, yearLevel, program } = req.body;
      const createdBy = req.user.id;

      // Prepare email criteria if email should be sent
      const emailCriteria = sendEmail ? {
        sendEmail: true,
        role: role || 'ALL',
        yearLevel: yearLevel,
        program: program
      } : null;

      const notification = await NotificationService.createNotification(
        { title, message, type }, 
        createdBy,
        emailCriteria
      );

      res.status(201).json({
        success: true,
        message: sendEmail ? 'Notification created and emails sent successfully' : 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all notifications (Admin only)
   */
  static async getAllNotifications(req, res, next) {
    try {
      const { page = 1, limit = 10, type, isActive, search } = req.query;
      
      const filters = { type, isActive, search };
      
      const result = await NotificationService.getAllNotifications(
        filters, 
        parseInt(page), 
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: 'Notifications fetched successfully',
        data: result.notifications,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active notifications for students
   */
  static async getActiveNotifications(req, res, next) {
    try {
      const notifications = await NotificationService.getActiveNotifications();

      res.status(200).json({
        success: true,
        message: 'Active notifications fetched successfully',
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification by ID
   */
  static async getNotificationById(req, res, next) {
    try {
      const { id } = req.params;
      
      const notification = await NotificationService.getNotificationById(id);

      res.status(200).json({
        success: true,
        message: 'Notification fetched successfully',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update notification (Admin only)
   */
  static async updateNotification(req, res, next) {
    try {
      const { id } = req.params;
      const { title, message, type, isActive } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (message !== undefined) updateData.message = message.trim();
      if (type !== undefined) updateData.type = type;
      if (isActive !== undefined) updateData.isActive = isActive;

      const notification = await NotificationService.updateNotification(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Notification updated successfully',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle notification status (Admin only)
   */
  static async toggleNotificationStatus(req, res, next) {
    try {
      const { id } = req.params;
      
      const notification = await NotificationService.toggleNotificationStatus(id);

      res.status(200).json({
        success: true,
        message: `Notification ${notification.isActive ? 'activated' : 'deactivated'} successfully`,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification (Admin only)
   */
  static async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await NotificationService.deleteNotification(id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}
