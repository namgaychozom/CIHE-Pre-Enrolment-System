// services/semester.service.js
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';

const prisma = new PrismaClient();

export default class SemesterService {
  /**
   * Create a new semester
   */
  static async createSemester(semesterData) {
    try {
      const { name, academicYear, semesterNumber, startDate, endDate, enrollmentStart, enrollmentEnd } = semesterData;

      if (!name || !academicYear || !semesterNumber || !startDate || !endDate) {
        throw new AppError('Name, academic year, semester number, start date, and end date are required', 400);
      }

      // Validate dates
      if (startDate >= endDate) {
        throw new AppError('End date must be after start date', 400);
      }

      if (enrollmentStart && enrollmentEnd && enrollmentStart >= enrollmentEnd) {
        throw new AppError('Enrollment end date must be after enrollment start date', 400);
      }

      // Check for duplicate semester
      const existingSemester = await prisma.semester.findFirst({
        where: {
          academicYear,
          semesterNumber
        }
      });

      if (existingSemester) {
        throw new AppError('A semester already exists for this academic year and semester number', 409);
      }

      const semester = await prisma.semester.create({
        data: {
          name: name.trim(),
          academicYear,
          semesterNumber,
          startDate,
          endDate,
          enrollmentStart: enrollmentStart || startDate,
          enrollmentEnd: enrollmentEnd || endDate
        }
      });

      return semester;
    } catch (error) {
      console.error('Create semester error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create semester', 500);
    }
  }

  /**
   * Get all semesters (with pagination and filtering)
   */
  static async getAllSemesters(filters = {}, page = 1, limit = 10) {
    try {
      const { search } = filters;
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [semesters, total] = await Promise.all([
        prisma.semester.findMany({
          where,
          orderBy: [
            { academicYear: 'desc' },
            { semesterNumber: 'desc' }
          ],
          skip,
          take: limit
        }),
        prisma.semester.count({ where })
      ]);

      return {
        semesters,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get semesters error:', error);
      throw new AppError('Failed to fetch semesters', 500);
    }
  }

  /**
   * Get semester by ID
   */
  static async getSemesterById(id) {
    try {
      const semester = await prisma.semester.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      if (!semester) {
        throw new AppError('Semester not found', 404);
      }

      return semester;
    } catch (error) {
      console.error('Get semester by ID error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch semester', 500);
    }
  }

  /**
   * Update semester
   */
  static async updateSemester(id, updateData) {
    try {
      // Check if semester exists
      const existingSemester = await prisma.semester.findUnique({
        where: { id }
      });

      if (!existingSemester) {
        throw new AppError('Semester not found', 404);
      }

      // Validate dates if provided
      const startDate = updateData.startDate || existingSemester.startDate;
      const endDate = updateData.endDate || existingSemester.endDate;

      if (startDate >= endDate) {
        throw new AppError('End date must be after start date', 400);
      }

      // Check for duplicate semester (excluding current semester)
      if (updateData.academicYear || updateData.semesterNumber) {
        const academicYear = updateData.academicYear || existingSemester.academicYear;
        const semesterNumber = updateData.semesterNumber || existingSemester.semesterNumber;
        
        const duplicate = await prisma.semester.findFirst({
          where: {
            id: { not: id },
            academicYear,
            semesterNumber
          }
        });

        if (duplicate) {
          throw new AppError('A semester already exists for this academic year and semester number', 409);
        }
      }

      const semester = await prisma.semester.update({
        where: { id },
        data: {
          ...updateData,
          name: updateData.name?.trim()
        }
      });

      return semester;
    } catch (error) {
      console.error('Update semester error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update semester', 500);
    }
  }

  /**
   * Delete semester
   */
  static async deleteSemester(id) {
    try {
      // Check if semester exists
      const semester = await prisma.semester.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      if (!semester) {
        throw new AppError('Semester not found', 404);
      }

      // Check if semester has enrollments
      if (semester._count.enrollments > 0) {
        throw new AppError('Cannot delete semester with existing enrollments', 409);
      }

      await prisma.semester.delete({
        where: { id }
      });

      return { message: 'Semester deleted successfully' };
    } catch (error) {
      console.error('Delete semester error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete semester', 500);
    }
  }

  /**
   * Get active semester
   */
  static async getActiveSemester() {
    try {
      const currentDate = new Date();
      
      const semester = await prisma.semester.findFirst({
        where: {
          AND: [
            { startDate: { lte: currentDate } },
            { endDate: { gte: currentDate } }
          ]
        },
        orderBy: { startDate: 'desc' }
      });

      if (!semester) {
        throw new AppError('No active semester found', 404);
      }

      return semester;
    } catch (error) {
      console.error('Get active semester error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch active semester', 500);
    }
  }
}
