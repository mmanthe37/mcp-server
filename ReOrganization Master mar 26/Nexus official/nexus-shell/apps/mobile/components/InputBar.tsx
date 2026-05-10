import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Keyboard,
  Platform,
} from 'react-native';

export interface Suggestion {
  id: string;
  text: string;
  type: 'history' | 'completion' | 'ai';
  confidence?: number;
}

export interface InputBarProps {
  onSubmit: (command: string) => void;
  onTextChange?: (text: string) => void;
  suggestions?: Suggestion[];
  isConnected: boolean;
  isProcessing?: boolean;
  placeholder?: string;
}

export default function InputBar({
  onSubmit,
  onTextChange,
  suggestions = [],
  isConnected,
  isProcessing = false,
  placeholder = 'Enter command...',
}: InputBarProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleChange = useCallback(
    (value: string) => {
      setText(value);
      onTextChange?.(value);
    },
    [onTextChange]
  );

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !isConnected) return;
    onSubmit(trimmed);
    setText('');
  }, [text, isConnected, onSubmit]);

  const handleSuggestionPress = useCallback(
    (suggestion: Suggestion) => {
      setText(suggestion.text);
      onSubmit(suggestion.text);
      setText('');
      Keyboard.dismiss();
    },
    [onSubmit]
  );

  const getSuggestionIcon = (type: Suggestion['type']): string => {
    switch (type) {
      case 'history':
        return '🕐';
      case 'completion':
        return '→';
      case 'ai':
        return '✨';
      default:
        return '·';
    }
  };

  return (
    <View style={styles.container}>
      {suggestions.length > 0 && text.length > 0 && (
        <FlatList
          data={suggestions.slice(0, 5)}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsRow}
          contentContainerStyle={styles.suggestionsContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.suggestion, item.type === 'ai' && styles.aiSuggestion]}
              onPress={() => handleSuggestionPress(item)}
              accessibilityLabel={`Suggestion: ${item.text}`}
            >
              <Text style={styles.suggestionIcon}>{getSuggestionIcon(item.type)}</Text>
              <Text style={styles.suggestionText} numberOfLines={1}>
                {item.text}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
      <View style={styles.inputRow}>
        <Text style={styles.prompt}>❯</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={handleChange}
          onSubmitEditing={handleSubmit}
          placeholder={isConnected ? placeholder : 'Disconnected'}
          placeholderTextColor="#565f89"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="ascii-capable"
          returnKeyType="send"
          blurOnSubmit={false}
          editable={isConnected}
          accessibilityLabel="Command input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!isConnected || !text.trim()) && styles.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isConnected || !text.trim()}
          accessibilityLabel="Execute command"
        >
          <Text style={styles.sendIcon}>{isProcessing ? '⏳' : '⏎'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16161e',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#292e42',
    paddingBottom: Platform.select({ ios: 20, default: 8 }),
  },
  suggestionsRow: {
    maxHeight: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#292e42',
  },
  suggestionsContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24283b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  aiSuggestion: {
    borderWidth: 1,
    borderColor: '#bb9af744',
  },
  suggestionIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  suggestionText: {
    fontSize: 13,
    color: '#c0caf5',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    maxWidth: 200,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7aa2f7',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#c0caf5',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    paddingVertical: 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#7aa2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#292e42',
  },
  sendIcon: {
    fontSize: 16,
    color: '#1a1b26',
  },
});
