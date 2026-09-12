import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { createAuditLog } from './auditService';
import { EmailService } from './emailService';
import jwt from 'jsonwebtoken';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyName: string;
  industry: string;
  city?: string;
  state?: string;
  address?: string;
  ipAddress?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
}

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (existingUser) {
      const error: any = new Error('An account with this email address already exists');
      error.statusCode = 400;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.password, salt);

    // Create Company and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.companyName.trim(),
          industry: input.industry.trim(),
          city: input.city?.trim() || 'Gujarat',
          state: input.state?.trim() || 'Gujarat',
          address: input.address?.trim() || null,
          isVerified: false,
          trustScore: 80.0,
        },
      });

      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email: input.email.toLowerCase().trim(),
          password: hashedPassword,
          role: input.role,
          companyId: company.id,
        },
        include: {
          company: true,
        },
      });

      return { user, company };
    });

    const token = generateToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      companyId: result.company.id,
    });

    await createAuditLog({
      userId: result.user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: result.user.id,
      details: { email: result.user.email, role: result.user.role, company: result.company.name },
      ipAddress: input.ipAddress,
    });

    // Send welcome email
    EmailService.sendWelcome(
      result.user.email,
      result.user.name,
      result.user.role,
      result.company.name
    ).catch(() => {});

    return {
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        createdAt: result.user.createdAt,
        company: result.company,
      },
    };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
      include: {
        company: true,
      },
    });

    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: input.ipAddress,
    });

    // Send login alert email
    EmailService.sendLoginAlert(
      user.email,
      user.name,
      user.role,
      input.ipAddress
    ).catch(() => {});

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        company: user.company,
      },
    };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success to prevent email enumeration
    if (!user) return { success: true };

    // Generate a short-lived JWT as the reset token (15 min expiry)
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'recarbo_ultra_secure_jwt_secret_key_2025',
      { expiresIn: '15m' }
    );

    await EmailService.sendPasswordReset(user.email, user.name, resetToken);

    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email },
    });

    return { success: true };
  }

  static async resetPassword(token: string, newPassword: string) {
    let payload: any;
    try {
      payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'recarbo_ultra_secure_jwt_secret_key_2025'
      );
    } catch {
      const error: any = new Error('Reset link is invalid or has expired. Please request a new one.');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    if (payload.purpose !== 'password_reset') {
      const error: any = new Error('Invalid reset token');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    if (newPassword.length < 6) {
      const error: any = new Error('Password must be at least 6 characters');
      error.statusCode = 400;
      error.code = 'WEAK_PASSWORD';
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashed },
      include: { company: true },
    });

    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email },
    });

    return { success: true, message: 'Password updated successfully. You can now log in.' };
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            description: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            country: true,
            latitude: true,
            longitude: true,
            website: true,
            contactEmail: true,
            contactPhone: true,
            isVerified: true,
            trustScore: true,
            verificationDocs: true,
          },
        },
      },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      ...user,
      unreadNotificationsCount,
    };
  }
}
