// controllers/semester.controller.js
import SemesterService from '../services/semester.service.js';
import { AppError } from '../utils/errors.js';

export default class SemesterController {
  /**
   * Create new semester (Admin only)
   */
  static async createSemester(req, res, next) {
    try {
      console.log('📝 Received semester data:', req.body);
      
      const { 
        name, 
        academicYear, 
        semesterNumber, 
        startDate, 
        endDate, 
        enrollmentStart, 
        enrollmentEnd 
      } = req.body;
      
      const semester = await SemesterService.createSemester({
        name,
        academicYear: parseInt(academicYear),
        semesterNumber: parseInt(semesterNumber),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        enrollmentStart: enrollmentStart ? new Date(enrollmentStart) : null,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : null
      });

      res.status(201).json({
        success: true,
        message: 'Semester created successfully',
        data: semester
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all semesters
   */
  static async getAllSemesters(req, res, next) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      
      const filters = { status, search };
      
      const result = await SemesterService.getAllSemesters(
        filters, 
        parseInt(page), 
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: 'Semesters fetched successfully',
        data: result.semesters,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get semester by ID
   */
  static async getSemesterById(req, res, next) {
    try {
      const { id } = req.params;
      
      const semester = await SemesterService.getSemesterById(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Semester fetched successfully',
        data: semester
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update semester (Admin only)
   */
  static async updateSemester(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('📝 Updating semester with data:', updateData);
      
      // Convert date strings to Date objects if provided
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }
      if (updateData.enrollmentStart) {
        updateData.enrollmentStart = new Date(updateData.enrollmentStart);
      }
      if (updateData.enrollmentEnd) {
        updateData.enrollmentEnd = new Date(updateData.enrollmentEnd);
      }
      if (updateData.academicYear) {
        updateData.academicYear = parseInt(updateData.academicYear);
      }
      if (updateData.semesterNumber) {
        updateData.semesterNumber = parseInt(updateData.semesterNumber);
      }

      const semester = await SemesterService.updateSemester(parseInt(id), updateData);

      res.status(200).json({
        success: true,
        message: 'Semester updated successfully',
        data: semester
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete semester (Admin only)
   */
  static async deleteSemester(req, res, next) {
    try {
      const { id } = req.params;
      
      await SemesterService.deleteSemester(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Semester deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active semester
   */
  static async getActiveSemester(req, res, next) {
    try {
      const semester = await SemesterService.getActiveSemester();

      res.status(200).json({
        success: true,
        message: 'Active semester fetched successfully',
        data: semester
      });
    } catch (error) {
      next(error);
    }
  }
}
