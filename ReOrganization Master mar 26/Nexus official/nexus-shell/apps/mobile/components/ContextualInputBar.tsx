/**
 * ContextualInputBar — Dynamic input bar with AI completion, NL mode, and smart actions.
 * The primary input surface for terminal interaction.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Animated,
  Keyboard,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from 'react-native';

interface ContextualInputBarProps {
  onSubmit: (text: string) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  mode: 'shell' | 'natural-language';
  onModeToggle: () => void;
  onPaste?: (text: string) => void;
  disabled?: boolean;
}

export default function ContextualInputBar({
  onSubmit,
  onTextChange,
  placeholder,
  mode,
  onModeToggle,
  disabled = false,
}: ContextualInputBarProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      onTextChange?.(value);
    },
    [onTextChange],
  );

  const handleSubmit = useCallback(
    (_e?: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      onSubmit(trimmed);
      setText('');

      // Pulse animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    },
    [text, onSubmit, scaleAnim],
  );

  const handleSendPress = useCallback(() => {
    handleSubmit();
    Keyboard.dismiss();
  }, [handleSubmit]);

  const quickActions = [
    { label: 'Tab', action: () => onSubmit('\t') },
    { label: 'Ctrl+C', action: () => onSubmit('\x03') },
    { label: 'Ctrl+D', action: () => onSubmit('\x04') },
    { label: '↑', action: () => onSubmit('\x1b[A') },
    { label: '↓', action: () => onSubmit('\x1b[B') },
  ];

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      {/* Quick action bar */}
      <View style={styles.quickActions}>
        {quickActions.map((qa) => (
          <TouchableOpacity
            key={qa.label}
            style={styles.quickActionBtn}
            onPress={qa.action}
            disabled={disabled}
          >
            <Text style={styles.quickActionText}>{qa.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main input row */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.modeToggle, mode === 'natural-language' && styles.modeToggleActive]}
          onPress={onModeToggle}
        >
          <Text style={styles.modeIcon}>{mode === 'shell' ? '>' : '💬'}</Text>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSubmit}
          placeholder={
            placeholder ||
            (mode === 'shell' ? 'Enter command...' : 'Describe what you want to do...')
          }
          placeholderTextColor="#636366"
          autoCapitalize="none"
          autoCorrect={mode === 'natural-language'}
          spellCheck={mode === 'natural-language'}
          returnKeyType="send"
          blurOnSubmit={false}
          editable={!disabled}
          keyboardAppearance="dark"
          selectionColor="#5AC8FA"
        />

        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSendPress}
          disabled={!text.trim() || disabled}
        >
          <Text style={styles.sendIcon}>⏎</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#38383A',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 6,
  },
  quickActionBtn: {
    backgroundColor: '#2C2C2E',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickActionText: {
    color: '#8E8E93',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  modeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggleActive: {
    backgroundColor: '#0A84FF',
  },
  modeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'monospace',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#2C2C2E',
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
