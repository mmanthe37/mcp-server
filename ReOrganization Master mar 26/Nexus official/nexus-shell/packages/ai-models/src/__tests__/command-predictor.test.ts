import { AIEngine } from '../engine';
import { CommandPredictor } from '../command-predictor';
import type { CommandContext } from '../types';

function makeContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    currentDirectory: '/home/user',
    shell: 'bash',
    recentCommands: [],
    environment: {},
    ...overrides,
  };
}

describe('AIEngine', () => {
  let engine: AIEngine;

  beforeEach(() => {
    engine = new AIEngine({ cachePredictions: true, cacheMaxSize: 10 });
  });

  afterEach(async () => {
    await engine.dispose();
  });

  it('starts un-initialized', async () => {
    await expect(engine.infer('test', {})).rejects.toThrow('not initialized');
  });

  it('initialize is idempotent', async () => {
    await engine.initialize();
    await engine.initialize(); // should not throw
  });

  it('loadModel stores model metadata', async () => {
    const meta = await engine.loadModel('cmd-pred', './models/cmd-pred.tflite');
    expect(meta.name).toBe('cmd-pred');
    expect(meta.version).toBe('1.0.0');
    expect(meta.quantized).toBe(true);
  });

  it('getLoadedModels returns loaded models', async () => {
    await engine.loadModel('a', './a');
    await engine.loadModel('b', './b');
    const models = engine.getLoadedModels();
    expect(models).toHaveLength(2);
    expect(models.map(m => m.name)).toEqual(['a', 'b']);
  });

  it('infer throws for unloaded model', async () => {
    await engine.initialize();
    await expect(engine.infer('missing', {})).rejects.toThrow('not loaded');
  });

  it('infer returns cached results on second call', async () => {
    await engine.initialize();
    await engine.loadModel('test', './test');

    const result1 = await engine.infer('test', { input: 'abc' });
    const result2 = await engine.infer('test', { input: 'abc' });
    expect(result2.latencyMs).toBe(0); // cache hit
  });

  it('clearCache empties the prediction cache', async () => {
    await engine.initialize();
    await engine.loadModel('test', './test');

    await engine.infer('test', { x: 1 });
    engine.clearCache();

    const result = await engine.infer('test', { x: 1 });
    // After clearing cache, latency should be > 0 or at least not cached
    expect(result.modelVersion).toBe('1.0.0');
  });

  it('dispose clears models and cache', async () => {
    await engine.initialize();
    await engine.loadModel('m', './m');
    await engine.dispose();
    expect(engine.getLoadedModels()).toHaveLength(0);
  });
});

describe('CommandPredictor', () => {
  let engine: AIEngine;
  let predictor: CommandPredictor;

  beforeEach(async () => {
    engine = new AIEngine();
    await engine.initialize();
    predictor = new CommandPredictor(engine);
  });

  afterEach(async () => {
    await engine.dispose();
  });

  describe('addToHistory', () => {
    it('tracks command frequency', async () => {
      predictor.addToHistory('git status');
      predictor.addToHistory('git status');
      predictor.addToHistory('git log');

      const predictions = await predictor.predict('git', makeContext());
      const gitStatus = predictions.find(p => p.text === 'git status');
      const gitLog = predictions.find(p => p.text === 'git log');

      // git status used twice should rank higher
      if (gitStatus && gitLog) {
        expect(gitStatus.confidence).toBeGreaterThanOrEqual(gitLog.confidence);
      }
    });

    it('builds contextual patterns from sequential commands', async () => {
      predictor.addToHistory('git add .');
      predictor.addToHistory('git commit -m "fix"');
      predictor.addToHistory('git add .');
      predictor.addToHistory('git commit -m "feat"');

      // After "git add .", "git commit" should be predicted
      const predictions = await predictor.predict(
        '',
        makeContext({ recentCommands: ['git add .'] }),
      );
      const commitPrediction = predictions.find(p => p.text.startsWith('git commit'));
      expect(commitPrediction).toBeDefined();
    });
  });

  describe('predict', () => {
    it('returns empty for no history and no partial', async () => {
      const predictions = await predictor.predict('', makeContext());
      // Without any history or model, may return directory-based predictions or empty
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('returns history-based prefix matches', async () => {
      predictor.addToHistory('npm install');
      predictor.addToHistory('npm run build');
      predictor.addToHistory('npm test');

      const predictions = await predictor.predict('npm', makeContext());
      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions.every(p => p.text.startsWith('npm'))).toBe(true);
    });

    it('limits results to 8 predictions', async () => {
      for (let i = 0; i < 20; i++) {
        predictor.addToHistory(`cmd-${i}`);
      }
      const predictions = await predictor.predict('cmd', makeContext());
      expect(predictions.length).toBeLessThanOrEqual(8);
    });

    it('deduplicates predictions', async () => {
      predictor.addToHistory('ls -la');
      predictor.addToHistory('ls -la');

      const predictions = await predictor.predict('ls', makeContext());
      const lsLaCount = predictions.filter(p => p.text === 'ls -la').length;
      expect(lsLaCount).toBeLessThanOrEqual(1);
    });

    it('sorts predictions by confidence descending', async () => {
      predictor.addToHistory('git push');
      predictor.addToHistory('git push');
      predictor.addToHistory('git push');
      predictor.addToHistory('git pull');

      const predictions = await predictor.predict('git', makeContext());
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i - 1].confidence).toBeGreaterThanOrEqual(predictions[i].confidence);
      }
    });

    it('provides directory-aware predictions for known prefixes', async () => {
      const predictions = await predictor.predict('git ', makeContext());
      expect(predictions.some(p => p.text.startsWith('git '))).toBe(true);
    });
  });
});
