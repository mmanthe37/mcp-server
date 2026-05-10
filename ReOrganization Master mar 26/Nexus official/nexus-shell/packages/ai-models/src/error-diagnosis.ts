/**
 * Error Diagnosis — Context-aware error analysis and remediation suggestions.
 * Analyzes terminal output to detect errors, classify severity, and suggest fixes.
 */

export interface ErrorDiagnosis {
  detected: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: ErrorCategory;
  message: string;
  suggestions: string[];
  relatedDocs?: string[];
}

export type ErrorCategory =
  | 'permission_denied'
  | 'file_not_found'
  | 'command_not_found'
  | 'syntax_error'
  | 'network_error'
  | 'dependency_error'
  | 'resource_error'
  | 'git_error'
  | 'docker_error'
  | 'unknown';

interface ErrorPattern {
  pattern: RegExp;
  category: ErrorCategory;
  severity: ErrorDiagnosis['severity'];
  suggestions: (match: RegExpMatchArray) => string[];
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /permission denied/i,
    category: 'permission_denied',
    severity: 'error',
    suggestions: () => [
      'Try running with sudo: sudo <command>',
      'Check file permissions: ls -la <file>',
      'Fix permissions: chmod +x <file>',
    ],
  },
  {
    pattern: /(?:no such file or directory|ENOENT)(?::?\s*)?(.+)?/i,
    category: 'file_not_found',
    severity: 'error',
    suggestions: (m) => {
      const file = m[1]?.trim();
      return [
        file ? `Verify the path exists: ls -la "${file}"` : 'Check if the path exists',
        'Check for typos in the filename',
        'Use find to locate the file: find . -name "<filename>"',
      ];
    },
  },
  {
    pattern: /command not found:?\s*(.+)/i,
    category: 'command_not_found',
    severity: 'error',
    suggestions: (m) => {
      const cmd = m[1]?.trim();
      return [
        cmd ? `Install ${cmd}: brew install ${cmd} (macOS) or apt install ${cmd} (Linux)` : 'Install the missing command',
        'Check if it\'s in your PATH: echo $PATH',
        cmd ? `Search for it: which ${cmd} || whereis ${cmd}` : 'Use which or whereis to find it',
      ];
    },
  },
  {
    pattern: /syntax error|unexpected token/i,
    category: 'syntax_error',
    severity: 'error',
    suggestions: () => [
      'Check for missing quotes, brackets, or parentheses',
      'Verify the command syntax with: man <command>',
      'Use shellcheck to validate scripts: shellcheck script.sh',
    ],
  },
  {
    pattern: /(?:connection refused|ECONNREFUSED|network (?:is )?unreachable|could not resolve host)/i,
    category: 'network_error',
    severity: 'error',
    suggestions: () => [
      'Check your internet connection: ping -c 3 google.com',
      'Verify the service is running on the expected port',
      'Check DNS resolution: nslookup <hostname>',
      'Look for firewall blocking: sudo iptables -L',
    ],
  },
  {
    pattern: /(?:module not found|cannot find module|ModuleNotFoundError|ImportError)/i,
    category: 'dependency_error',
    severity: 'error',
    suggestions: () => [
      'Install missing dependencies: npm install / pip install -r requirements.txt',
      'Check if the module name is correct',
      'Verify your virtual environment is activated',
      'Clear cache and reinstall: rm -rf node_modules && npm install',
    ],
  },
  {
    pattern: /(?:out of memory|ENOMEM|killed|oom-killer)/i,
    category: 'resource_error',
    severity: 'critical',
    suggestions: () => [
      'Free up memory: check running processes with top or htop',
      'Increase swap space or memory limits',
      'Try processing data in smaller chunks',
      'Check for memory leaks in your application',
    ],
  },
  {
    pattern: /(?:disk full|no space left|ENOSPC)/i,
    category: 'resource_error',
    severity: 'critical',
    suggestions: () => [
      'Check disk usage: df -h',
      'Find large files: du -sh * | sort -rh | head',
      'Clean up: docker system prune, npm cache clean --force',
      'Remove old logs: find /var/log -name "*.log" -mtime +30 -delete',
    ],
  },
  {
    pattern: /fatal: (?:not a git repository|remote .+ already exists|refusing to merge)/i,
    category: 'git_error',
    severity: 'error',
    suggestions: () => [
      'Initialize git: git init',
      'Check remote: git remote -v',
      'Resolve merge conflicts, then: git add . && git commit',
      'Force pull (careful!): git pull --rebase',
    ],
  },
  {
    pattern: /(?:docker daemon|Cannot connect to the Docker|docker:? Error)/i,
    category: 'docker_error',
    severity: 'error',
    suggestions: () => [
      'Start Docker: open -a Docker (macOS) or systemctl start docker (Linux)',
      'Check Docker status: docker info',
      'Restart Docker daemon',
      'Add user to docker group: sudo usermod -aG docker $USER',
    ],
  },
];

export function diagnoseError(output: string): ErrorDiagnosis {
  const lines = output.split('\n');

  for (const line of lines) {
    for (const pattern of ERROR_PATTERNS) {
      const match = line.match(pattern.pattern);
      if (match) {
        return {
          detected: true,
          severity: pattern.severity,
          category: pattern.category,
          message: line.trim(),
          suggestions: pattern.suggestions(match),
        };
      }
    }
  }

  // Check for generic error indicators
  const hasError = lines.some((l) =>
    /^(error|fatal|failed|abort)/i.test(l.trim()),
  );

  if (hasError) {
    return {
      detected: true,
      severity: 'warning',
      category: 'unknown',
      message: lines.find((l) => /^(error|fatal|failed|abort)/i.test(l.trim()))?.trim() || 'Unknown error',
      suggestions: [
        'Review the full error output above',
        'Search online for the error message',
        'Check application logs for more details',
      ],
    };
  }

  return {
    detected: false,
    severity: 'info',
    category: 'unknown',
    message: '',
    suggestions: [],
  };
}

export function getErrorSeverityColor(severity: ErrorDiagnosis['severity']): string {
  switch (severity) {
    case 'info': return '#5AC8FA';
    case 'warning': return '#FF9500';
    case 'error': return '#FF3B30';
    case 'critical': return '#FF2D55';
    default: return '#8E8E93';
  }
}

export function formatDiagnosisForDisplay(diagnosis: ErrorDiagnosis): string {
  if (!diagnosis.detected) return '';
  const lines = [
    `⚠️ ${diagnosis.severity.toUpperCase()}: ${diagnosis.category.replace(/_/g, ' ')}`,
    diagnosis.message,
    '',
    'Suggestions:',
    ...diagnosis.suggestions.map((s, i) => `  ${i + 1}. ${s}`),
  ];
  return lines.join('\n');
}
