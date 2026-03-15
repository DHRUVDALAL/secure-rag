import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../config';
import prisma from '../database/prisma';
import { AuthUser } from '../types';
import { UnauthorizedError, ConflictError, ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;

export class AuthService {
  // Register a new company + admin user
  async registerCompany(data: {
    companyName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const slug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if company slug already exists
    const existingCompany = await prisma.company.findUnique({ where: { slug } });
    if (existingCompany) {
      throw new ConflictError('Company name already taken');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'ADMIN',
          companyId: company.id,
        },
      });

      return { company, user };
    });

    const tokens = this.generateTokens({
      userId: result.user.id,
      email: result.user.email,
      companyId: result.company.id,
      role: result.user.role,
    });

    logger.info('New company registered', {
      companyId: result.company.id,
      companyName: result.company.name,
      adminEmail: result.user.email,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      company: {
        id: result.company.id,
        name: result.company.name,
        slug: result.company.slug,
      },
      ...tokens,
    };
  }

  // Login existing user
  async login(email: string, password: string) {
    // Find user across all companies
    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.company.isActive) {
      throw new UnauthorizedError('Company account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    });

    logger.info('User logged in', { userId: user.id, companyId: user.companyId });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
      },
      ...tokens,
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as AuthUser;

      const user = await prisma.user.findFirst({
        where: { id: decoded.userId, isActive: true },
        include: { company: true },
      });

      if (!user || !user.company.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        role: user.role,
      });
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  // Add user to company (admin only)
  async addUser(
    companyId: string,
    data: { email: string; password: string; firstName: string; lastName: string; role: UserRole }
  ) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, companyId },
    });

    if (existing) {
      throw new ConflictError('User with this email already exists in the company');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        companyId,
      },
    });

    logger.info('User added to company', { userId: user.id, companyId, role: data.role });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  private generateTokens(payload: AuthUser) {
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
