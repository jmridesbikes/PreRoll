import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  elapsedSeconds: number;
  onStop: () => void;
};

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RecordingHUD({ elapsedSeconds, onStop }: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.recordingRow}>
        <View style={styles.dot} />
        <Text style={styles.timer}>{formatElapsed(elapsedSeconds)}</Text>
      </View>
      <Pressable
        onPress={onStop}
        style={({ pressed }) => [styles.stopBtn, pressed && styles.stopBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Stop recording"
      >
        <Text style={styles.stopLabel}>Stop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(10,10,10,0.88)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.recording,
  },
  timer: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  stopBtn: {
    minHeight: 52,
    minWidth: 120,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnPressed: {
    opacity: 0.85,
  },
  stopLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
