// services/user.service.js

import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import bcrypt from 'bcryptjs/dist/bcrypt.js';

const prisma = new PrismaClient();

export default class UserService {
  
  static async getAllUsers(filters = {}, page = 1, limit = 20) {
    try {
      const where = {
        ...(filters.role && { role: filters.role }),
        ...(filters.search && {
          OR: [
            { email: { contains: filters.search, mode: 'insensitive' } },
            { 
              studentProfile: {
                OR: [
                  { firstName: { contains: filters.search, mode: 'insensitive' } },
                  { lastName: { contains: filters.search, mode: 'insensitive' } },
                  { studentId: { contains: filters.search, mode: 'insensitive' } }
                ]
              }
            }
          ]
        })
      };

      const skip = (page - 1) * limit;
      
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: 'desc' },
          select: {
            id: true,
            email: true,
            role: true,
            studentProfile: {
              select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
                emailAddress: true,
                address: true,
                program: true,
                yearLevel: true,
                phone: true,
                dateOfBirth: true
              }
            }
          }
        }),
        prisma.user.count({ where })
      ]);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new AppError('Failed to fetch users', 500);
    }
  }

  
  static async getUserById(id, includePassword = false) {
    try {
      const selectFields = {
        id: true,
        email: true,
        role: true,
        studentProfile: {
          include: {
            emergencyContacts: true
          }
        }
      };

      if (includePassword) {
        selectFields.password = true;
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: selectFields
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch user', 500);
    }
  }



  static async updateUserEmail(userId, newEmail) {
    try {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new AppError('Email already in use', 409);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail },
        select: {
          id: true,
          email: true,
          role: true
        }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update email', 500);
    }
  }

  static async getUserByEmail(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          role: true,
          isActive: true,
        }
      });

      return user;
    } catch (error) {
      throw new AppError('Failed to fetch user by email', 500);
    }
  }

  static async updateUser(id, updates) {
    try {
      const { email, role, isActive } = updates;

      const data = {};
      if (email) data.email = email;
      if (role) data.role = role;
      if (typeof isActive === 'boolean') data.isActive = isActive;

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user', 500);
    }
  }

  
  // services/user.service.js

  static async deleteUser(id) {
      try {
        // 1. Find the user to get their studentProfileId
        const user = await prisma.user.findUnique({
          where: { id: parseInt(id) },
          include: { studentProfile: true } // ✅ Get the student profile
        });

        if (!user) {
          throw new AppError('User not found', 404);
        }
        
        // If the user is a student, we need to delete their enrollments first.
        if (user.studentProfile) {
          // 2. Delete all related enrollments using studentProfileId
          await prisma.enrollment.deleteMany({
            where: { studentProfileId: user.studentProfile.id } // ✅ Correct field and ID
          });

          // Prisma's `onDelete: Cascade` handles deleting the StudentProfile when the User is deleted.
          // So we don't need a separate delete call for the profile.
        }
        
        // 3. Delete the user (this will also trigger cascade deletion for the student profile)
        await prisma.user.delete({
          where: { id: parseInt(id) }
        });

      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        // Log the original error for debugging
        console.error('Failed to delete user:', error);
        throw new AppError('Failed to delete user', 500);
      }
  }

  static async deactivateUser(id) {
    try {
      console.log('Deactivating user with ID:', id);
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });
      return updatedUser;

    } catch (error) {
      console.error('Failed to deactivate user:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to deactivate user', 500);
    }
  }


  static async activateUser(id) {
    try {
      console.log('Activating user with ID:', id);
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { isActive: true },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });
      return updatedUser;

    } catch (error) {
      console.error('Failed to activate user:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to activate user', 500);
    }
  }


}

