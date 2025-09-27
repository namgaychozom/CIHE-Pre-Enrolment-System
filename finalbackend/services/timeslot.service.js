import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';

const prisma = new PrismaClient();

export default class TimeSlotService {

  static async getAllTimeSlots() {
    try {
      // The TimeSlot model does not have an `isActive` field.
      // Removed `includeInactive` logic and related query.

      const timeSlots = await prisma.timeSlot.findMany({
        orderBy: { startTime: 'asc' },
        include: {
          _count: {
            select: {
              // The relation is `availabilities`, not `schedules`.
              availabilities: true,
            }
          }
        }
      });

      return timeSlots;
    } catch (error) {
      throw new AppError('Failed to fetch time slots', 500);
    }
  }

  static async getTimeSlotById(id) {
    try {
      const timeSlot = await prisma.timeSlot.findUnique({
        where: { id: parseInt(id) },
        include: {
          availabilities: {
            include: {
              day: true,
              enrollments: {
                include: {
                  unit: {
                    select: {
                      id: true,
                      unitCode: true,
                      title: true
                    }
                  }
                }
              },
            }
          }
        }
      });

      if (!timeSlot) {
        throw new AppError('Time slot not found', 404);
      }

      return timeSlot;
    } catch (error) {
      console.error('Error in getTimeSlotById:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch time slot', 500);
    }
  }

  static async createTimeSlot(data) {
    try {
      const { name, startTime, endTime } = data;

      const start = startTime;
      const end = endTime;

      const timeSlot = await prisma.timeSlot.create({
        data: {
          name,
          startTime: start,
          endTime: end
        }
      });

      return timeSlot;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create time slot', 500);
    }
  }

  static async updateTimeSlot(id, data) {
    try {
      const timeSlot = await prisma.timeSlot.findUnique({
        where: { id: parseInt(id) }
      });

      if (!timeSlot) {
        throw new AppError('Time slot not found', 404);
      }

      const updateData = {};
      
      if (data.name) {
        updateData.name = data.name;
      }

      if (data.startTime) {
        updateData.startTime = data.startTime;
      }

      if (data.endTime) {
        updateData.endTime = data.endTime;
      }

      const updatedTimeSlot = await prisma.timeSlot.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      return updatedTimeSlot;
    } catch (error) {
      console.error('Error in updateTimeSlot:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update time slot', 500);
    }
  }

  static async deleteTimeSlot(id) {
    try {
      const timeSlot = await prisma.timeSlot.findUnique({
        where: { id: parseInt(id) },
        include: {
          // The relation is `availabilities`, not `schedules`.
          availabilities: true,
        }
      });

      if (!timeSlot) {
        throw new AppError('Time slot not found', 404);
      }

      // Check if time slot is being used in any availabilities
      if (timeSlot.availabilities.length > 0) {
        throw new AppError('Cannot delete time slot as it is used in an availability', 400);
      }

      await prisma.timeSlot.delete({
        where: { id: parseInt(id) }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete time slot', 500);
    }
  }
}