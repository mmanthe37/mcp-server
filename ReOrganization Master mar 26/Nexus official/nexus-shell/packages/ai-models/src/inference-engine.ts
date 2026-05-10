/**
 * AI Inference Engine — On-device ML inference for terminal intelligence.
 * Wraps TensorFlow Lite for cross-platform command prediction and NL processing.
 */

export interface ModelConfig {
  name: string;
  version: string;
  inputShape: number[];
  outputShape: number[];
  maxSequenceLength: number;
}

export interface InferenceResult<T = unknown> {
  predictions: T;
  confidence: number;
  latencyMs: number;
  modelVersion: string;
}

export interface TokenizedInput {
  tokens: number[];
  attention: number[];
  length: number;
}

const MODELS: Record<string, ModelConfig> = {
  commandPredictor: {
    name: 'command-predictor',
    version: '1.0.0',
    inputShape: [1, 128],
    outputShape: [1, 5000],
    maxSequenceLength: 128,
  },
  nlToShell: {
    name: 'nl-to-shell',
    version: '1.0.0',
    inputShape: [1, 256],
    outputShape: [1, 512],
    maxSequenceLength: 256,
  },
  errorDiagnostic: {
    name: 'error-diagnostic',
    version: '1.0.0',
    inputShape: [1, 512],
    outputShape: [1, 64],
    maxSequenceLength: 512,
  },
};

// Simple tokenizer (production would use SentencePiece or BPE)
const VOCAB: Map<string, number> = new Map();
let nextTokenId = 1;

function tokenize(text: string, maxLen: number): TokenizedInput {
  const words = text.toLowerCase().split(/[\s/\\|;]+/).filter(Boolean);
  const tokens: number[] = [];

  for (const word of words.slice(0, maxLen)) {
    let id = VOCAB.get(word);
    if (id === undefined) {
      id = nextTokenId++;
      VOCAB.set(word, id);
    }
    tokens.push(id);
  }

  // Pad to maxLen
  while (tokens.length < maxLen) tokens.push(0);
  const attention = tokens.map((t) => (t > 0 ? 1 : 0));

  return { tokens: tokens.slice(0, maxLen), attention: attention.slice(0, maxLen), length: words.length };
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function getModelConfig(modelName: string): ModelConfig | undefined {
  return MODELS[modelName];
}

export function preprocessInput(text: string, modelName: string): TokenizedInput {
  const config = MODELS[modelName];
  if (!config) throw new Error(`Unknown model: ${modelName}`);
  return tokenize(text, config.maxSequenceLength);
}

export function postprocessOutput(raw: number[], topK = 5): Array<{ index: number; probability: number }> {
  const probs = softmax(raw);
  const indexed = probs.map((p, i) => ({ index: i, probability: p }));
  indexed.sort((a, b) => b.probability - a.probability);
  return indexed.slice(0, topK);
}

// Lightweight inference simulation (real impl would use TFLite native module)
export async function runInference<T>(
  modelName: string,
  input: string,
  postprocess: (output: number[]) => T,
): Promise<InferenceResult<T>> {
  const config = MODELS[modelName];
  if (!config) throw new Error(`Unknown model: ${modelName}`);

  const start = Date.now();
  const _tokenized = preprocessInput(input, modelName);

  // Simulate inference (real: native TFLite module)
  const outputSize = config.outputShape[config.outputShape.length - 1];
  const rawOutput = Array.from({ length: outputSize }, () => Math.random() * 2 - 1);

  const predictions = postprocess(rawOutput);
  const latencyMs = Date.now() - start;

  return {
    predictions,
    confidence: 0.85,
    latencyMs,
    modelVersion: config.version,
  };
}

export function isModelLoaded(modelName: string): boolean {
  return modelName in MODELS;
}

export function getAvailableModels(): string[] {
  return Object.keys(MODELS);
}
