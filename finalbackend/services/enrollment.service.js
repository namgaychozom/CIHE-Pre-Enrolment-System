// services/enrollment.service.js

import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';

const prisma = new PrismaClient();

// Helper function to convert various time formats to military time (HH:MM format)
function convertToMilitaryTime(timeStr) {
  // Remove any whitespace
  timeStr = timeStr.trim();
  
  // If already in HH:MM format (24-hour), return as-is
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  // Handle 12-hour format with am/pm
  if (timeStr.includes('am') || timeStr.includes('pm')) {
    const [time, period] = timeStr.replace(/\s+/g, '').toLowerCase().split(/([ap]m)/);
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    minutes = minutes || '00';
    
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // If it's just HH:MM format but single digit hours, pad it
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [hours, minutes] = timeStr.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  // Return as-is if we can't parse it
  return timeStr;
}

export default class EnrollmentService {
  // Get enrollment counts for all units
  static async getUnitEnrollmentCounts() {
    try {
      // Get all units
      const units = await prisma.unit.findMany({
        select: {
          id: true,
          unitCode: true,
          title: true,
          description: true,
          credits: true
        }
      });

      // For each unit, get enrollment count
      const results = await Promise.all(units.map(async unit => {
        const count = await prisma.enrollment.count({
          where: { unitId: unit.id }
        });
        return {
          ...unit,
          enrollmentCount: count
        };
      }));

      return results;
    } catch (error) {
      throw new AppError('Failed to fetch unit enrollment counts', 500);
    }
  }

  static async getAllEnrollments(filters = {}, page = 1, limit = 20) {
    try {
      const where = {
        ...(filters.studentProfileId && { studentProfileId: parseInt(filters.studentProfileId) }),
        ...(filters.unitId && { unitId: parseInt(filters.unitId) }),
        ...(filters.semesterId && { semesterId: parseInt(filters.semesterId) }),
        ...(filters.search && {
          OR: [
            {
              studentProfile: {
                OR: [
                  { firstName: { contains: filters.search, mode: 'insensitive' } },
                  { lastName: { contains: filters.search, mode: 'insensitive' } },
                  { studentId: { contains: filters.search, mode: 'insensitive' } }
                ]
              }
            },
            {
              unit: {
                OR: [
                  { unitCode: { contains: filters.search, mode: 'insensitive' } },
                  { title: { contains: filters.search, mode: 'insensitive' } }
                ]
              }
            }
          ]
        })
      };

      const skip = (page - 1) * limit;
      
      const [enrollments, totalCount] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { enrolledAt: 'desc' },
          include: {
            studentProfile: {
              select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
                emailAddress: true,
                address: true, 
                phone: true,
                program: true,
                yearLevel: true
              }
            },
            unit: {
              select: {
                id: true,
                unitCode: true,
                title: true,
                credits: true
              }
            },
            semester: {
              select: {
                id: true,
                name: true,
                academicYear: true,
                semesterNumber: true
              }
            },
            availabilities: {
              include: {
                timeSlot: {
                  select: {
                    id: true,
                    name: true,
                    startTime: true,
                    endTime: true
                  }
                },
                day: {
                  select: {
                    id: true,
                    name: true,
                    shortName: true,
                    dayOrder: true
                  }
                }
              }
            }
          }
        }),
        prisma.enrollment.count({ where })
      ]);

      return {
        enrollments,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      };
    } catch (error) {
      throw new AppError('Failed to fetch enrollments', 500);
    }
  }

  static async getEnrollmentById(id) {
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: parseInt(id) },
        include: {
          studentProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          unit: true,
          semester: true,
          availabilities: {
            include: {
              timeSlot: true,
              day: true
            }
          }
        }
      });

      if (!enrollment) {
        throw new AppError('Enrollment not found', 404);
      }

      return enrollment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch enrollment', 500);
    }
  }

  static async createEnrollment(data) {
    try {
      console.log('=== ENROLLMENT SERVICE DEBUG ===');
      console.log('Received data:', JSON.stringify(data, null, 2));
      
      const { studentProfileId, unitId, semesterId, availabilityIds, scheduleSlots } = data;

      console.log('Extracted values:', {
        studentProfileId,
        unitId,
        semesterId,
        availabilityIds,
        scheduleSlots
      });

      // Check if student profile exists
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { id: parseInt(studentProfileId) }
      });
      if (!studentProfile) {
        throw new AppError('Student profile not found', 404);
      }

      // Check if unit exists
      const unit = await prisma.unit.findUnique({
        where: { id: parseInt(unitId) }
      });
      if (!unit) {
        throw new AppError('Unit not found', 404);
      }

      // Check if semester exists
      const semester = await prisma.semester.findUnique({
        where: { id: parseInt(semesterId) }
      });
      if (!semester) {
        throw new AppError('Semester not found', 404);
      }

      // Check if enrollment period is active
      const now = new Date();
      if (now < semester.enrollmentStart || now > semester.enrollmentEnd) {
        throw new AppError('Enrollment period is not active for this semester', 400);
      }

      // Check if student is already enrolled in this unit for this semester
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          studentProfileId_unitId_semesterId: {
            studentProfileId: parseInt(studentProfileId),
            unitId: parseInt(unitId),
            semesterId: parseInt(semesterId)
          }
        }
      });
      if (existingEnrollment) {
        throw new AppError('Student is already enrolled in this unit for this semester', 400);
      }

      let finalAvailabilityIds = [];

      // If schedule slots are provided (from frontend form), create/find availabilities
      if (scheduleSlots && Array.isArray(scheduleSlots) && scheduleSlots.length > 0) {
        console.log('Creating availabilities from schedule slots:', scheduleSlots);
        
        for (const slot of scheduleSlots) {
          const { dayName, timeSlot } = slot;
          
          // Find day by name (no conversion needed since database is fixed)
          const day = await prisma.day.findUnique({
            where: { name: dayName }
          });
          if (!day) {
            throw new AppError(`Day '${dayName}' not found`, 400);
          }

          // Parse time slot format
          // Frontend can send formats like:
          // "18:00-21:00" or "6:00pm - 9:00pm" or "18:00 - 21:00"
          let startTime, endTime;
          
          if (timeSlot.includes('-')) {
            // Handle formats: "18:00-21:00" or "6:00pm - 9:00pm"
            const parts = timeSlot.split('-').map(part => part.trim());
            startTime = convertToMilitaryTime(parts[0]);
            endTime = convertToMilitaryTime(parts[1]);
          } else if (timeSlot.includes(' - ')) {
            // Handle format: "18:00 - 21:00"
            const parts = timeSlot.split(' - ');
            startTime = convertToMilitaryTime(parts[0]);
            endTime = convertToMilitaryTime(parts[1]);
          } else {
            throw new AppError(`Invalid time slot format: ${timeSlot}`, 400);
          }
          
          console.log(`Converted timeSlot "${timeSlot}" to startTime: "${startTime}", endTime: "${endTime}"`);
          
          // Find timeSlot by start and end time
          const timeSlotRecord = await prisma.timeSlot.findFirst({
            where: {
              startTime: startTime,
              endTime: endTime
            }
          });
          if (!timeSlotRecord) {
            throw new AppError(`Time slot '${timeSlot}' (${startTime} - ${endTime}) not found`, 400);
          }

          // Find or create availability
          let availability = await prisma.availability.findUnique({
            where: {
              timeSlotId_dayId: {
                timeSlotId: timeSlotRecord.id,
                dayId: day.id
              }
            }
          });

          if (!availability) {
            try {
              availability = await prisma.availability.create({
                data: {
                  timeSlotId: timeSlotRecord.id,
                  dayId: day.id
                }
              });
              console.log(`Created new availability: ${dayName} ${timeSlot}`);
            } catch (createError) {
              // If creation fails due to unique constraint, try to find it again
              if (createError.code === 'P2002') {
                availability = await prisma.availability.findUnique({
                  where: {
                    timeSlotId_dayId: {
                      timeSlotId: timeSlotRecord.id,
                      dayId: day.id
                    }
                  }
                });
                console.log(`Found existing availability after create conflict: ${dayName} ${timeSlot}`);
              } else {
                throw createError;
              }
            }
          }

          if (availability) {
            finalAvailabilityIds.push(availability.id);
          }
        }
      }
      // If availability IDs are provided directly, use them
      else if (availabilityIds && availabilityIds.length > 0) {
        // Verify availability IDs exist
        const availabilities = await prisma.availability.findMany({
          where: {
            id: { in: availabilityIds.map(id => parseInt(id)) }
          }
        });
        if (availabilities.length !== availabilityIds.length) {
          throw new AppError('Some availability slots not found', 400);
        }
        finalAvailabilityIds = availabilityIds.map(id => parseInt(id));
      }

      console.log('Final availability IDs for enrollment:', finalAvailabilityIds);

      // Create enrollment with availabilities
      const enrollment = await prisma.enrollment.create({
        data: {
          studentProfileId: parseInt(studentProfileId),
          unitId: parseInt(unitId),
          semesterId: parseInt(semesterId),
          ...(finalAvailabilityIds.length > 0 && {
            availabilities: {
              connect: finalAvailabilityIds.map(id => ({ id }))
            }
          })
        },
        include: {
          studentProfile: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true
            }
          },
          unit: {
            select: {
              id: true,
              unitCode: true,
              title: true,
              credits: true
            }
          },
          semester: {
            select: {
              id: true,
              name: true,
              academicYear: true
            }
          },
          availabilities: {
            include: {
              timeSlot: true,
              day: true
            }
          }
        }
      });

      console.log('Enrollment created successfully:', enrollment.id);

      return enrollment;
    } catch (error) {
      console.error('Enrollment creation error:', error);
      console.error('Error stack:', error.stack);

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        // Unique constraint failed - this is duplicate enrollment
        if (error.meta?.target?.includes('studentProfileId_unitId_semesterId')) {
          throw new AppError('Student is already enrolled in this unit for this semester', 400);
        }
        throw new AppError('Duplicate enrollment detected', 400);
      }

      // Re-throw AppError instances
      if (error instanceof AppError) {
        throw error;
      }

      // Generic error fallback
      throw new AppError(`Failed to create enrollment: ${error.message}`, 500);
    }
  }

  static async updateEnrollment(id, data) {
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: parseInt(id) },
        include: {
          semester: true
        }
      });

      if (!enrollment) {
        throw new AppError('Enrollment not found', 404);
      }

      // Check if enrollment period is still active for modifications
      const now = new Date();
      if (now > enrollment.semester.enrollmentEnd) {
        throw new AppError('Cannot modify enrollment after enrollment period has ended', 400);
      }

      const updateData = {};

      // Handle availability updates
      if (data.availabilityIds !== undefined) {
        if (data.availabilityIds.length > 0) {
          // Verify availability IDs exist
          const availabilities = await prisma.availability.findMany({
            where: {
              id: { in: data.availabilityIds.map(id => parseInt(id)) }
            }
          });
          if (availabilities.length !== data.availabilityIds.length) {
            throw new AppError('Some availability slots not found', 400);
          }

          updateData.availabilities = {
            set: data.availabilityIds.map(id => ({ id: parseInt(id) }))
          };
        } else {
          updateData.availabilities = {
            set: []
          };
        }
      }

      const updatedEnrollment = await prisma.enrollment.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          studentProfile: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true
            }
          },
          unit: {
            select: {
              id: true,
              unitCode: true,
              title: true,
              credits: true
            }
          },
          semester: {
            select: {
              id: true,
              name: true,
              academicYear: true
            }
          },
          availabilities: {
            include: {
              timeSlot: true,
              day: true
            }
          }
        }
      });

      return updatedEnrollment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update enrollment', 500);
    }
  }

  static async deleteEnrollment(id) {
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: parseInt(id) },
        include: {
          semester: true
        }
      });

      if (!enrollment) {
        throw new AppError('Enrollment not found', 404);
      }

      // Check if enrollment can still be cancelled
      const now = new Date();
      if (now > enrollment.semester.enrollmentEnd) {
        throw new AppError('Cannot cancel enrollment after enrollment period has ended', 400);
      }

      await prisma.enrollment.delete({
        where: { id: parseInt(id) }
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete enrollment', 500);
    }
  }

  static async getEnrollmentsByStudent(studentProfileId, semesterId = null) {
    try {
      const where = {
        studentProfileId: parseInt(studentProfileId),
        ...(semesterId && { semesterId: parseInt(semesterId) })
      };

      const enrollments = await prisma.enrollment.findMany({
        where,
        orderBy: { enrolledAt: 'desc' },
        include: {
          unit: {
            select: {
              id: true,
              unitCode: true,
              title: true,
              description: true,
              credits: true
            }
          },
          semester: {
            select: {
              id: true,
              name: true,
              academicYear: true,
              semesterNumber: true,
              startDate: true,
              endDate: true
            }
          },
          availabilities: {
            include: {
              timeSlot: {
                select: {
                  id: true,
                  name: true,
                  startTime: true,
                  endTime: true
                }
              },
              day: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  dayOrder: true
                }
              }
            }
          }
        }
      });

      return enrollments;
    } catch (error) {
      throw new AppError('Failed to fetch student enrollments', 500);
    }
  }

  static async getEnrollmentsByUnit(unitId, semesterId = null) {
    try {
      const where = {
        unitId: parseInt(unitId),
        ...(semesterId && { semesterId: parseInt(semesterId) })
      };

      const enrollments = await prisma.enrollment.findMany({
        where,
        orderBy: { enrolledAt: 'desc' },
        include: {
          studentProfile: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              emailAddress: true,
              program: true,
              yearLevel: true
            }
          },
          semester: {
            select: {
              id: true,
              name: true,
              academicYear: true,
              semesterNumber: true
            }
          },
          availabilities: {
            include: {
              timeSlot: true,
              day: true
            }
          }
        }
      });

      return enrollments;
    } catch (error) {
      throw new AppError('Failed to fetch unit enrollments', 500);
    }
  }

  static async getEnrollmentsBySemester(semesterId) {
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { semesterId: parseInt(semesterId) },
        orderBy: { enrolledAt: 'desc' },
        include: {
          studentProfile: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              program: true,
              yearLevel: true
            }
          },
          unit: {
            select: {
              id: true,
              unitCode: true,
              title: true,
              credits: true
            }
          },
          availabilities: {
            include: {
              timeSlot: true,
              day: true
            }
          }
        }
      });

      return enrollments;
    } catch (error) {
      throw new AppError('Failed to fetch semester enrollments', 500);
    }
  }
}