/**
 * PolicyService — Server-side policy enforcement for command execution.
 * Integrates with the shared policy-engine package for risk classification
 * and adds server-level enforcement, persistence, and audit integration.
 */

export interface PolicyRule {
  id: string;
  name: string;
  pattern: string;
  riskLevel: 'safe' | 'elevated' | 'dangerous' | 'blocked';
  action: 'allow' | 'confirm' | 'deny' | 'audit';
  scope: 'global' | 'user' | 'device' | 'session';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;
}

export interface PolicyEvaluation {
  command: string;
  riskLevel: PolicyRule['riskLevel'];
  action: PolicyRule['action'];
  matchedRules: string[];
  requiresConfirmation: boolean;
  redactedCommand: string;
  timestamp: Date;
}

export interface PolicyConfig {
  defaultAction: 'allow' | 'confirm' | 'deny';
  elevatedRequiresConfirmation: boolean;
  dangerousRequiresConfirmation: boolean;
  blockedAlwaysDenied: boolean;
  auditAllCommands: boolean;
  maxCommandLength: number;
}

const DEFAULT_CONFIG: PolicyConfig = {
  defaultAction: 'allow',
  elevatedRequiresConfirmation: true,
  dangerousRequiresConfirmation: true,
  blockedAlwaysDenied: true,
  auditAllCommands: false,
  maxCommandLength: 4096,
};

const SENSITIVE_PATTERNS = [
  /password[=:]\S+/gi,
  /token[=:]\S+/gi,
  /secret[=:]\S+/gi,
  /api[_-]?key[=:]\S+/gi,
  /--password\s+\S+/gi,
];

export class PolicyService {
  private rules: Map<string, PolicyRule> = new Map();
  private config: PolicyConfig;

  constructor(config: Partial<PolicyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  addRule(rule: PolicyRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(id: string): boolean {
    return this.rules.delete(id);
  }

  getRule(id: string): PolicyRule | undefined {
    return this.rules.get(id);
  }

  listRules(scope?: PolicyRule['scope']): PolicyRule[] {
    const rules = Array.from(this.rules.values()).filter((r) => r.enabled);
    return scope ? rules.filter((r) => r.scope === scope) : rules;
  }

  evaluate(command: string, context?: { userId?: string; deviceId?: string; sessionId?: string }): PolicyEvaluation {
    if (command.length > this.config.maxCommandLength) {
      return {
        command: command.substring(0, 100) + '...',
        riskLevel: 'blocked',
        action: 'deny',
        matchedRules: ['max-length-exceeded'],
        requiresConfirmation: false,
        redactedCommand: this.redact(command.substring(0, 100) + '...'),
        timestamp: new Date(),
      };
    }

    const matchedRules: string[] = [];
    let highestRisk: PolicyRule['riskLevel'] = 'safe';
    const riskOrder: PolicyRule['riskLevel'][] = ['safe', 'elevated', 'dangerous', 'blocked'];

    const applicableRules = this.getApplicableRules(context);

    for (const rule of applicableRules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(command)) {
          matchedRules.push(rule.id);
          if (riskOrder.indexOf(rule.riskLevel) > riskOrder.indexOf(highestRisk)) {
            highestRisk = rule.riskLevel;
          }
        }
      } catch {
        // Skip invalid regex patterns
      }
    }

    const action = this.determineAction(highestRisk);
    const requiresConfirmation =
      (highestRisk === 'elevated' && this.config.elevatedRequiresConfirmation) ||
      (highestRisk === 'dangerous' && this.config.dangerousRequiresConfirmation);

    return {
      command,
      riskLevel: highestRisk,
      action,
      matchedRules,
      requiresConfirmation,
      redactedCommand: this.redact(command),
      timestamp: new Date(),
    };
  }

  redact(command: string): string {
    let redacted = command;
    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, (match) => {
        const parts = match.split(/[=:]/);
        return parts[0] + '=***REDACTED***';
      });
    }
    return redacted;
  }

  private getApplicableRules(context?: { userId?: string; deviceId?: string; sessionId?: string }): PolicyRule[] {
    return Array.from(this.rules.values()).filter((rule) => {
      if (!rule.enabled) return false;
      if (rule.scope === 'global') return true;
      if (rule.scope === 'user' && context?.userId) return true;
      if (rule.scope === 'device' && context?.deviceId) return true;
      if (rule.scope === 'session' && context?.sessionId) return true;
      return false;
    });
  }

  private determineAction(riskLevel: PolicyRule['riskLevel']): PolicyRule['action'] {
    switch (riskLevel) {
      case 'safe':
        return 'allow';
      case 'elevated':
        return this.config.elevatedRequiresConfirmation ? 'confirm' : 'allow';
      case 'dangerous':
        return this.config.dangerousRequiresConfirmation ? 'confirm' : 'allow';
      case 'blocked':
        return this.config.blockedAlwaysDenied ? 'deny' : 'confirm';
      default:
        return this.config.defaultAction;
    }
  }
}
