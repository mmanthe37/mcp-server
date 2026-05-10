export interface Prediction {
  text: string;
  confidence: number;
  source: 'history' | 'model' | 'contextual';
  explanation?: string;
}

export interface ShellTranslation {
  command: string;
  explanation: string;
  confidence: number;
  alternatives: string[];
  warnings: string[];
}

export interface Diagnosis {
  errorType: string;
  summary: string;
  cause: string;
  suggestions: DiagnosisSuggestion[];
  confidence: number;
}

export interface DiagnosisSuggestion {
  command: string;
  description: string;
  risk: 'safe' | 'elevated' | 'dangerous';
}

export interface ModelMetadata {
  name: string;
  version: string;
  size: number;
  quantized: boolean;
  inputShape: number[];
  outputShape: number[];
}

export interface InferenceResult<T = unknown> {
  output: T;
  latencyMs: number;
  modelVersion: string;
}

export interface CommandContext {
  currentDirectory: string;
  shell: string;
  recentCommands: string[];
  environment: Record<string, string>;
  exitCode?: number;
  errorOutput?: string;
}
