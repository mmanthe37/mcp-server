import { View, Text, StyleSheet, ScrollView, Switch, useColorScheme, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuth } from '../../hooks';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { logout } = useAuth();
  const settings = useSettingsStore();
  const { theme, setTheme, biometricLock, setBiometricLock } = settings;
  const fontSize = settings.terminal.fontSize;
  const setFontSize = (v: number) => settings.updateTerminal({ fontSize: v });
  const hapticFeedback = settings.terminal.enableHaptics;
  const setHapticFeedback = (v: boolean) => settings.updateTerminal({ enableHaptics: v });
  const speculativeEcho = settings.terminal.enableSpeculativeEcho;
  const setSpeculativeEcho = (v: boolean) => settings.updateTerminal({ enableSpeculativeEcho: v });
  const aiAssistEnabled = settings.aiEnabled;
  const setAiAssistEnabled = settings.setAiEnabled;

  const textColor = isDark ? '#e0e0e0' : '#1a1a1a';
  const cardBg = isDark ? '#1a1a2e' : '#ffffff';
  const borderColor = isDark ? '#2a2a4a' : '#e0e0e0';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0a0a1a' : '#f5f5f5' }]}
      contentContainerStyle={styles.content}
    >
      {/* Terminal section */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Terminal</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Row label="Font Size" value={`${fontSize}px`} textColor={textColor}>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={24}
            step={1}
            value={fontSize}
            onValueChange={setFontSize}
            minimumTrackTintColor="#00d4ff"
            maximumTrackTintColor="#444"
          />
        </Row>
        <Divider color={borderColor} />
        <ToggleRow
          label="Speculative Echo"
          description="Local echo for low-latency typing"
          value={speculativeEcho}
          onValueChange={setSpeculativeEcho}
          textColor={textColor}
        />
        <Divider color={borderColor} />
        <ToggleRow
          label="Haptic Feedback"
          value={hapticFeedback}
          onValueChange={setHapticFeedback}
          textColor={textColor}
        />
      </View>

      {/* AI section */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>AI Assistant</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ToggleRow
          label="AI Command Suggestions"
          description="On-device predictive completion"
          value={aiAssistEnabled}
          onValueChange={setAiAssistEnabled}
          textColor={textColor}
        />
      </View>

      {/* Security section */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Security</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ToggleRow
          label="Biometric Lock"
          description={Platform.OS === 'ios' ? 'Require Face ID / Touch ID' : 'Require fingerprint / face unlock'}
          value={biometricLock}
          onValueChange={setBiometricLock}
          textColor={textColor}
        />
      </View>

      {/* Theme section */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemeSelector current={theme} onChange={setTheme} textColor={textColor} />
      </View>

      {/* Account section */}
      <Text style={[styles.sectionTitle, { color: textColor }]}>Account</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Row label="Sign Out" textColor="#ff4444">
          <Switch value={false} onChange={() => logout()} />
        </Row>
      </View>

      <Text style={styles.version}>NexusShell v1.0.0</Text>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  textColor,
  children,
}: {
  label: string;
  value?: string;
  textColor: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={[styles.labelText, { color: textColor }]}>{label}</Text>
        {value && <Text style={styles.valueText}>{value}</Text>}
      </View>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  textColor,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  textColor: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={[styles.labelText, { color: textColor }]}>{label}</Text>
        {description && <Text style={styles.descText}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#444', true: '#00d4ff' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function ThemeSelector({
  current,
  onChange,
  textColor,
}: {
  current: string;
  onChange: (t: 'system' | 'dark' | 'light') => void;
  textColor: string;
}) {
  const options: Array<{ key: 'system' | 'dark' | 'light'; label: string }> = [
    { key: 'system', label: 'System' },
    { key: 'dark', label: 'Dark' },
    { key: 'light', label: 'Light' },
  ];
  return (
    <View style={styles.themeRow}>
      {options.map((opt) => (
        <View
          key={opt.key}
          style={[
            styles.themeOption,
            current === opt.key && styles.themeOptionActive,
          ]}
        >
          <Text
            style={[
              styles.themeText,
              { color: current === opt.key ? '#00d4ff' : textColor },
            ]}
            onPress={() => onChange(opt.key)}
          >
            {opt.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, marginTop: 20, marginLeft: 4 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { flex: 1, marginRight: 12 },
  labelText: { fontSize: 16 },
  valueText: { fontSize: 13, color: '#888', marginTop: 2 },
  descText: { fontSize: 12, color: '#888', marginTop: 2 },
  slider: { width: 140, height: 32 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  themeRow: { flexDirection: 'row', padding: 12, gap: 8 },
  themeOption: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#2a2a4a' },
  themeOptionActive: { borderWidth: 1, borderColor: '#00d4ff' },
  themeText: { fontSize: 14, fontWeight: '600' },
  version: { textAlign: 'center', color: '#666', fontSize: 12, marginTop: 24 },
});
