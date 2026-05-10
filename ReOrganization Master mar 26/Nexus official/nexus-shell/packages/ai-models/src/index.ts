// NexusShell AI Models — On-device ML inference engine
// Uses TensorFlow Lite (cross-platform) with Core ML bridge (iOS)

export { AIEngine, type AIEngineConfig } from './engine';
export { CommandPredictor } from './command-predictor';
export { NLShellTranslator } from './nl-shell-translator';
export { ErrorDiagnostics } from './error-diagnostics';
export type { Prediction, ShellTranslation, Diagnosis } from './types';
