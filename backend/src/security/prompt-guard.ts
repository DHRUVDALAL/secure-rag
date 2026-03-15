import { SecurityScanResult } from '../types';
import { logger } from '../utils/logger';

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS: { pattern: RegExp; threat: string }[] = [
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, threat: 'Instruction override attempt' },
  { pattern: /ignore\s+(all\s+)?above\s+instructions/i, threat: 'Instruction override attempt' },
  { pattern: /disregard\s+(all\s+)?previous/i, threat: 'Instruction override attempt' },
  { pattern: /forget\s+(all\s+)?previous/i, threat: 'Instruction override attempt' },
  { pattern: /bypass\s+(the\s+)?security/i, threat: 'Security bypass attempt' },
  { pattern: /bypass\s+(the\s+)?filter/i, threat: 'Filter bypass attempt' },
  { pattern: /reveal\s+(your\s+)?(system\s+)?prompt/i, threat: 'System prompt extraction' },
  { pattern: /show\s+(me\s+)?(your\s+)?(system\s+)?instructions/i, threat: 'System prompt extraction' },
  { pattern: /what\s+are\s+your\s+(system\s+)?instructions/i, threat: 'System prompt extraction' },
  { pattern: /reveal\s+confidential/i, threat: 'Data exfiltration attempt' },
  { pattern: /output\s+(all|every)\s+document/i, threat: 'Data exfiltration attempt' },
  { pattern: /list\s+all\s+(confidential|secret|private)/i, threat: 'Data exfiltration attempt' },
  { pattern: /act\s+as\s+(a\s+)?different/i, threat: 'Role manipulation attempt' },
  { pattern: /you\s+are\s+now\s+a/i, threat: 'Role manipulation attempt' },
  { pattern: /pretend\s+(to\s+be|you\s+are)/i, threat: 'Role manipulation attempt' },
  { pattern: /\[system\]/i, threat: 'System tag injection' },
  { pattern: /\<\/?system\>/i, threat: 'System tag injection' },
  { pattern: /```\s*system/i, threat: 'Code block system injection' },
  { pattern: /DROP\s+TABLE/i, threat: 'SQL injection attempt' },
  { pattern: /;\s*DELETE\s+FROM/i, threat: 'SQL injection attempt' },
  { pattern: /UNION\s+SELECT/i, threat: 'SQL injection attempt' },
  { pattern: /<script[^>]*>/i, threat: 'XSS attempt' },
  { pattern: /javascript:/i, threat: 'XSS attempt' },
  { pattern: /on(error|load|click)\s*=/i, threat: 'XSS attempt' },
];

// Heuristic checks for suspicious patterns
const SUSPICIOUS_INDICATORS = [
  { check: (input: string) => input.length > 5000, reason: 'Excessively long input' },
  {
    check: (input: string) => (input.match(/\n/g) || []).length > 50,
    reason: 'Excessive line breaks (possible hidden instruction)',
  },
  {
    check: (input: string) => /[\u200B-\u200D\uFEFF]/.test(input),
    reason: 'Contains zero-width characters (possible hidden text)',
  },
  {
    check: (input: string) => {
      const encoded = input.match(/[^\x20-\x7E\n\r\t]/g) || [];
      return encoded.length > input.length * 0.3;
    },
    reason: 'High ratio of non-printable characters',
  },
];

export class PromptGuard {
  // Scan input for security threats
  scan(input: string): SecurityScanResult {
    const threats: string[] = [];

    // Check against known injection patterns
    for (const { pattern, threat } of INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        threats.push(threat);
      }
    }

    // Check heuristic indicators
    for (const { check, reason } of SUSPICIOUS_INDICATORS) {
      if (check(input)) {
        threats.push(reason);
      }
    }

    const isSafe = threats.length === 0;

    if (!isSafe) {
      logger.warn('Prompt injection detected', { threats, inputPreview: input.substring(0, 100) });
    }

    return {
      isSafe,
      threats,
      sanitizedInput: isSafe ? input : this.sanitize(input),
    };
  }

  // Sanitize input by removing dangerous patterns
  private sanitize(input: string): string {
    let sanitized = input;

    // Remove zero-width characters
    sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Remove system tags
    sanitized = sanitized.replace(/\[system\]/gi, '');
    sanitized = sanitized.replace(/<\/?system>/gi, '');

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Truncate if too long
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000);
    }

    return sanitized.trim();
  }
}

export const promptGuard = new PromptGuard();
