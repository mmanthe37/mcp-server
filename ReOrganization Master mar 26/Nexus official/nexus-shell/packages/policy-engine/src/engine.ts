/**
 * Command Risk Classification Engine
 * Evaluates shell commands against policy rules to determine risk level.
 * Supports regex patterns, user-defined rules, and context-aware evaluation.
 */

import type { PolicyRule, PolicyDecision, RiskLevel } from '@nexus-shell/shared-types';

export interface PolicyEngineConfig {
  rules: PolicyRule[];
  defaultRiskLevel: RiskLevel;
  allowOverride: boolean;
}

export class PolicyEngine {
  private rules: PolicyRule[];
  private compiledPatterns: Map<string, RegExp> = new Map();
  private defaultRiskLevel: RiskLevel;
  private allowOverride: boolean;

  constructor(config: PolicyEngineConfig) {
    this.rules = config.rules;
    this.defaultRiskLevel = config.defaultRiskLevel;
    this.allowOverride = config.allowOverride;
    this.compilePatterns();
  }

  evaluate(command: string): PolicyDecision {
    const trimmed = command.trim();
    const matchedRules: string[] = [];
    let highestRisk: RiskLevel = this.defaultRiskLevel;
    let requiresConfirmation = false;
    let requiresBiometric = false;

    for (const rule of this.rules) {
      const pattern = this.compiledPatterns.get(rule.id);
      if (pattern?.test(trimmed)) {
        matchedRules.push(rule.id);
        if (this.riskSeverity(rule.riskLevel) > this.riskSeverity(highestRisk)) {
          highestRisk = rule.riskLevel;
        }
        if (rule.requiresConfirmation) requiresConfirmation = true;
        if (rule.requiresBiometric) requiresBiometric = true;
      }
    }

    // Pipe chain analysis — check each command in a pipeline
    if (trimmed.includes('|')) {
      const subCommands = trimmed.split('|').map(s => s.trim());
      for (const sub of subCommands) {
        const subDecision = this.evaluateSingle(sub);
        if (this.riskSeverity(subDecision.riskLevel) > this.riskSeverity(highestRisk)) {
          highestRisk = subDecision.riskLevel;
          matchedRules.push(...subDecision.matchedRules);
          if (subDecision.requiresConfirmation) requiresConfirmation = true;
        }
      }
    }

    return {
      command: trimmed,
      riskLevel: highestRisk,
      matchedRules,
      allowed: highestRisk !== 'dangerous' || this.allowOverride,
      requiresConfirmation,
      reason: matchedRules.length > 0
        ? `Matched ${matchedRules.length} policy rule(s)`
        : undefined,
    };
  }

  addRule(rule: PolicyRule): void {
    this.rules.push(rule);
    try {
      this.compiledPatterns.set(rule.id, new RegExp(rule.pattern, 'i'));
    } catch {
      // Invalid regex — skip
    }
  }

  removeRule(ruleId: string): boolean {
    const idx = this.rules.findIndex(r => r.id === ruleId);
    if (idx >= 0) {
      this.rules.splice(idx, 1);
      this.compiledPatterns.delete(ruleId);
      return true;
    }
    return false;
  }

  private evaluateSingle(command: string): PolicyDecision {
    const matchedRules: string[] = [];
    let highestRisk: RiskLevel = this.defaultRiskLevel;
    let requiresConfirmation = false;

    for (const rule of this.rules) {
      const pattern = this.compiledPatterns.get(rule.id);
      if (pattern?.test(command)) {
        matchedRules.push(rule.id);
        if (this.riskSeverity(rule.riskLevel) > this.riskSeverity(highestRisk)) {
          highestRisk = rule.riskLevel;
        }
        if (rule.requiresConfirmation) requiresConfirmation = true;
      }
    }

    return {
      command,
      riskLevel: highestRisk,
      matchedRules,
      allowed: true,
      requiresConfirmation,
    };
  }

  private compilePatterns(): void {
    for (const rule of this.rules) {
      try {
        this.compiledPatterns.set(rule.id, new RegExp(rule.pattern, 'i'));
      } catch {
        // Invalid regex — skip rule
      }
    }
  }

  private riskSeverity(level: RiskLevel): number {
    switch (level) {
      case 'safe': return 0;
      case 'elevated': return 1;
      case 'dangerous': return 2;
      default: return 0;
    }
  }
}
