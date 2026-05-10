/**
 * useAiSuggestions — Hook for AI-powered command suggestions.
 * Debounced input processing with real-time suggestion updates.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getSuggestions,
  translateNaturalLanguage,
  analyzeOutput,
  addToCommandHistory,
  type CommandSuggestion,
  type TranslationResult,
  type ErrorDiagnosis,
} from '../services/ai-service';

interface UseAiSuggestionsReturn {
  suggestions: CommandSuggestion[];
  translation: TranslationResult | null;
  diagnosis: ErrorDiagnosis | null;
  loading: boolean;
  updateInput: (input: string) => void;
  translateQuery: (query: string) => Promise<TranslationResult | null>;
  diagnoseOutput: (output: string) => void;
  acceptSuggestion: (suggestion: CommandSuggestion) => string;
  clearSuggestions: () => void;
}

export function useAiSuggestions(cwd: string = '~'): UseAiSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [diagnosis, setDiagnosis] = useState<ErrorDiagnosis | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestInput = useRef('');

  const updateInput = useCallback(
    (input: string) => {
      latestInput.current = input;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!input.trim()) {
        setSuggestions([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await getSuggestions(input, cwd);
          // Only update if input hasn't changed
          if (latestInput.current === input) {
            setSuggestions(results);
          }
        } catch {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 150);
    },
    [cwd],
  );

  const translateQuery = useCallback(
    async (query: string): Promise<TranslationResult | null> => {
      setLoading(true);
      try {
        const result = await translateNaturalLanguage(query, cwd);
        setTranslation(result);
        return result;
      } catch {
        setTranslation(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [cwd],
  );

  const diagnoseOutput = useCallback((output: string) => {
    const result = analyzeOutput(output);
    setDiagnosis(result);
  }, []);

  const acceptSuggestion = useCallback((suggestion: CommandSuggestion): string => {
    addToCommandHistory(suggestion.text);
    setSuggestions([]);
    return suggestion.text;
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setTranslation(null);
    setDiagnosis(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    suggestions,
    translation,
    diagnosis,
    loading,
    updateInput,
    translateQuery,
    diagnoseOutput,
    acceptSuggestion,
    clearSuggestions,
  };
}
