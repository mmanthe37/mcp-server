/**
 * Policy Service — Client-side command risk evaluation and policy enforcement.
 * Checks commands against policy rules before execution.
 */

export interface PolicyCheckResult {
  allowed: boolean;
  riskLevel: 'safe' | 'elevated' | 'dangerous';
  requiresConfirmation: boolean;
  message?: string;
  alternatives?: string[];
}

const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+(-rf?|--force)\s+[/~]/, message: 'Recursive delete on root or home directory' },
  { pattern: />\s*\/dev\/[a-z]+/, message: 'Writing to device file' },
  { pattern: /mkfs\./, message: 'Filesystem format operation' },
  { pattern: /dd\s+if=.*of=\/dev/, message: 'Low-level disk write' },
  { pattern: /chmod\s+(-R\s+)?777/, message: 'Setting world-writable permissions' },
  { pattern: /:(){ :\|:& };:/, message: 'Fork bomb detected' },
  { pattern: />\s*\/etc\//, message: 'Writing to system configuration' },
  { pattern: /shutdown|reboot|halt|poweroff/, message: 'System shutdown/reboot command' },
  { pattern: /curl.*\|\s*(ba)?sh/, message: 'Piping remote content to shell' },
  { pattern: /wget.*\|\s*(ba)?sh/, message: 'Piping remote download to shell' },
];

const ELEVATED_PATTERNS = [
  { pattern: /sudo\s+/, message: 'Requires elevated privileges' },
  { pattern: /rm\s+(-r|--recursive)/, message: 'Recursive delete' },
  { pattern: /kill\s+(-9|-KILL)\s+/, message: 'Force kill process' },
  { pattern: /chmod\s+/, message: 'Changing file permissions' },
  { pattern: /chown\s+/, message: 'Changing file ownership' },
  { pattern: /iptables|firewall/, message: 'Firewall modification' },
  { pattern: /systemctl\s+(stop|restart|disable)/, message: 'Service management' },
  { pattern: /docker\s+(rm|rmi|prune|system)/, message: 'Docker cleanup operation' },
  { pattern: /npm\s+publish/, message: 'Package publish' },
  { pattern: /git\s+(push\s+--force|reset\s+--hard)/, message: 'Destructive git operation' },
];

export function evaluateCommand(command: string): PolicyCheckResult {
  const trimmed = command.trim();

  // Check dangerous patterns first
  for (const { pattern, message } of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        riskLevel: 'dangerous',
        requiresConfirmation: true,
        message: `⚠️ DANGEROUS: ${message}`,
        alternatives: ['Review the command carefully before proceeding'],
      };
    }
  }

  // Check elevated patterns
  for (const { pattern, message } of ELEVATED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: true,
        riskLevel: 'elevated',
        requiresConfirmation: true,
        message: `⚡ Elevated: ${message}`,
      };
    }
  }

  return {
    allowed: true,
    riskLevel: 'safe',
    requiresConfirmation: false,
  };
}

export function formatPolicyResult(result: PolicyCheckResult): string {
  if (result.riskLevel === 'safe') return '';
  const icon = result.riskLevel === 'dangerous' ? '🛑' : '⚠️';
  return `${icon} ${result.message}`;
}

export function shouldBlockCommand(result: PolicyCheckResult): boolean {
  return result.riskLevel === 'dangerous' && !result.allowed;
}
