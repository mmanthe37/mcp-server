/**
 * AiSuggestionBar — Floating suggestion bar with command predictions and NL translation.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type { CommandSuggestion } from '../services/ai-service';

interface AiSuggestionBarProps {
  suggestions: CommandSuggestion[];
  loading: boolean;
  visible: boolean;
  onSelect: (suggestion: CommandSuggestion) => void;
  onDismiss: () => void;
}

export default function AiSuggestionBar({
  suggestions,
  loading,
  visible,
  onSelect,
  onDismiss,
}: AiSuggestionBarProps) {
  const getSourceIcon = useCallback((source: CommandSuggestion['source']): string => {
    switch (source) {
      case 'model': return '🧠';
      case 'history': return '📜';
      case 'contextual': return '⭐';
      default: return '💡';
    }
  }, []);

  const getConfidenceColor = useCallback((confidence: number): string => {
    if (confidence >= 0.8) return '#34C759';
    if (confidence >= 0.5) return '#FF9500';
    return '#8E8E93';
  }, []);

  if (!visible || (suggestions.length === 0 && !loading)) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>AI Suggestions</Text>
        {loading && <ActivityIndicator size="small" color="#5AC8FA" />}
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={`${suggestion.text}-${index}`}
            style={styles.chip}
            onPress={() => onSelect(suggestion)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipIcon}>{getSourceIcon(suggestion.source)}</Text>
            <View style={styles.chipContent}>
              <Text style={styles.chipCommand} numberOfLines={1}>
                {suggestion.text}
              </Text>
              {suggestion.explanation && (
                <Text style={styles.chipDescription} numberOfLines={1}>
                  {suggestion.explanation}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.confidenceDot,
                { backgroundColor: getConfidenceColor(suggestion.confidence) },
              ]}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#38383A',
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 250,
    gap: 8,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipContent: {
    flex: 1,
    gap: 2,
  },
  chipCommand: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  chipDescription: {
    color: '#8E8E93',
    fontSize: 11,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
