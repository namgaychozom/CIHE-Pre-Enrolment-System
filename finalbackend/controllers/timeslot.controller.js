// controllers/timeslot.controller.js

import TimeSlotService from '../services/timeslot.service.js';
import { AppError } from '../utils/errors.js';

export default class TimeSlotController {
  /**
   * Get all time slots
   */
  static async getAllTimeSlots(req, res, next) {
    try {
      const { includeInactive = false } = req.query;
      
      const timeSlots = await TimeSlotService.getAllTimeSlots(
        includeInactive === 'true'
      );

      res.status(200).json({
        success: true,
        message: 'Time slots fetched successfully',
        data: timeSlots
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get time slot by ID
   */
  static async getTimeSlotById(req, res, next) {
    try {
      const { id } = req.params;
      
      const timeSlot = await TimeSlotService.getTimeSlotById(id);

      res.status(200).json({
        success: true,
        message: 'Time slot fetched successfully',
        data: timeSlot
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new time slot
   */
  static async createTimeSlot(req, res, next) {
    try {
      const { name, startTime, endTime } = req.body;

      // Validation
      if (!name || !startTime || !endTime) {
        throw new AppError('Name, start time, and end time are required', 400);
      }

      // Validate time format
      const start = startTime;
      const end = endTime;

      const timeSlot = await TimeSlotService.createTimeSlot({
        name,
        startTime,
        endTime
      });

      res.status(201).json({
        success: true,
        message: 'Time slot created successfully',
        data: timeSlot
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update time slot
   */
  static async updateTimeSlot(req, res, next) {
    try {
      const { id } = req.params;
      const { name, startTime, endTime } = req.body;

      const updateData = {};
      
      if (name) updateData.name = name;
      
      // Time format validation regex for HH:mm format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (startTime) {
        if (!timeRegex.test(startTime)) {
          throw new AppError('Invalid start time format. Use HH:mm format (e.g., 09:30)', 400);
        }
        updateData.startTime = startTime;
      }
      
      if (endTime) {
        if (!timeRegex.test(endTime)) {
          throw new AppError('Invalid end time format. Use HH:mm format (e.g., 10:30)', 400);
        }
        updateData.endTime = endTime;
      }

      const timeSlot = await TimeSlotService.updateTimeSlot(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Time slot updated successfully',
        data: timeSlot
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete time slot
   */
  static async deleteTimeSlot(req, res, next) {
    try {
      const { id } = req.params;
      
      await TimeSlotService.deleteTimeSlot(id);

      res.status(200).json({
        success: true,
        message: 'Time slot deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

}

