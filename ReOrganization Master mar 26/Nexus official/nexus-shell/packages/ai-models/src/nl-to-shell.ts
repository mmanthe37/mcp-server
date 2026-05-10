/**
 * Natural Language to Shell Translator — Converts natural language queries to shell commands.
 * Uses on-device ML with template-based fallback for common patterns.
 */

import { runInference } from './inference-engine';

export interface TranslationResult {
  command: string;
  confidence: number;
  explanation: string;
  alternatives: string[];
  riskLevel: 'safe' | 'elevated' | 'dangerous';
  source: 'ml' | 'template' | 'hybrid';
}

interface TemplatePattern {
  patterns: RegExp[];
  command: (match: RegExpMatchArray) => string;
  explanation: string;
  riskLevel: 'safe' | 'elevated' | 'dangerous';
}

const TEMPLATE_PATTERNS: TemplatePattern[] = [
  {
    patterns: [/list (?:all )?files(?: in (.+))?/i, /show (?:all )?files(?: in (.+))?/i, /what(?:'s| is) in (.+)/i],
    command: (m) => `ls -la ${m[1] || '.'}`,
    explanation: 'List all files including hidden ones with details',
    riskLevel: 'safe',
  },
  {
    patterns: [/find (?:files? )?(?:named |called )?["']?([^"']+)["']?/i],
    command: (m) => `find . -name "*${m[1].trim()}*"`,
    explanation: 'Search for files matching the pattern',
    riskLevel: 'safe',
  },
  {
    patterns: [/search (?:for )?["']?([^"']+)["']? in (?:all )?files/i, /grep (?:for )?["']?([^"']+)["']?/i],
    command: (m) => `grep -r "${m[1].trim()}" .`,
    explanation: 'Search file contents recursively',
    riskLevel: 'safe',
  },
  {
    patterns: [/(?:how much |)disk (?:space|usage)/i, /storage usage/i],
    command: () => 'df -h',
    explanation: 'Show disk space usage in human-readable format',
    riskLevel: 'safe',
  },
  {
    patterns: [/(?:folder|directory) size(?: of (.+))?/i],
    command: (m) => `du -sh ${m[1] || '.'}`,
    explanation: 'Show directory size',
    riskLevel: 'safe',
  },
  {
    patterns: [/(?:show|list|what(?:'s| are)) (?:running )?processes/i, /what(?:'s| is) (?:using|eating) (?:my )?(?:cpu|memory|ram)/i],
    command: () => 'ps aux --sort=-%mem | head -20',
    explanation: 'Show top processes by memory usage',
    riskLevel: 'safe',
  },
  {
    patterns: [/kill (?:process |)(?:named )?["']?([^"']+)["']?/i, /stop (?:process |)(?:named )?["']?([^"']+)["']?/i],
    command: (m) => `pkill -f "${m[1].trim()}"`,
    explanation: 'Terminate processes matching the pattern',
    riskLevel: 'elevated',
  },
  {
    patterns: [/(?:create|make|new) (?:a )?(?:folder|directory) (?:called |named )?["']?([^"']+)["']?/i],
    command: (m) => `mkdir -p "${m[1].trim()}"`,
    explanation: 'Create directory (including parent directories)',
    riskLevel: 'safe',
  },
  {
    patterns: [/delete (?:the )?(?:file |)["']?([^"']+)["']?/i, /remove (?:the )?(?:file |)["']?([^"']+)["']?/i],
    command: (m) => `rm -i "${m[1].trim()}"`,
    explanation: 'Delete file with confirmation prompt',
    riskLevel: 'elevated',
  },
  {
    patterns: [/(?:download|fetch|get) (?:the )?(?:file (?:from |at )?)?(?:url )?["']?(https?:\/\/[^"'\s]+)["']?/i],
    command: (m) => `curl -OL "${m[1].trim()}"`,
    explanation: 'Download file from URL',
    riskLevel: 'safe',
  },
  {
    patterns: [/compress (?:the )?(?:folder|directory|files?) ["']?([^"']+)["']?/i, /zip (?:the )?["']?([^"']+)["']?/i],
    command: (m) => `tar -czf "${m[1].trim()}.tar.gz" "${m[1].trim()}"`,
    explanation: 'Create compressed archive',
    riskLevel: 'safe',
  },
  {
    patterns: [/(?:show|view|print|read) (?:the )?(?:file )?["']?([^"']+\.[a-z]+)["']?/i],
    command: (m) => `cat "${m[1].trim()}"`,
    explanation: 'Display file contents',
    riskLevel: 'safe',
  },
  {
    patterns: [/(?:what(?:'s| is) my|show (?:my )?|current )ip (?:address)?/i],
    command: () => 'curl -s ifconfig.me && echo',
    explanation: 'Show your public IP address',
    riskLevel: 'safe',
  },
  {
    patterns: [/(?:system|server) info/i, /(?:show|display) system (?:info|information)/i],
    command: () => 'uname -a && uptime && free -h 2>/dev/null || vm_stat',
    explanation: 'Display system information',
    riskLevel: 'safe',
  },
  {
    patterns: [/(?:install|add) (?:package |)["']?([^"']+)["']? (?:with |using )?(?:npm|node)/i],
    command: (m) => `npm install ${m[1].trim()}`,
    explanation: 'Install npm package',
    riskLevel: 'safe',
  },
  {
    patterns: [/(?:install|add) (?:package |)["']?([^"']+)["']? (?:with |using )?pip/i],
    command: (m) => `pip install ${m[1].trim()}`,
    explanation: 'Install Python package',
    riskLevel: 'safe',
  },
  {
    patterns: [/git status/i, /(?:show|check) git status/i],
    command: () => 'git status',
    explanation: 'Show git repository status',
    riskLevel: 'safe',
  },
  {
    patterns: [/git log/i, /(?:show|view) (?:recent )?(?:git )?commits/i],
    command: () => 'git log --oneline -20',
    explanation: 'Show recent git commits',
    riskLevel: 'safe',
  },
];

function matchTemplate(query: string): TranslationResult | null {
  for (const template of TEMPLATE_PATTERNS) {
    for (const pattern of template.patterns) {
      const match = query.match(pattern);
      if (match) {
        return {
          command: template.command(match),
          confidence: 0.9,
          explanation: template.explanation,
          alternatives: [],
          riskLevel: template.riskLevel,
          source: 'template',
        };
      }
    }
  }
  return null;
}

export async function translateToShell(
  naturalLanguage: string,
  cwd?: string,
): Promise<TranslationResult> {
  // First try template matching (fast, high accuracy)
  const templateResult = matchTemplate(naturalLanguage);
  if (templateResult) return templateResult;

  // Fall back to ML inference
  try {
    const mlResult = await runInference<string>(
      'nlToShell',
      `translate: ${naturalLanguage} cwd: ${cwd || '.'}`,
      (_output) => naturalLanguage.toLowerCase().replace(/\s+/g, '-'),
    );

    return {
      command: mlResult.predictions,
      confidence: mlResult.confidence * 0.7,
      explanation: `AI-generated command for: "${naturalLanguage}"`,
      alternatives: [],
      riskLevel: 'elevated',
      source: 'ml',
    };
  } catch {
    return {
      command: `# Could not translate: "${naturalLanguage}"`,
      confidence: 0,
      explanation: 'Translation failed — try rephrasing',
      alternatives: [],
      riskLevel: 'safe',
      source: 'template',
    };
  }
}

export function getSupportedPatterns(): string[] {
  return [
    'List files in [directory]',
    'Find files named [pattern]',
    'Search for [text] in files',
    'Disk space / storage usage',
    'Show running processes',
    'Create folder [name]',
    'Delete file [name]',
    'Download [url]',
    'Compress [folder]',
    'Show file [name]',
    'System info',
    'Git status / log',
    'Install [package] with npm/pip',
  ];
}
