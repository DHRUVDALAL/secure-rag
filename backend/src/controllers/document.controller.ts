import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { documentService } from '../services/document.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { ValidationError } from '../utils/errors';

export class DocumentController {
  async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const { title, description, tags, isConfidential } = req.body;
      if (!title) {
        throw new ValidationError('Document title is required');
      }

      const document = await documentService.uploadDocument(
        req.file,
        req.user!.companyId,
        req.user!.userId,
        {
          title,
          description,
          tags: tags ? JSON.parse(tags) : [],
          isConfidential: isConfidential === 'true',
        }
      );

      sendSuccess(res, document, 'Document uploaded and processing started', 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query;
      const result = await documentService.getDocuments(req.user!.companyId, {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as string,
      });

      sendPaginated(res, result.documents, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const document = await documentService.getDocument(
        req.params.id as string,
        req.user!.companyId
      );
      sendSuccess(res, document);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await documentService.deleteDocument(req.params.id as string, req.user!.companyId);
      sendSuccess(res, null, 'Document deleted');
    } catch (error) {
      next(error);
    }
  }

  async stats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await documentService.getStats(req.user!.companyId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
