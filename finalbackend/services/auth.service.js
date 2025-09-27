// services/auth.service.js
import bcrypt from 'bcryptjs/dist/bcrypt.js';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {AppError} from '../utils/errors.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import crypto from "crypto";
import EmailService from './email.service.js';

const prisma = new PrismaClient();

export default class AuthService {
  static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  static JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '120m';
  static JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  
  static async register(data) {
    const { email, password, role = 'STUDENT', profileData } = data;

    // Validate input
    if (!validateEmail(email)) {
      throw new AppError('Invalid email format', 400);
    }

    if (!validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character', 400);
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new AppError('User already exists with this email', 409);
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user with transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role
          }
        });

        // Create student profile if role is STUDENT
        let studentProfile = null;
        if (role === 'STUDENT') {
          console.log("Full data received:", JSON.stringify(data, null, 2)); // Debug log
          console.log("Profile Data Received:", profileData); // Debug log
          
          if (!profileData) {
            throw new AppError('profileData is required for student registration', 400);
          }
          if (!profileData.firstName) {
            throw new AppError('firstname is required for student registration', 400);
          }
          if (!profileData.lastName) {
            throw new AppError('lastname is required for student registration', 400);
          }
          if (!profileData.phone) {
            throw new AppError('phone is required for student registration', 400);
          }
          if (!profileData.program) {
            throw new AppError('Program is required for student registration', 400);
          }
          if (!profileData.yearLevel) {
            throw new AppError('Year level is required for student registration', 400);
          }

          // Generate student ID if not provided
          const studentId = profileData.studentId || await this.generateStudentId(tx);

          studentProfile = await tx.studentProfile.create({
            data: {
              userId: user.id,
              studentId,
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              emailAddress: profileData.email || email,
              address: profileData.address || '',
              phone: profileData.phone,
              program: profileData.program,
              yearLevel: profileData.yearLevel,
              dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
            }
          });
        }

        return { user, studentProfile };
      });

      // Generate tokens
      const token = this.generateToken(result.user.id, result.user.role);
      const refreshToken = this.generateRefreshToken(result.user.id);

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          isActive: result.user.isActive,
          studentProfile: result.studentProfile ? {
            id: result.studentProfile.id,
            studentId: result.studentProfile.studentId,
            firstName: result.studentProfile.firstName,
            lastName: result.studentProfile.lastName,
            program: result.studentProfile.program,
            yearLevel: result.studentProfile.yearLevel,
          } : undefined
        },
        token,
        refreshToken
      };

    } catch (error) {
        console.error("Registration error:", error);  // 👈 log full details
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Registration failed', 500);
        }
  }

  static async login(data) {
    const { email, password } = data;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    try {
      // Find user with student profile
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          studentProfile: true
        }
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      if (!user.isActive) {
        throw new AppError('Account is deactivated', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate tokens
      const token = this.generateToken(user.id, user.role);
      const refreshToken = this.generateRefreshToken(user.id);

      // Log successful login
      await this.logAuditEvent(user.id, 'USER_LOGIN', 'User', user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          studentProfile: user.studentProfile ? {
            id: user.studentProfile.id,
            studentId: user.studentProfile.studentId,
            firstName: user.studentProfile.firstName,
            lastName: user.studentProfile.lastName,
            program: user.studentProfile.program,
            yearLevel: user.studentProfile.yearLevel,
          } : undefined
        },
        token,
        refreshToken
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Login failed', 500);
    }
  }

 
  static async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      const newToken = this.generateToken(user.id, user.role);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

 
  static async logout(userId) {
    try {
      await this.logAuditEvent(userId, 'USER_LOGOUT', 'User', userId);
      // Implement token blacklisting if needed
    } catch (error) {
      throw new AppError('Logout failed', 500);
    }
  }


  static async changePassword(userId, currentPassword, newPassword) {
    if (!validatePassword(newPassword)) {
      throw new AppError('New password does not meet requirements', 400);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Log password change
      await this.logAuditEvent(userId, 'PASSWORD_CHANGED', 'User', userId);

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Password change failed', 500);
    }
  }


  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new AppError('Invalid token', 401);
    }
  }

 
  static async getUserProfile(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true
        }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        studentProfile: user.studentProfile
      };

    } catch (error) {
      console.error("Get profile error:", error);  // 👈 log full details
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get user profile', 500);
    }
  }

  static generateToken(userId, role) {
    return jwt.sign(
      { userId, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }


  static generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.JWT_REFRESH_EXPIRES_IN }
    );
  }


  static async generateStudentId(tx) {
    let studentId;
    let isUnique = false;
    
    // Keep generating until we get a unique student ID
    while (!isUnique) {
      // Generate 4 random digits
      const randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      studentId = `CIHE${randomNumber}`;
      
      // Check if this student ID already exists
      const existingStudent = await tx.studentProfile.findFirst({
        where: {
          studentId: studentId
        }
      });
      
      if (!existingStudent) {
        isUnique = true;
      }
    }

    return studentId;
  }


  static async logAuditEvent(userId, action, entityType, entityId, oldValues = null, newValues = null) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          oldValues: oldValues ? JSON.stringify(oldValues) : null,
          newValues: newValues ? JSON.stringify(newValues) : null,
        }
      });
    } catch (error) {
      // Log audit failure but don't throw - shouldn't break main flow
      console.error('Audit logging failed:', error);
    }
  }

  static async requestPasswordReset(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("User not found", 404);

    // Generate OTP (6 digits)
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();

    await prisma.passwordReset.deleteMany({
        where: {
            userId: user.id,
        },
    });

    const passwordReset = await prisma.passwordReset.create({
        data: {
            userId: user.id,
            otp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
    });

    // Send OTP email using EmailService
    await EmailService.sendEmail(
      user.email,
      "Password Reset OTP",
      `Your OTP is ${otp}. It expires in 15 minutes.`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>This OTP will expire in 15 minutes.</strong></p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">CIHE Pre-Enrollment System</p>
        </div>
      `
    );
  }


  static async resetPassword(email, otp, newPassword) {
        if (!validatePassword(newPassword)) {
            throw new AppError("Password does not meet requirements", 400);
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new AppError("User not found", 404);

        // Get the latest OTP
        const reset = await prisma.passwordReset.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" }, // latest first
        });

        if (!reset || reset.otp !== otp || reset.expiresAt < new Date()) {
            throw new AppError("Invalid or expired OTP", 400);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        // Delete all OTPs for this user
        await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

        await this.logAuditEvent(user.id, "PASSWORD_RESET", "User", user.id);
    }

}
