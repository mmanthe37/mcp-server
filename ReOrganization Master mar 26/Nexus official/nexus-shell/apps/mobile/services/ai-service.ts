/**
 * AI Service — Mobile-side AI orchestration layer.
 * Bridges the AI models package with React Native UI.
 */

import {
  CommandPredictor,
} from '@nexus-shell/ai-models/src/command-predictor';
import { AIEngine } from '@nexus-shell/ai-models/src/engine';
import type { Prediction, CommandContext } from '@nexus-shell/ai-models/src/types';
import { translateToShell, type TranslationResult } from '@nexus-shell/ai-models/src/nl-to-shell';
import { diagnoseError, type ErrorDiagnosis } from '@nexus-shell/ai-models/src/error-diagnosis';

export type { Prediction as CommandSuggestion, TranslationResult, ErrorDiagnosis };

export interface AiServiceConfig {
  enabled: boolean;
  maxSuggestions: number;
  autoCorrect: boolean;
  nlEnabled: boolean;
  errorDiagnosisEnabled: boolean;
}

const DEFAULT_CONFIG: AiServiceConfig = {
  enabled: true,
  maxSuggestions: 5,
  autoCorrect: false,
  nlEnabled: true,
  errorDiagnosisEnabled: true,
};

let config = { ...DEFAULT_CONFIG };
let commandHistory: string[] = [];
const MAX_HISTORY = 500;

let predictor: CommandPredictor | null = null;

function getPredictor(): CommandPredictor {
  if (!predictor) {
    const engine = new AIEngine();
    predictor = new CommandPredictor(engine);
  }
  return predictor;
}

export function configureAiService(partial: Partial<AiServiceConfig>): void {
  config = { ...config, ...partial };
}

export function getAiConfig(): AiServiceConfig {
  return { ...config };
}

export function addToCommandHistory(command: string): void {
  commandHistory.unshift(command);
  if (commandHistory.length > MAX_HISTORY) {
    commandHistory = commandHistory.slice(0, MAX_HISTORY);
  }
  getPredictor().addToHistory(command);
}

export async function getSuggestions(
  input: string,
  cwd: string = '~',
): Promise<Prediction[]> {
  if (!config.enabled || !input.trim()) return [];

  const context: CommandContext = {
    currentDirectory: cwd,
    shell: 'zsh',
    recentCommands: commandHistory.slice(0, 50),
    environment: {},
  };

  const results = await getPredictor().predict(input, context);
  return results.slice(0, config.maxSuggestions);
}

export async function translateNaturalLanguage(
  query: string,
  cwd?: string,
): Promise<TranslationResult | null> {
  if (!config.enabled || !config.nlEnabled) return null;
  return translateToShell(query, cwd);
}

export function analyzeOutput(output: string): ErrorDiagnosis | null {
  if (!config.enabled || !config.errorDiagnosisEnabled) return null;
  const diagnosis = diagnoseError(output);
  return diagnosis.detected ? diagnosis : null;
}

export function clearHistory(): void {
  commandHistory = [];
}

export function getCommandHistory(): string[] {
  return [...commandHistory];
}
