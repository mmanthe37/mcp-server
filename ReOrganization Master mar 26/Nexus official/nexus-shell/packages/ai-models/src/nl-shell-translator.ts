import type { ShellTranslation, CommandContext } from './types';
import { AIEngine } from './engine';

export class NLShellTranslator {
  private engine: AIEngine;
  private translationCache = new Map<string, ShellTranslation>();

  constructor(engine: AIEngine) {
    this.engine = engine;
  }

  async translate(naturalLanguage: string, context: CommandContext): Promise<ShellTranslation> {
    const cacheKey = `${naturalLanguage}:${context.shell}:${context.currentDirectory}`;
    if (this.translationCache.has(cacheKey)) return this.translationCache.get(cacheKey)!;

    // Rule-based translations for common patterns (fast path)
    const ruleResult = this.tryRuleBasedTranslation(naturalLanguage, context);
    if (ruleResult) {
      this.translationCache.set(cacheKey, ruleResult);
      return ruleResult;
    }

    // ML model translation
    try {
      const result = await this.engine.infer<ShellTranslation>('nl-to-shell', {
        query: naturalLanguage,
        shell: context.shell,
        cwd: context.currentDirectory,
        env: context.environment,
      });
      const translation = result.output;
      this.translationCache.set(cacheKey, translation);
      return translation;
    } catch {
      return {
        command: '',
        explanation: 'Unable to translate — ML model unavailable',
        confidence: 0,
        alternatives: [],
        warnings: ['AI translation service unavailable'],
      };
    }
  }

  private tryRuleBasedTranslation(query: string, context: CommandContext): ShellTranslation | null {
    const q = query.toLowerCase().trim();
    const shell = context.shell;

    const rules: Array<{ match: RegExp; generate: (m: RegExpMatchArray) => ShellTranslation }> = [
      {
        match: /^(?:list|show|ls)\s+(?:all\s+)?files?$/,
        generate: () => ({
          command: 'ls -la',
          explanation: 'Lists all files including hidden ones with details',
          confidence: 0.95,
          alternatives: ['ls -lah', 'ls -la --color=auto'],
          warnings: [],
        }),
      },
      {
        match: /^find\s+(?:files?\s+)?(?:named?|called)\s+"?(.+?)"?\s*$/,
        generate: (m) => ({
          command: `find . -name "${m[1]}"`,
          explanation: `Searches for files named "${m[1]}" in current directory tree`,
          confidence: 0.9,
          alternatives: [`find . -iname "${m[1]}"`, `fd "${m[1]}"`],
          warnings: [],
        }),
      },
      {
        match: /^(?:what is|show|check)\s+(?:my\s+)?(?:disk|storage)\s+(?:usage|space)/,
        generate: () => ({
          command: 'df -h',
          explanation: 'Shows disk space usage in human-readable format',
          confidence: 0.9,
          alternatives: ['du -sh *', 'df -h .'],
          warnings: [],
        }),
      },
      {
        match: /^(?:kill|stop|terminate)\s+(?:process|pid)\s+(\d+)/,
        generate: (m) => ({
          command: `kill ${m[1]}`,
          explanation: `Sends SIGTERM to process ${m[1]}`,
          confidence: 0.95,
          alternatives: [`kill -9 ${m[1]}`, `kill -SIGINT ${m[1]}`],
          warnings: ['Verify PID before killing — wrong PID could terminate important processes'],
        }),
      },
      {
        match: /^(?:search|grep|find)\s+(?:for\s+)?"?(.+?)"?\s+in\s+(?:all\s+)?(?:files?|code)/,
        generate: (m) => ({
          command: `grep -rn "${m[1]}" .`,
          explanation: `Recursively searches for "${m[1]}" with line numbers`,
          confidence: 0.9,
          alternatives: [`rg "${m[1]}"`, `grep -rl "${m[1]}" .`],
          warnings: [],
        }),
      },
      {
        match: /^(?:show|check|what)\s+(?:processes?|running)/,
        generate: () => ({
          command: shell.includes('zsh') || shell.includes('bash') ? 'ps aux | head -20' : 'ps aux',
          explanation: 'Shows running processes',
          confidence: 0.85,
          alternatives: ['top', 'htop', 'ps aux --sort=-%mem | head -20'],
          warnings: [],
        }),
      },
    ];

    for (const rule of rules) {
      const match = q.match(rule.match);
      if (match) return rule.generate(match);
    }

    return null;
  }

  clearCache(): void {
    this.translationCache.clear();
  }
}
