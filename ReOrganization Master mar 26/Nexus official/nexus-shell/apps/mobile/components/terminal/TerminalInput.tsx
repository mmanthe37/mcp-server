/**
 * TerminalInput — Contextual input bar with AI command suggestions.
 * Provides the primary text input for terminal sessions with
 * predictive completion, quick-paste, and action buttons.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';

export interface Suggestion {
  id: string;
  command: string;
  description?: string;
  confidence: number;
}

export interface TerminalInputProps {
  /** Callback when user submits input */
  onSubmit: (input: string) => void;
  /** Callback when input text changes (for AI predictions) */
  onInputChange?: (text: string) => void;
  /** AI-generated command suggestions */
  suggestions?: Suggestion[];
  /** Whether the terminal session is connected */
  connected: boolean;
  /** Whether to show the suggestion dropdown */
  showSuggestions?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

export const TerminalInput: React.FC<TerminalInputProps> = React.memo(
  function TerminalInput({
    onSubmit,
    onInputChange,
    suggestions = [],
    connected,
    showSuggestions = true,
    placeholder = 'Enter command...',
  }) {
    const [text, setText] = useState('');
    const [suggestionsVisible, setSuggestionsVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);

    useEffect(() => {
      setSuggestionsVisible(showSuggestions && suggestions.length > 0 && text.length > 0);
    }, [suggestions, showSuggestions, text]);

    const handleChangeText = useCallback(
      (newText: string) => {
        setText(newText);
        historyIndexRef.current = -1;
        onInputChange?.(newText);
      },
      [onInputChange]
    );

    const handleSubmit = useCallback(() => {
      const trimmed = text.trim();
      if (!trimmed || !connected) return;

      onSubmit(trimmed);
      historyRef.current.unshift(trimmed);
      if (historyRef.current.length > 100) historyRef.current.pop();
      setText('');
      setSuggestionsVisible(false);
    }, [text, connected, onSubmit]);

    const handleSuggestionSelect = useCallback(
      (suggestion: Suggestion) => {
        setText(suggestion.command);
        setSuggestionsVisible(false);
        inputRef.current?.focus();
      },
      []
    );

    const handleHistoryUp = useCallback(() => {
      const history = historyRef.current;
      if (history.length === 0) return;
      const newIndex = Math.min(historyIndexRef.current + 1, history.length - 1);
      historyIndexRef.current = newIndex;
      setText(history[newIndex] ?? '');
    }, []);

    const handleHistoryDown = useCallback(() => {
      if (historyIndexRef.current <= 0) {
        historyIndexRef.current = -1;
        setText('');
        return;
      }
      historyIndexRef.current--;
      setText(historyRef.current[historyIndexRef.current] ?? '');
    }, []);

    const handleKeyPress = useCallback(
      (e: { nativeEvent: { key: string } }) => {
        if (e.nativeEvent.key === 'ArrowUp') handleHistoryUp();
        if (e.nativeEvent.key === 'ArrowDown') handleHistoryDown();
      },
      [handleHistoryUp, handleHistoryDown]
    );

    const handleTabComplete = useCallback(() => {
      if (suggestions.length > 0) {
        handleSuggestionSelect(suggestions[0]!);
      }
    }, [suggestions, handleSuggestionSelect]);

    return (
      <View style={styles.container}>
        {suggestionsVisible && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions.slice(0, 5)}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionSelect(item)}
                  accessibilityLabel={`Suggestion: ${item.command}`}
                  accessibilityHint={item.description}
                >
                  <Text style={styles.suggestionCommand}>{item.command}</Text>
                  {item.description && (
                    <Text style={styles.suggestionDescription} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={styles.suggestionConfidence}>
                    {Math.round(item.confidence * 100)}%
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={styles.inputRow}>
          <View style={[styles.statusDot, connected ? styles.connected : styles.disconnected]} />

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            returnKeyType="send"
            editable={connected}
            blurOnSubmit={false}
            accessibilityLabel="Terminal command input"
            accessibilityHint="Type a command and press enter to execute"
          />

          <TouchableOpacity
            style={[styles.tabButton, suggestions.length === 0 && styles.buttonDisabled]}
            onPress={handleTabComplete}
            disabled={suggestions.length === 0}
            accessibilityLabel="Tab complete"
          >
            <Text style={styles.buttonText}>TAB</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || !connected) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!text.trim() || !connected}
            accessibilityLabel="Send command"
          >
            <Text style={styles.buttonText}>⏎</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  suggestionsContainer: {
    maxHeight: 160,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a2a',
  },
  suggestionCommand: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    color: '#4ec9b0',
    flex: 1,
  },
  suggestionDescription: {
    fontSize: 11,
    color: '#888',
    marginLeft: 8,
    flex: 2,
  },
  suggestionConfidence: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
    minWidth: 32,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connected: {
    backgroundColor: '#4ec9b0',
  },
  disconnected: {
    backgroundColor: '#f44747',
  },
  input: {
    flex: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 14,
    color: '#e0e0e0',
    backgroundColor: '#0d0d0d',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: Platform.select({ ios: 8, android: 6 }),
    borderWidth: 1,
    borderColor: '#333',
  },
  tabButton: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  sendButton: {
    backgroundColor: '#0078d4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
