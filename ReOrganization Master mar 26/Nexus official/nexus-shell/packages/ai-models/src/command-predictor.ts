import type { Prediction, CommandContext } from './types';
import { AIEngine } from './engine';

export class CommandPredictor {
  private engine: AIEngine;
  private history: string[] = [];
  private frequencyMap = new Map<string, number>();
  private contextPatterns = new Map<string, string[]>();

  constructor(engine: AIEngine) {
    this.engine = engine;
  }

  addToHistory(command: string): void {
    this.history.push(command);
    if (this.history.length > 10000) this.history.shift();
    this.frequencyMap.set(command, (this.frequencyMap.get(command) ?? 0) + 1);

    // Track command sequences for contextual prediction
    if (this.history.length >= 2) {
      const prev = this.history[this.history.length - 2];
      const existing = this.contextPatterns.get(prev) ?? [];
      existing.push(command);
      this.contextPatterns.set(prev, existing.slice(-20));
    }
  }

  async predict(partial: string, context: CommandContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    // History-based prefix matching
    const historyMatches = this.getHistoryPredictions(partial);
    predictions.push(...historyMatches);

    // Contextual predictions based on previous command
    if (context.recentCommands.length > 0) {
      const lastCmd = context.recentCommands[context.recentCommands.length - 1];
      const contextual = this.getContextualPredictions(lastCmd, partial);
      predictions.push(...contextual);
    }

    // Directory-aware predictions
    const dirPredictions = this.getDirectoryPredictions(partial, context.currentDirectory);
    predictions.push(...dirPredictions);

    // ML model prediction (if available)
    try {
      const modelPredictions = await this.getModelPredictions(partial, context);
      predictions.push(...modelPredictions);
    } catch {
      // ML inference not available — degrade gracefully
    }

    // Deduplicate and sort by confidence
    const seen = new Set<string>();
    return predictions
      .filter((p) => {
        if (seen.has(p.text)) return false;
        seen.add(p.text);
        return true;
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
  }

  private getHistoryPredictions(partial: string): Prediction[] {
    if (!partial) return [];
    const lower = partial.toLowerCase();
    return Array.from(this.frequencyMap.entries())
      .filter(([cmd]) => cmd.toLowerCase().startsWith(lower))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd, freq]) => ({
        text: cmd,
        confidence: Math.min(0.9, 0.3 + freq * 0.05),
        source: 'history' as const,
      }));
  }

  private getContextualPredictions(lastCommand: string, partial: string): Prediction[] {
    const followers = this.contextPatterns.get(lastCommand) ?? [];
    if (followers.length === 0) return [];

    const freq = new Map<string, number>();
    for (const cmd of followers) freq.set(cmd, (freq.get(cmd) ?? 0) + 1);

    return Array.from(freq.entries())
      .filter(([cmd]) => !partial || cmd.toLowerCase().startsWith(partial.toLowerCase()))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cmd, count]) => ({
        text: cmd,
        confidence: Math.min(0.85, count / followers.length),
        source: 'contextual' as const,
        explanation: `Often follows "${lastCommand}"`,
      }));
  }

  private getDirectoryPredictions(partial: string, _cwd: string): Prediction[] {
    // Common directory-context patterns
    const patterns: Record<string, string[]> = {
      'git ': ['git status', 'git add .', 'git commit -m ""', 'git push', 'git pull', 'git log --oneline'],
      'npm ': ['npm install', 'npm run dev', 'npm run build', 'npm test', 'npm run lint'],
      'docker ': ['docker ps', 'docker compose up', 'docker build .', 'docker logs'],
    };

    for (const [prefix, commands] of Object.entries(patterns)) {
      if (partial.startsWith(prefix)) {
        return commands
          .filter((c) => c.startsWith(partial))
          .map((c) => ({ text: c, confidence: 0.6, source: 'contextual' as const }));
      }
    }
    return [];
  }

  private async getModelPredictions(partial: string, context: CommandContext): Promise<Prediction[]> {
    const result = await this.engine.infer<string[]>('command-predictor', {
      partial,
      cwd: context.currentDirectory,
      shell: context.shell,
      recent: context.recentCommands.slice(-5),
    });
    return (result.output ?? []).map((text: string, i: number) => ({
      text,
      confidence: 0.8 - i * 0.1,
      source: 'model' as const,
    }));
  }
}
