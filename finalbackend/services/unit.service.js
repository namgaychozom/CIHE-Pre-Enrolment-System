// services/unit.service.js
import { PrismaClient } from '@prisma/client';
import {AppError} from '../utils/errors.js';

const prisma = new PrismaClient();

export default class UnitService {

  static async getAllUnits(filters = {}, page = 1, limit = 100) {
    try {
      console.log('Getting units with filters:', filters);
      
      // Build where clause for search
      const where = {};
      
      // Search functionality
      if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          where.OR = [
            { unitCode: { contains: searchTerm } },
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } }
          ];
      }
      
      // Credits filter
      if (filters.credits) {
        where.credits = parseInt(filters.credits);
      }
      
      // Credits range filters
      if (filters.minCredits) {
        where.credits = {
          ...where.credits,
          gte: parseInt(filters.minCredits)
        };
      }
      
      if (filters.maxCredits) {
        where.credits = {
          ...where.credits,
          lte: parseInt(filters.maxCredits)
        };
      }
      
      console.log('Where clause:', JSON.stringify(where, null, 2));
      
      const units = await prisma.unit.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: [
          { unitCode: 'asc' },
          { id: 'asc' }
        ]
      });
      
      const totalCount = await prisma.unit.count({ where });
      
      console.log('Found units:', units.length, 'Total:', totalCount);

      return {
        units,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in getAllUnits:', error);
      throw new AppError('Failed to fetch units', 500);
    }
  }

  
  static async getUnitById(id) {
    try {
      const unit = await prisma.unit.findUnique({
        where: { id: parseInt(id) },
        include: {
          enrollments: {
            include: {
              availabilities: {
                include: {
                  timeSlot: true,
                  day: true,
                },
              },
              studentProfile: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            },
          },
        },
      });

      if (!unit) {
        throw new AppError('Unit not found', 404);
      }

      return unit;
    } catch (error) {
      console.error('Error in getUnitById:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch unit', 500);
    }
  }


  static async createUnit(data) {
    try {
      const { unitCode, title, description, credits } = data;

      // Check if unit code already exists
      const existingUnit = await prisma.unit.findUnique({
        where: { unitCode }
      });

      if (existingUnit) {
        throw new AppError('Unit code already exists', 409);
      }

      const unit = await prisma.unit.create({
        data: {
          unitCode: unitCode.toUpperCase(),
          title,
          description: description || null,
          credits: parseInt(credits),
        }
      });

      return unit;
    } catch (error) {
      console.error(error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create unit', 500);
    }
  }


  static async updateUnit(id, data) {
    try {
      const unit = await prisma.unit.findUnique({
        where: { id: parseInt(id) }
      });

      if (!unit) {
        throw new AppError('Unit not found', 404);
      }

      // Check if new unit code already exists (if being updated)
      if (data.unitCode && data.unitCode !== unit.unitCode) {
        const existingUnit = await prisma.unit.findUnique({
          where: { unitCode: data.unitCode.toUpperCase() }
        });

        if (existingUnit) {
          throw new AppError('Unit code already exists', 409);
        }
      }

      const updatedUnit = await prisma.unit.update({
        where: { id: parseInt(id) },
        data: {
          ...(data.unitCode && { unitCode: data.unitCode.toUpperCase() }),
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.credits && { credits: parseInt(data.credits) }),
          ...(data.capacity && { capacity: parseInt(data.capacity) })
        }
      });

      return updatedUnit;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update unit', 500);
    }
  }


  static async deleteUnit(id) {
    try {
      // 1. Check for existing enrollments
      const unit = await prisma.unit.findUnique({
        where: { id: parseInt(id) },
        select: {
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });
  
      if (!unit) {
        throw new AppError('Unit not found', 404);
      }
  
      const hasEnrollments = unit._count.enrollments > 0;
  
      if (hasEnrollments) {
        throw new AppError('Cannot delete unit with existing enrollments.', 400);
      }
  
      // 2. Perform the hard deletion
      const deletedUnit = await prisma.unit.delete({
        where: { id: parseInt(id) }
      });
  
      return deletedUnit;
    } catch (error) {
      console.error('Error in deleteUnit:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete unit', 500);
    }
}


  static async searchUnits(query, limit = 20) {
    try {
      const lowerCaseQuery = query.toLowerCase();

      const units = await prisma.unit.findMany({
        where: {
          OR: [
            { unitCode: { contains: lowerCaseQuery } },
            { title: { contains: lowerCaseQuery } },
            { description: { contains: lowerCaseQuery } }
          ]
        },
        take: limit,
        orderBy: [
          { unitCode: 'asc' },
          { title: 'asc' }
        ],
        select: {
          id: true,
          unitCode: true,
          title: true,
          credits: true,
          description: true
        }
      }); 

      return units;
    } catch (error) {
      // You should log the original error here to see the actual Prisma error
      console.error(error);
      throw new AppError('Search failed', 500);
    }
  }


  static async getUnitStats(id) {
    try {
      const unit = await prisma.unit.findUnique({
        where: { id: parseInt(id) },
        include: {
          schedules: {
            where: { isActive: true },
            include: {
              enrollments: true,
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

      if (!unit) {
        throw new AppError('Unit not found', 404);
      }

      const stats = {
        totalSchedules: unit.schedules.length,
        totalEnrollments: 0,
        approvedEnrollments: 0,
        pendingEnrollments: 0,
        waitlistedEnrollments: 0,
        rejectedEnrollments: 0,
        totalCapacity: 0,
        utilizationRate: 0
      };

      unit.schedules.forEach(schedule => {
        stats.totalCapacity += schedule.maxCapacity || unit.capacity;
        
        schedule.enrollments.forEach(enrollment => {
          stats.totalEnrollments++;
          switch (enrollment.status) {
            case 'APPROVED':
              stats.approvedEnrollments++;
              break;
            case 'PENDING':
              stats.pendingEnrollments++;
              break;
            case 'WAITLISTED':
              stats.waitlistedEnrollments++;
              break;
            case 'REJECTED':
              stats.rejectedEnrollments++;
              break;
          }
        });
      });

      stats.utilizationRate = stats.totalCapacity > 0 
        ? Math.round((stats.approvedEnrollments / stats.totalCapacity) * 100)
        : 0;

      return { unit, stats };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch unit statistics', 500);
    }
  }
}

