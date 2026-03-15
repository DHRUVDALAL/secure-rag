import prisma from '../database/prisma';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class UserService {
  // Get all users for a company
  async getUsers(companyId: string, options: { page?: number; limit?: number } = {}) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { companyId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: { companyId } }),
    ]);

    return { users, total, page, limit };
  }

  // Get single user
  async getUser(userId: string, companyId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundError('User');
    return user;
  }

  // Update user role
  async updateUserRole(userId: string, companyId: string, role: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    logger.info('User role updated', { userId, companyId, newRole: role });
    return updated;
  }

  // Deactivate user
  async deactivateUser(userId: string, companyId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
    logger.info('User deactivated', { userId, companyId });
    return { success: true };
  }

  // Get current user profile
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        company: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!user) throw new NotFoundError('User');
    return user;
  }
}

export const userService = new UserService();
