// controllers/enrollment.controller.js

import { PrismaClient } from '@prisma/client';
import EnrollmentService from '../services/enrollment.service.js';
import { AppError } from '../utils/errors.js';

const prisma = new PrismaClient();

export default class EnrollmentController {
  /**
   * Get all enrollments with pagination and filtering
   */
  static async getAllEnrollments(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        studentProfileId, 
        unitId, 
        semesterId, 
        search 
      } = req.query;
      
      const filters = {
        ...(studentProfileId && { studentProfileId }),
        ...(unitId && { unitId }),
        ...(semesterId && { semesterId }),
        ...(search && { search })
      };

      const result = await EnrollmentService.getAllEnrollments(
        filters, 
        parseInt(page), 
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: 'Enrollments fetched successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get enrollment by ID
   */
  static async getEnrollmentById(req, res, next) {
    try {
      const { id } = req.params;
      
      const enrollment = await EnrollmentService.getEnrollmentById(id);

      res.status(200).json({
        success: true,
        message: 'Enrollment fetched successfully',
        data: enrollment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new enrollment
   */
  static async createEnrollment(req, res, next) {
    try {
      const { studentProfileId, unitId, semesterId, availabilityIds } = req.body;

      // Validation
      if (!studentProfileId || !unitId || !semesterId) {
        throw new AppError('Student profile ID, unit ID, and semester ID are required', 400);
      }

      // Validate availability IDs if provided
      if (availabilityIds && !Array.isArray(availabilityIds)) {
        throw new AppError('Availability IDs must be an array', 400);
      }

      const enrollment = await EnrollmentService.createEnrollment({
        studentProfileId,
        unitId,
        semesterId,
        availabilityIds
      });

      res.status(201).json({
        success: true,
        message: 'Enrollment created successfully',
        data: enrollment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update enrollment
   */
  static async updateEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      const { availabilityIds } = req.body;

      // Validate availability IDs if provided
      if (availabilityIds !== undefined && !Array.isArray(availabilityIds)) {
        throw new AppError('Availability IDs must be an array', 400);
      }

      const updateData = {};
      if (availabilityIds !== undefined) {
        updateData.availabilityIds = availabilityIds;
      }

      const enrollment = await EnrollmentService.updateEnrollment(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Enrollment updated successfully',
        data: enrollment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete enrollment
   */
  static async deleteEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      
      await EnrollmentService.deleteEnrollment(id);

      res.status(200).json({
        success: true,
        message: 'Enrollment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get enrollments by student
   */
  static async getEnrollmentsByStudent(req, res, next) {
    try {
      const { studentProfileId } = req.params;
      const { semesterId } = req.query;

      const enrollments = await EnrollmentService.getEnrollmentsByStudent(
        studentProfileId, 
        semesterId
      );

      res.status(200).json({
        success: true,
        message: 'Student enrollments fetched successfully',
        data: enrollments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get enrollments by unit
   */
  static async getEnrollmentsByUnit(req, res, next) {
    try {
      const { unitId } = req.params;
      const { semesterId } = req.query;

      const enrollments = await EnrollmentService.getEnrollmentsByUnit(
        unitId, 
        semesterId
      );

      res.status(200).json({
        success: true,
        message: 'Unit enrollments fetched successfully',
        data: enrollments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get enrollments by semester
   */
  static async getEnrollmentsBySemester(req, res, next) {
    try {
      const { semesterId } = req.params;

      const enrollments = await EnrollmentService.getEnrollmentsBySemester(semesterId);

      res.status(200).json({
        success: true,
        message: 'Semester enrollments fetched successfully',
        data: enrollments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's enrollments
   */
  static async getMyEnrollments(req, res, next) {
    try {
      const { semesterId } = req.query;
      const userId = req.user.id; // From auth middleware

      // First get the student profile for the current user
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: userId }
      });

      if (!studentProfile) {
        throw new AppError('Student profile not found for current user', 404);
      }

      const enrollments = await EnrollmentService.getEnrollmentsByStudent(
        studentProfile.id, 
        semesterId
      );

      console.log('My Enrollments:', enrollments);

      res.status(200).json({
        success: true,
        message: 'Your enrollments fetched successfully',
        data: enrollments
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create enrollment for current user
   */
  static async createMyEnrollment(req, res, next) {
    try {
      const { unitId, semesterId, availabilityIds, scheduleSlots } = req.body;
      const userId = req.user.id; // From auth middleware

      // Validation
      if (!unitId || !semesterId) {
        throw new AppError('Unit ID and semester ID are required', 400);
      }

      // Get the student profile for the current user
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: userId }
      });

      if (!studentProfile) {
        throw new AppError('Student profile not found for current user', 404);
      }

      console.log('Creating enrollment with data:', { 
        unitId, 
        semesterId, 
        availabilityIds, 
        scheduleSlots,
        studentProfileId: studentProfile.id 
      });

      const enrollment = await EnrollmentService.createEnrollment({
        studentProfileId: studentProfile.id,
        unitId,
        semesterId,
        availabilityIds,
        scheduleSlots
      });

      res.status(201).json({
        success: true,
        message: 'Enrollment created successfully',
        data: enrollment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's enrollment
   */
  static async updateMyEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      const { availabilityIds } = req.body;
      const userId = req.user.id; // From auth middleware

      // Get the enrollment and verify it belongs to the current user
      const enrollment = await EnrollmentService.getEnrollmentById(id);
      
      if (enrollment.studentProfile.userId !== userId) {
        throw new AppError('You can only update your own enrollments', 403);
      }

      const updateData = {};
      if (availabilityIds !== undefined) {
        if (!Array.isArray(availabilityIds)) {
          throw new AppError('Availability IDs must be an array', 400);
        }
        updateData.availabilityIds = availabilityIds;
      }

      const updatedEnrollment = await EnrollmentService.updateEnrollment(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Enrollment updated successfully',
        data: updatedEnrollment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete current user's enrollment
   */
  static async deleteMyEnrollment(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // From auth middleware

      // Get the enrollment and verify it belongs to the current user
      const enrollment = await EnrollmentService.getEnrollmentById(id);
      
      if (enrollment.studentProfile.userId !== userId) {
        throw new AppError('You can only delete your own enrollments', 403);
      }

      await EnrollmentService.deleteEnrollment(id);

      res.status(200).json({
        success: true,
        message: 'Enrollment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}