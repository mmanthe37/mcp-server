import type { Diagnosis, DiagnosisSuggestion, CommandContext } from './types';
import { AIEngine } from './engine';

export class ErrorDiagnostics {
  private engine: AIEngine;

  constructor(engine: AIEngine) {
    this.engine = engine;
  }

  async diagnose(context: CommandContext): Promise<Diagnosis> {
    const errorOutput = context.errorOutput ?? '';
    const exitCode = context.exitCode ?? 1;

    // Pattern-matching diagnostics (fast, no ML needed)
    const patternResult = this.patternMatch(errorOutput, exitCode, context);
    if (patternResult && patternResult.confidence >= 0.8) return patternResult;

    // ML-based diagnosis
    try {
      const result = await this.engine.infer<Diagnosis>('error-diagnostics', {
        error: errorOutput,
        exitCode,
        command: context.recentCommands[context.recentCommands.length - 1],
        cwd: context.currentDirectory,
        shell: context.shell,
      });
      return result.output;
    } catch {
      return patternResult ?? {
        errorType: 'unknown',
        summary: 'Unable to diagnose error',
        cause: `Command exited with code ${exitCode}`,
        suggestions: [],
        confidence: 0.1,
      };
    }
  }

  private patternMatch(error: string, exitCode: number, context: CommandContext): Diagnosis | null {
    const patterns: Array<{
      match: RegExp;
      diagnose: (m: RegExpMatchArray) => Diagnosis;
    }> = [
      {
        match: /command not found:\s*(\S+)/i,
        diagnose: (m) => ({
          errorType: 'command_not_found',
          summary: `Command "${m[1]}" is not installed or not in PATH`,
          cause: `The shell could not find an executable named "${m[1]}"`,
          suggestions: this.commandNotFoundSuggestions(m[1]),
          confidence: 0.95,
        }),
      },
      {
        match: /permission denied/i,
        diagnose: () => {
          const lastCmd = context.recentCommands[context.recentCommands.length - 1] ?? '';
          return {
            errorType: 'permission_denied',
            summary: 'Insufficient permissions to execute this operation',
            cause: 'The current user lacks the required permissions',
            suggestions: [
              { command: `sudo ${lastCmd}`, description: 'Run with elevated privileges', risk: 'elevated' },
              { command: `ls -la ${context.currentDirectory}`, description: 'Check file permissions', risk: 'safe' },
              { command: `chmod +x ${lastCmd.split(' ').pop()}`, description: 'Make file executable', risk: 'safe' },
            ],
            confidence: 0.9,
          };
        },
      },
      {
        match: /no such file or directory:\s*(.+)/i,
        diagnose: (m) => ({
          errorType: 'file_not_found',
          summary: `File or directory "${m[1].trim()}" does not exist`,
          cause: 'The specified path was not found',
          suggestions: [
            { command: `ls -la ${m[1].trim().split('/').slice(0, -1).join('/') || '.'}`, description: 'List parent directory', risk: 'safe' },
            { command: `find . -name "${m[1].trim().split('/').pop()}"`, description: 'Search for the file', risk: 'safe' },
          ],
          confidence: 0.9,
        }),
      },
      {
        match: /ECONNREFUSED|connection refused/i,
        diagnose: () => ({
          errorType: 'connection_refused',
          summary: 'Connection to remote service was refused',
          cause: 'The target service is not running or the port is blocked',
          suggestions: [
            { command: 'netstat -tlnp 2>/dev/null || ss -tlnp', description: 'Check listening ports', risk: 'safe' },
            { command: 'ping -c 3 localhost', description: 'Test network connectivity', risk: 'safe' },
          ],
          confidence: 0.85,
        }),
      },
      {
        match: /out of memory|oom|cannot allocate/i,
        diagnose: () => ({
          errorType: 'out_of_memory',
          summary: 'System ran out of available memory',
          cause: 'The process requested more memory than available',
          suggestions: [
            { command: 'free -h || vm_stat', description: 'Check memory usage', risk: 'safe' },
            { command: 'ps aux --sort=-%mem | head -10', description: 'Find memory-hungry processes', risk: 'safe' },
          ],
          confidence: 0.85,
        }),
      },
      {
        match: /ENOSPC|no space left on device/i,
        diagnose: () => ({
          errorType: 'disk_full',
          summary: 'No disk space remaining',
          cause: 'The filesystem is full',
          suggestions: [
            { command: 'df -h', description: 'Check disk usage', risk: 'safe' },
            { command: 'du -sh * | sort -hr | head -10', description: 'Find largest directories', risk: 'safe' },
          ],
          confidence: 0.95,
        }),
      },
    ];

    for (const pattern of patterns) {
      const match = error.match(pattern.match);
      if (match) return pattern.diagnose(match);
    }

    // Exit code based diagnosis
    if (exitCode === 126) {
      return {
        errorType: 'not_executable',
        summary: 'File is not executable',
        cause: 'The file exists but lacks execute permission',
        suggestions: [{ command: 'chmod +x <file>', description: 'Add execute permission', risk: 'safe' }],
        confidence: 0.8,
      };
    }

    if (exitCode === 130) {
      return {
        errorType: 'interrupted',
        summary: 'Process was interrupted (Ctrl+C)',
        cause: 'User sent SIGINT signal',
        suggestions: [],
        confidence: 0.95,
      };
    }

    return null;
  }

  private commandNotFoundSuggestions(cmd: string): DiagnosisSuggestion[] {
    const packageManagers: Record<string, string> = {
      brew: 'brew install',
      apt: 'apt install',
      yum: 'yum install',
      dnf: 'dnf install',
      pacman: 'pacman -S',
    };

    const knownPackages: Record<string, string> = {
      node: 'nodejs', npm: 'nodejs', npx: 'nodejs',
      python3: 'python3', pip: 'python3',
      git: 'git', curl: 'curl', wget: 'wget',
      docker: 'docker', jq: 'jq', rg: 'ripgrep',
      fd: 'fd-find', bat: 'bat', exa: 'eza',
    };

    const suggestions: DiagnosisSuggestion[] = [
      { command: `which ${cmd}`, description: 'Check if command exists in PATH', risk: 'safe' },
      { command: `type ${cmd}`, description: 'Check command type and location', risk: 'safe' },
    ];

    const pkg = knownPackages[cmd];
    if (pkg) {
      for (const [mgr, installCmd] of Object.entries(packageManagers)) {
        suggestions.push({
          command: `${installCmd} ${pkg}`,
          description: `Install via ${mgr}`,
          risk: 'elevated',
        });
      }
    }

    return suggestions;
  }
}
