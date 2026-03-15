import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types';
import { userService } from '../services/user.service';
import { authService } from '../services/auth.service';
import { sendSuccess, sendPaginated } from '../utils/response';

const addUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
});

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
});

export class UserController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await userService.getUsers(req.user!.companyId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      sendPaginated(res, result.users, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUser(req.params.id as string, req.user!.companyId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async add(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = addUserSchema.parse(req.body);
      const user = await authService.addUser(req.user!.companyId, data);
      sendSuccess(res, user, 'User added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { role } = updateRoleSchema.parse(req.body);
      const user = await userService.updateUserRole(req.params.id as string, req.user!.companyId, role);
      sendSuccess(res, user, 'Role updated');
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await userService.deactivateUser(req.params.id as string, req.user!.companyId);
      sendSuccess(res, null, 'User deactivated');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
