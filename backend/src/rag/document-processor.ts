import fs from 'fs';
import path from 'path';
import { DocumentType } from '@prisma/client';
import { logger } from '../utils/logger';

// Text extraction for different document types
export class DocumentProcessor {
  // Extract text from uploaded file
  async extractText(filePath: string, type: DocumentType): Promise<string> {
    logger.info('Extracting text from document', { filePath, type });

    switch (type) {
      case 'PDF':
        return this.extractPdf(filePath);
      case 'DOCX':
        return this.extractDocx(filePath);
      case 'TXT':
      case 'MARKDOWN':
        return this.extractPlainText(filePath);
      default:
        throw new Error(`Unsupported document type: ${type}`);
    }
  }

  private async extractPdf(filePath: string): Promise<string> {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  private async extractDocx(filePath: string): Promise<string> {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async extractPlainText(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // Determine document type from file extension
  static getDocumentType(filename: string): DocumentType {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case '.pdf': return 'PDF';
      case '.docx': return 'DOCX';
      case '.txt': return 'TXT';
      case '.md':
      case '.markdown': return 'MARKDOWN';
      default: throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  // Get MIME type
  static getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.markdown': 'text/markdown',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export const documentProcessor = new DocumentProcessor();
