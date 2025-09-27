// controllers/day.controller.js

import DayService from '../services/day.service.js';
import { AppError } from '../utils/errors.js';

export default class DayController {
  /**
   * Get all days
   */
  static async getAllDays(req, res, next) {
    try {
      const days = await DayService.getAllDays();

      res.status(200).json({
        success: true,
        message: 'Days fetched successfully',
        data: days
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get day by ID
   */
  static async getDayById(req, res, next) {
    try {
      const { id } = req.params;
      
      const day = await DayService.getDayById(id);

      res.status(200).json({
        success: true,
        message: 'Day fetched successfully',
        data: day
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get day by name
   */
  static async getDayByName(req, res, next) {
    try {
      const { name } = req.params;
      
      const day = await DayService.getDayByName(name);

      res.status(200).json({
        success: true,
        message: 'Day fetched successfully',
        data: day
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new day
   */
  static async createDay(req, res, next) {
    try {
      const { name, shortName, dayOrder } = req.body;

      // Validation
      if (!name || !shortName || dayOrder === undefined) {
        throw new AppError('Name, short name, and day order are required', 400);
      }

      // Validate day order range
      if (dayOrder < 1 || dayOrder > 7) {
        throw new AppError('Day order must be between 1 and 7', 400);
      }

      const day = await DayService.createDay({
        name,
        shortName,
        dayOrder
      });

      res.status(201).json({
        success: true,
        message: 'Day created successfully',
        data: day
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update day
   */
  static async updateDay(req, res, next) {
    try {
      const { id } = req.params;
      const { name, shortName, dayOrder } = req.body;

      const updateData = {};
      
      if (name) updateData.name = name;
      if (shortName) updateData.shortName = shortName;
      
      if (dayOrder !== undefined) {
        // Validate day order range
        if (dayOrder < 1 || dayOrder > 7) {
          throw new AppError('Day order must be between 1 and 7', 400);
        }
        updateData.dayOrder = dayOrder;
      }

      const day = await DayService.updateDay(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Day updated successfully',
        data: day
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete day
   */
  static async deleteDay(req, res, next) {
    try {
      const { id } = req.params;
      
      await DayService.deleteDay(id);

      res.status(200).json({
        success: true,
        message: 'Day deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get days with availabilities
   */
  static async getDaysWithAvailabilities(req, res, next) {
    try {
      const days = await DayService.getDaysWithAvailabilities();

      res.status(200).json({
        success: true,
        message: 'Days with availabilities fetched successfully',
        data: days
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get weekdays only
   */
  static async getWeekDays(req, res, next) {
    try {
      const weekDays = await DayService.getWeekDays();

      res.status(200).json({
        success: true,
        message: 'Weekdays fetched successfully',
        data: weekDays
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get weekend days only
   */
  static async getWeekendDays(req, res, next) {
    try {
      const weekendDays = await DayService.getWeekendDays();

      res.status(200).json({
        success: true,
        message: 'Weekend days fetched successfully',
        data: weekendDays
      });
    } catch (error) {
      next(error);
    }
  }
}