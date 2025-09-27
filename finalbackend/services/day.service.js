import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';

const prisma = new PrismaClient();

export default class DayService {

  static async getAllDays() {
    try {
      const days = await prisma.day.findMany({
        orderBy: { dayOrder: 'asc' },
        include: {
          _count: {
            select: {
              availability: true,
            }
          }
        }
      });

      return days;
    } catch (error) {
      throw new AppError('Failed to fetch days', 500);
    }
  }

  static async getDayById(id) {
    try {
      const day = await prisma.day.findUnique({
        where: { id: parseInt(id) }
      });

      if (!day) {
        throw new AppError('Day not found', 404);
      }

      return day;
    } catch (error) {
      console.error('Error in getDayById:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch day', 500);
    }
  }

  static async getDayByName(name) {
    try {
      const day = await prisma.day.findUnique({
        where: { name: name },
        include: {
          availability: {
            include: {
              timeSlot: true,
              _count: {
                select: {
                  enrollments: true
                }
              }
            }
          }
        }
      });

      if (!day) {
        throw new AppError('Day not found', 404);
      }

      return day;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch day', 500);
    }
  }

  static async createDay(data) {
    try {
      const { name, shortName, dayOrder } = data;

      // Check if day with same name, shortName, or dayOrder already exists
      const existingDay = await prisma.day.findFirst({
        where: {
          OR: [
            { name: name },
            { shortName: shortName },
            { dayOrder: parseInt(dayOrder) }
          ]
        }
      });

      if (existingDay) {
        if (existingDay.name === name) {
          throw new AppError('Day with this name already exists', 400);
        }
        if (existingDay.shortName === shortName) {
          throw new AppError('Day with this short name already exists', 400);
        }
        if (existingDay.dayOrder === parseInt(dayOrder)) {
          throw new AppError('Day with this order already exists', 400);
        }
      }

      const day = await prisma.day.create({
        data: {
          name,
          shortName,
          dayOrder: parseInt(dayOrder)
        }
      });

      return day;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create day', 500);
    }
  }

  static async updateDay(id, data) {
    try {
      const day = await prisma.day.findUnique({
        where: { id: parseInt(id) }
      });

      if (!day) {
        throw new AppError('Day not found', 404);
      }

      const updateData = {};
      
      if (data.name) {
        // Check if another day with this name exists
        const existingName = await prisma.day.findFirst({
          where: { 
            name: data.name,
            NOT: { id: parseInt(id) }
          }
        });
        if (existingName) {
          throw new AppError('Day with this name already exists', 400);
        }
        updateData.name = data.name;
      }

      if (data.shortName) {
        // Check if another day with this short name exists
        const existingShortName = await prisma.day.findFirst({
          where: { 
            shortName: data.shortName,
            NOT: { id: parseInt(id) }
          }
        });
        if (existingShortName) {
          throw new AppError('Day with this short name already exists', 400);
        }
        updateData.shortName = data.shortName;
      }

      if (data.dayOrder !== undefined) {
        // Check if another day with this order exists
        const existingOrder = await prisma.day.findFirst({
          where: { 
            dayOrder: parseInt(data.dayOrder),
            NOT: { id: parseInt(id) }
          }
        });
        if (existingOrder) {
          throw new AppError('Day with this order already exists', 400);
        }
        updateData.dayOrder = parseInt(data.dayOrder);
      }

      const updatedDay = await prisma.day.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      return updatedDay;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update day', 500);
    }
  }

  static async deleteDay(id) {
    try {
      const day = await prisma.day.findUnique({
        where: { id: parseInt(id) },
        include: {
          availability: true,
        }
      });

      if (!day) {
        throw new AppError('Day not found', 404);
      }

      // Check if day is being used in any availability
      if (day.availability.length > 0) {
        throw new AppError('Cannot delete day as it is used in availability', 400);
      }

      await prisma.day.delete({
        where: { id: parseInt(id) }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete day', 500);
    }
  }

  static async getDaysWithAvailabilities() {
    try {
      const days = await prisma.day.findMany({
        orderBy: { dayOrder: 'asc' },
        include: {
          availability: {
            include: {
              timeSlot: true,
              _count: {
                select: {
                  enrollments: {
                    where: { status: 'APPROVED' }
                  }
                }
              }
            }
          }
        }
      });

      return days;
    } catch (error) {
      throw new AppError('Failed to fetch days with availability', 500);
    }
  }

  static async getWeekDays() {
    try {
      const weekDays = await prisma.day.findMany({
        where: {
          dayOrder: {
            gte: 1,
            lte: 5
          }
        },
        orderBy: { dayOrder: 'asc' }
      });

      return weekDays;
    } catch (error) {
      throw new AppError('Failed to fetch weekdays', 500);
    }
  }

  static async getWeekendDays() {
    try {
      const weekendDays = await prisma.day.findMany({
        where: {
          dayOrder: {
            in: [6, 7]
          }
        },
        orderBy: { dayOrder: 'asc' }
      });

      return weekendDays;
    } catch (error) {
      throw new AppError('Failed to fetch weekend days', 500);
    }
  }
}