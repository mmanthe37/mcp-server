import type { PolicyRule } from '@nexus-shell/shared-types';

export const DEFAULT_RULES: PolicyRule[] = [
  // Dangerous operations
  { id: 'rm-rf-root', name: 'Remove root', pattern: 'rm\\s+(-[a-zA-Z]*f[a-zA-Z]*\\s+)?/', riskLevel: 'dangerous', requiresConfirmation: true, requiresBiometric: true, description: 'Recursive deletion from root' },
  { id: 'rm-rf', name: 'Force recursive delete', pattern: 'rm\\s+-[a-zA-Z]*r[a-zA-Z]*f|rm\\s+-[a-zA-Z]*f[a-zA-Z]*r', riskLevel: 'dangerous', requiresConfirmation: true, requiresBiometric: true, description: 'Forced recursive deletion' },
  { id: 'mkfs', name: 'Format filesystem', pattern: 'mkfs', riskLevel: 'dangerous', requiresConfirmation: true, requiresBiometric: true, description: 'Filesystem formatting' },
  { id: 'dd-disk', name: 'Disk destroyer', pattern: 'dd\\s+.*of=/dev/', riskLevel: 'dangerous', requiresConfirmation: true, requiresBiometric: true, description: 'Raw disk write' },
  { id: 'fork-bomb', name: 'Fork bomb', pattern: ':\\(\\)\\{\\s*:\\|:', riskLevel: 'dangerous', requiresConfirmation: true, requiresBiometric: true, description: 'Fork bomb pattern' },

  // Elevated operations
  { id: 'sudo', name: 'Sudo prefix', pattern: '^sudo\\s+', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false, description: 'Superuser execution' },
  { id: 'chmod-777', name: 'World-writable perms', pattern: 'chmod\\s+777', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false, description: 'World-writable permissions' },
  { id: 'chown-root', name: 'Change to root owner', pattern: 'chown\\s+root', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false, description: 'Ownership change to root' },
  { id: 'iptables', name: 'Firewall rules', pattern: 'iptables|ufw|firewall-cmd', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false, description: 'Firewall modification' },
  { id: 'systemctl', name: 'Service control', pattern: 'systemctl\\s+(stop|disable|mask)', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false, description: 'Service stop/disable' },
  { id: 'curl-exec', name: 'Remote code execution', pattern: 'curl.*\\|\\s*(sh|bash|zsh)', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false, description: 'Piped remote execution' },
  { id: 'env-var-secrets', name: 'Secret export', pattern: 'export\\s+.*(PASSWORD|SECRET|KEY|TOKEN)\\s*=', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false, description: 'Environment secret assignment' },
  { id: 'kill-all', name: 'Kill all processes', pattern: 'kill\\s+-9\\s+-1|killall', riskLevel: 'elevated', requiresConfirmation: true, requiresBiometric: false, description: 'Mass process termination' },
];
