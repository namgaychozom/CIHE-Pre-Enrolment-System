// controllers/dashboard.controller.js
import DashboardService from '../services/dashboard.service.js';

class DashboardController {
  /**
   * Get dashboard statistics for admin
   */
  static async getAdminStats(req, res, next) {
    try {
      console.log('📊 Getting admin dashboard statistics...');
      
      const stats = await DashboardService.getAdminStats();
      
      res.status(200).json({
        success: true,
        message: 'Dashboard statistics fetched successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard statistics for student
   */
  static async getStudentStats(req, res, next) {
    try {
      const { userId } = req.user;
      console.log('📊 Getting student dashboard statistics for user:', userId);
      
      const stats = await DashboardService.getStudentStats(userId);
      
      res.status(200).json({
        success: true,
        message: 'Student dashboard statistics fetched successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
