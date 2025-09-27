// services/dashboard.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DashboardService {
  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats() {
    try {
      console.log('📊 Fetching admin dashboard statistics from database...');
      
      // Get total counts using Prisma aggregations for better performance
      const [
        totalUnits,
        totalUsers,
        totalEnrollments,
        totalSemesters,
        totalNotifications
      ] = await Promise.all([
        prisma.unit.count(),
        prisma.user.count({
          where: {
            role: 'STUDENT'
          }
        }),
        prisma.enrollment.count(),
        prisma.semester.count(),
        prisma.notification.count()
      ]);

      const stats = {
        totalUnits,
        totalUsers, // This is total students (filtered by role)
        totalEnrollments,
        totalSemesters,
        activeNotifications: totalNotifications
      };

      console.log('✅ Admin dashboard statistics:', stats);
      
      return stats;
    } catch (error) {
      console.error('❌ Error fetching admin dashboard statistics:', error);
      throw error;
    }
  }

  /**
   * Get student dashboard statistics
   */
  static async getStudentStats(userId) {
    try {
      console.log('📊 Fetching student dashboard statistics for user:', userId);
      
      // First get the student profile ID
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: userId }
      });

      if (!studentProfile) {
        return {
          myEnrollments: 0,
          availableUnits: 0,
          totalSemesters: 0
        };
      }
      
      const [
        myEnrollments,
        availableUnits,
        totalSemesters
      ] = await Promise.all([
        prisma.enrollment.count({
          where: {
            studentProfileId: studentProfile.id
          }
        }),
        prisma.unit.count(),
        prisma.semester.count()
      ]);

      const stats = {
        myEnrollments,
        availableUnits,
        totalSemesters
      };

      console.log('✅ Student dashboard statistics:', stats);
      
      return stats;
    } catch (error) {
      console.error('❌ Error fetching student dashboard statistics:', error);
      throw error;
    }
  }
}

export default DashboardService;
