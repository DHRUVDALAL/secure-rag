import { logger } from '../utils/logger';

interface MaskingRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

const MASKING_RULES: MaskingRule[] = [
  {
    name: 'Email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL REDACTED]',
  },
  {
    name: 'Phone (US)',
    pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    replacement: '[PHONE REDACTED]',
  },
  {
    name: 'Phone (International)',
    pattern: /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
    replacement: '[PHONE REDACTED]',
  },
  {
    name: 'SSN',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN REDACTED]',
  },
  {
    name: 'Credit Card',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    replacement: '[CARD NUMBER REDACTED]',
  },
  {
    name: 'IP Address',
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[IP REDACTED]',
  },
  {
    name: 'Bank Account',
    pattern: /\b\d{8,17}\b(?=.*(?:account|routing|bank))/gi,
    replacement: '[ACCOUNT NUMBER REDACTED]',
  },
  {
    name: 'API Key Pattern',
    pattern: /\b(sk|pk|api|key|token|secret)[-_]?[A-Za-z0-9]{20,}\b/gi,
    replacement: '[API KEY REDACTED]',
  },
];

export class DataMasker {
  private rules: MaskingRule[];

  constructor(additionalRules: MaskingRule[] = []) {
    this.rules = [...MASKING_RULES, ...additionalRules];
  }

  // Mask sensitive data in text
  mask(text: string): { masked: string; redactionsCount: number; redactedTypes: string[] } {
    let masked = text;
    let redactionsCount = 0;
    const redactedTypes: Set<string> = new Set();

    for (const rule of this.rules) {
      const matches = masked.match(rule.pattern);
      if (matches) {
        redactionsCount += matches.length;
        redactedTypes.add(rule.name);
        masked = masked.replace(rule.pattern, rule.replacement);
      }
    }

    if (redactionsCount > 0) {
      logger.info('Sensitive data masked', {
        redactionsCount,
        types: Array.from(redactedTypes),
      });
    }

    return {
      masked,
      redactionsCount,
      redactedTypes: Array.from(redactedTypes),
    };
  }

  // Check if text contains sensitive data without masking
  containsSensitiveData(text: string): boolean {
    return this.rules.some((rule) => rule.pattern.test(text));
  }
}

export const dataMasker = new DataMasker();
