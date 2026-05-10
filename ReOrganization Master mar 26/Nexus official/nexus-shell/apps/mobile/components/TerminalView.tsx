import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';

export interface TerminalLine {
  id: string;
  text: string;
  type: 'stdout' | 'stderr' | 'stdin' | 'system';
  timestamp: number;
}

export interface TerminalViewProps {
  lines: TerminalLine[];
  isConnected: boolean;
  onInput: (text: string) => void;
  onResize?: (cols: number, rows: number) => void;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  cursorColor?: string;
  scrollbackLimit?: number;
}

const CHAR_WIDTH_RATIO = 0.6; // monospace char width / fontSize

export default function TerminalView({
  lines,
  isConnected,
  onInput,
  onResize,
  fontSize = 14,
  fontFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  backgroundColor = '#1a1b26',
  foregroundColor = '#a9b1d6',
  cursorColor = '#7aa2f7',
  scrollbackLimit = 10000,
}: TerminalViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const displayLines = useMemo(() => {
    if (lines.length <= scrollbackLimit) return lines;
    return lines.slice(lines.length - scrollbackLimit);
  }, [lines, scrollbackLimit]);

  useEffect(() => {
    // Auto-scroll to bottom on new output
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, [displayLines.length]);

  useEffect(() => {
    if (!onResize) return;
    const { width, height } = Dimensions.get('window');
    const charWidth = fontSize * CHAR_WIDTH_RATIO;
    const lineHeight = fontSize * 1.4;
    const cols = Math.floor((width - 16) / charWidth);
    const rows = Math.floor((height - 120) / lineHeight);
    onResize(Math.max(cols, 40), Math.max(rows, 10));
  }, [fontSize, onResize]);

  const handleSubmit = useCallback(
    (text: string) => {
      if (!isConnected) return;
      onInput(text);
    },
    [isConnected, onInput]
  );

  const getLineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'stderr':
        return '#f7768e';
      case 'stdin':
        return '#9ece6a';
      case 'system':
        return '#7aa2f7';
      default:
        return foregroundColor;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]} accessible accessibilityRole="none" accessibilityLabel="Terminal output">
      {!isConnected && (
        <View style={styles.disconnectedBanner}>
          <Text style={styles.disconnectedText}>⚡ Reconnecting...</Text>
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        style={styles.outputArea}
        contentContainerStyle={styles.outputContent}
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator
        accessibilityRole="text"
      >
        {displayLines.map((line) => (
          <Text
            key={line.id}
            style={[
              styles.line,
              {
                fontFamily,
                fontSize,
                color: getLineColor(line.type),
                lineHeight: fontSize * 1.4,
              },
            ]}
            selectable
          >
            {line.text}
          </Text>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <Text style={[styles.prompt, { fontFamily, fontSize, color: cursorColor }]}>❯ </Text>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              fontFamily,
              fontSize,
              color: foregroundColor,
            },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="ascii-capable"
          returnKeyType="send"
          blurOnSubmit={false}
          editable={isConnected}
          placeholder={isConnected ? 'Enter command...' : 'Disconnected'}
          placeholderTextColor="#565f89"
          onSubmitEditing={(e) => {
            handleSubmit(e.nativeEvent.text);
            if (inputRef.current) {
              inputRef.current.clear();
            }
          }}
          accessibilityLabel="Command input"
          accessibilityHint="Type a terminal command and press enter to execute"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  disconnectedBanner: {
    backgroundColor: '#f7768e22',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  disconnectedText: {
    color: '#f7768e',
    fontSize: 13,
    fontWeight: '600',
  },
  outputArea: {
    flex: 1,
  },
  outputContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  line: {
    paddingVertical: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#292e42',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  prompt: {
    fontWeight: '700',
  },
  input: {
    flex: 1,
    paddingVertical: 4,
  },
});
