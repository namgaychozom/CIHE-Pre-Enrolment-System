// services/notification.service.js
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import EmailService from './email.service.js';

const prisma = new PrismaClient();

export default class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(notificationData, createdBy, emailCriteria = null) {
    try {
      const { title, message, type = 'GENERAL' } = notificationData;

      if (!title || !message) {
        throw new AppError('Title and message are required', 400);
      }

      const notification = await prisma.notification.create({
        data: {
          title: title.trim(),
          message: message.trim(),
          type,
          createdBy,
          isActive: true
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      // Send email notifications if criteria provided
      if (emailCriteria && (emailCriteria.sendEmail === true || emailCriteria.sendEmail === 'true')) {
        try {
          console.log('Sending notification emails with criteria:', emailCriteria);
          const emailResult = await EmailService.sendNotificationEmails(
            { title, message, type },
            emailCriteria
          );
          
          console.log(`Email notifications sent: ${emailResult.sent} successful, ${emailResult.failed} failed out of ${emailResult.total} recipients`);
          
          // You could store email stats in the notification record if needed
          // await prisma.notification.update({
          //   where: { id: notification.id },
          //   data: { 
          //     emailsSent: emailResult.sent,
          //     emailsFailed: emailResult.failed 
          //   }
          // });
        } catch (emailError) {
          console.error('Failed to send notification emails:', emailError);
          // Don't fail the notification creation if email sending fails
          // The notification is created successfully, email sending is optional
        }
      }

      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create notification', 500);
    }
  }

  /**
   * Get all notifications (with pagination)
   */
  static async getAllNotifications(filters = {}, page = 1, limit = 10) {
    try {
      const { type, isActive, search } = filters;
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};
      
      if (type && type !== 'all') {
        where.type = type;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      throw new AppError('Failed to fetch notifications', 500);
    }
  }

  /**
   * Get active notifications for students
   */
  static async getActiveNotifications() {
    try {
      const notifications = await prisma.notification.findMany({
        where: { isActive: true },
        include: {
          creator: {
            select: {
              email: true,
              role: true
            }
          }
        },
        orderBy: [
          { type: 'desc' }, // URGENT first
          { createdAt: 'desc' }
        ]
      });

      return notifications;
    } catch (error) {
      console.error('Get active notifications error:', error);
      throw new AppError('Failed to fetch notifications', 500);
    }
  }

  /**
   * Get notification by ID
   */
  static async getNotificationById(id) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: parseInt(id) },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!notification) {
        throw new AppError('Notification not found', 404);
      }

      return notification;
    } catch (error) {
      console.error('Get notification error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch notification', 500);
    }
  }

  /**
   * Update notification
   */
  static async updateNotification(id, updateData) {
    try {
      const existingNotification = await this.getNotificationById(id);
      
      const notification = await prisma.notification.update({
        where: { id: parseInt(id) },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      return notification;
    } catch (error) {
      console.error('Update notification error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update notification', 500);
    }
  }

  /**
   * Toggle notification active status
   */
  static async toggleNotificationStatus(id) {
    try {
      const existingNotification = await this.getNotificationById(id);
      
      const notification = await prisma.notification.update({
        where: { id: parseInt(id) },
        data: {
          isActive: !existingNotification.isActive,
          updatedAt: new Date()
        },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      return notification;
    } catch (error) {
      console.error('Toggle notification status error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to toggle notification status', 500);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(id) {
    try {
      await this.getNotificationById(id); // Check if exists
      
      await prisma.notification.delete({
        where: { id: parseInt(id) }
      });

      return { message: 'Notification deleted successfully' };
    } catch (error) {
      console.error('Delete notification error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete notification', 500);
    }
  }
}
