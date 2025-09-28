// services/email.service.js
import nodemailer from "nodemailer";
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';

const prisma = new PrismaClient();

export default class EmailService {
  static createTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Send notification email to users based on criteria
   * @param {Object} notificationData - Notification details
   * @param {Object} criteria - Criteria for selecting recipients
   */
  static async sendNotificationEmails(notificationData, criteria = {}) {
    try {
      const { title, message, type } = notificationData;
      const { role, yearLevel, program } = criteria;

      // Build criteria for selecting users
      const userWhere = {};
      
      if (role && role !== 'ALL') {
        userWhere.role = role;
      }

      // Additional filters for student profiles
      const studentProfileWhere = {};
      if (yearLevel) {
        studentProfileWhere.yearLevel = parseInt(yearLevel);
      }
      if (program) {
        studentProfileWhere.program = program;
      }

      // Get users based on criteria
      let users;
      if (Object.keys(studentProfileWhere).length > 0 && (role === 'STUDENT' || !role || role === 'ALL')) {
        // If we have student-specific criteria, join with student profiles
        users = await prisma.user.findMany({
          where: {
            ...userWhere,
            AND: role === 'ALL' ? [
              {
                OR: [
                  { role: 'STUDENT', studentProfile: studentProfileWhere },
                  { role: 'ADMIN' },
                  { role: 'TEACHER' }
                ]
              }
            ] : role === 'STUDENT' ? [
              { studentProfile: studentProfileWhere }
            ] : []
          },
          include: {
            studentProfile: true
          }
        });
      } else {
        // Simple user query without student profile filters
        users = await prisma.user.findMany({
          where: userWhere,
          include: {
            studentProfile: true
          }
        });
      }

      if (users.length === 0) {
        console.log('No users found matching criteria');
        return { sent: 0, failed: 0 };
      }

      console.log(`Found ${users.length} users matching criteria`);

      // Create email transporter
      const transporter = this.createTransporter();

      // Send emails
      let sentCount = 0;
      let failedCount = 0;

      for (const user of users) {
        try {
          const emailSubject = this.getEmailSubject(type, title);
          const emailBody = this.formatEmailBody(user, title, message, type);

          await transporter.sendMail({
            from: `"CIHE Pre-Enrollment System" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
            to: user.email,
            subject: emailSubject,
            html: emailBody
          });

          sentCount++;
          console.log(`Email sent to ${user.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${user.email}:`, emailError);
          failedCount++;
        }
      }

      return { sent: sentCount, failed: failedCount, total: users.length };
    } catch (error) {
      console.error('Email service error:', error);
      throw new AppError('Failed to send notification emails', 500);
    }
  }

  /**
   * Get email subject based on notification type
   */
  static getEmailSubject(type, title) {
    const typeLabels = {
      'URGENT': '🚨 URGENT',
      'ACADEMIC': '📚 Academic',
      'GENERAL': '📢 General',
      'SYSTEM': '⚙️ System'
    };

    const typeLabel = typeLabels[type] || '📢';
    return `${typeLabel} - ${title}`;
  }

  /**
   * Format email body with HTML template
   */
  static formatEmailBody(user, title, message, type) {
    const userName = user.studentProfile?.firstName 
      ? `${user.studentProfile.firstName} ${user.studentProfile.lastName || ''}`.trim()
      : user.email.split('@')[0];

    const typeColors = {
      'URGENT': '#dc2626',
      'ACADEMIC': '#2563eb',
      'GENERAL': '#059669',
      'SYSTEM': '#7c3aed'
    };

    const typeColor = typeColors[type] || '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${typeColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .title { margin: 0; font-size: 24px; }
          .message { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">${title}</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <div class="message">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <div class="footer">
              <p>This is an automated message from the CIHE Pre-Enrollment System.</p>
              <p>Please do not reply to this email.</p>
              <p><strong>CIHE Pre-Enrollment System</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send individual email (used for OTP and other auth emails)
   */
  static async sendEmail(to, subject, text, html = null) {
    try {
      const transporter = this.createTransporter();
      
      await transporter.sendMail({
        from: `"CIHE Pre-Enrollment System" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html: html || text
      });

      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw new AppError('Failed to send email', 500);
    }
  }
}
