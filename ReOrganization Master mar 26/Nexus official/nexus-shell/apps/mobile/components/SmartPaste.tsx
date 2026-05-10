/**
 * SmartPaste — Intelligent clipboard integration with paste preview and transformation.
 * Detects content type and offers contextual actions before pasting into terminal.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface SmartPasteProps {
  visible: boolean;
  content: string;
  onPaste: (transformed: string) => void;
  onDismiss: () => void;
}

type ContentType = 'command' | 'multiline' | 'url' | 'path' | 'code' | 'text';

interface PasteAction {
  label: string;
  icon: string;
  transform: (content: string) => string;
}

function detectContentType(content: string): ContentType {
  if (/^https?:\/\//.test(content.trim())) return 'url';
  if (/^[/~.][\w/.\\-]+$/.test(content.trim())) return 'path';
  if (content.includes('\n')) {
    if (content.includes('function ') || content.includes('const ') || content.includes('import '))
      return 'code';
    return 'multiline';
  }
  if (/^[\w-]+(\s+[-\w./]+)*$/.test(content.trim())) return 'command';
  return 'text';
}

function getActionsForType(type: ContentType): PasteAction[] {
  const base: PasteAction[] = [
    { label: 'Paste as-is', icon: '📋', transform: (c) => c },
  ];

  switch (type) {
    case 'url':
      return [
        ...base,
        { label: 'Download with curl', icon: '⬇️', transform: (c) => `curl -OL "${c.trim()}"` },
        { label: 'Open in browser', icon: '🌐', transform: (c) => `open "${c.trim()}"` },
        { label: 'wget', icon: '📥', transform: (c) => `wget "${c.trim()}"` },
      ];
    case 'path':
      return [
        ...base,
        { label: 'cd to path', icon: '📂', transform: (c) => `cd "${c.trim()}"` },
        { label: 'ls path', icon: '📄', transform: (c) => `ls -la "${c.trim()}"` },
        { label: 'cat file', icon: '👁️', transform: (c) => `cat "${c.trim()}"` },
      ];
    case 'multiline':
      return [
        ...base,
        { label: 'Paste line by line', icon: '📝', transform: (c) => c.split('\n').filter(Boolean).join(' && ') },
        { label: 'Here document', icon: '📜', transform: (c) => `cat << 'EOF'\n${c}\nEOF` },
      ];
    case 'code':
      return [
        ...base,
        { label: 'Save to file', icon: '💾', transform: (c) => `cat > script.sh << 'EOF'\n${c}\nEOF` },
        { label: 'Pipe to shell', icon: '▶️', transform: (c) => c.split('\n').filter(Boolean).join(' && ') },
      ];
    case 'command':
      return [
        ...base,
        { label: 'Run with sudo', icon: '🔐', transform: (c) => `sudo ${c.trim()}` },
        { label: 'Dry run (echo)', icon: '👀', transform: (c) => `echo "${c.trim()}"` },
      ];
    default:
      return [
        ...base,
        { label: 'Quote and paste', icon: '💬', transform: (c) => `"${c.trim()}"` },
      ];
  }
}

function getTypeLabel(type: ContentType): string {
  switch (type) {
    case 'command': return '⚡ Command';
    case 'multiline': return '📝 Multi-line';
    case 'url': return '🔗 URL';
    case 'path': return '📂 File Path';
    case 'code': return '💻 Code';
    case 'text': return '📄 Text';
  }
}

export default function SmartPaste({
  visible,
  content,
  onPaste,
  onDismiss,
}: SmartPasteProps) {
  const [contentType, setContentType] = useState<ContentType>('text');
  const [actions, setActions] = useState<PasteAction[]>([]);

  useEffect(() => {
    if (content) {
      const type = detectContentType(content);
      setContentType(type);
      setActions(getActionsForType(type));
    }
  }, [content]);

  const handleAction = useCallback(
    (action: PasteAction) => {
      onPaste(action.transform(content));
    },
    [content, onPaste],
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Smart Paste</Text>
          <Text style={styles.typeLabel}>{getTypeLabel(contentType)}</Text>

          {/* Preview */}
          <ScrollView style={styles.preview} nestedScrollEnabled>
            <Text style={styles.previewText} numberOfLines={10}>
              {content}
            </Text>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionBtn}
                onPress={() => handleAction(action)}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onDismiss}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#48484A',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  typeLabel: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 12,
  },
  preview: {
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 12,
    maxHeight: 120,
    marginBottom: 16,
  },
  previewText: {
    color: '#00FF00',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  actions: {
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 14,
  },
  cancelText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '600',
  },
});
