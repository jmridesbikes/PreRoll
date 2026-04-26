import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

import type { CaptureSession, MediaMode } from '../types/session';
import { colors } from '../theme/colors';
import type { CameraType } from 'expo-camera';

const PRESETS = [5, 10, 15, 30, 60] as const;
const CUSTOM_MIN = 1;
const CUSTOM_MAX = 120;

type Props = {
  onStart: (session: CaptureSession) => void;
};

export function SetupScreen({ onStart }: Props) {
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [selectedSeconds, setSelectedSeconds] = useState(10);
  const [customText, setCustomText] = useState('');
  const [usingCustomTimer, setUsingCustomTimer] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>('video');
  const [facing, setFacing] = useState<CameraType>('back');
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const openSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  const ensurePermissions = async (): Promise<boolean> => {
    let cam = cameraPermission;
    if (!cam?.granted) {
      cam = await requestCameraPermission();
    }
    if (!cam.granted) {
      Alert.alert(
        'Camera required',
        'PreRoll needs camera access to record after the countdown.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ],
      );
      return false;
    }

    if (mediaMode === 'video') {
      let mic = micPermission;
      if (!mic?.granted) {
        mic = await requestMicPermission();
      }
      if (!mic.granted) {
        Alert.alert(
          'Microphone required',
          'Video clips include audio. Allow the microphone, or switch to Photo mode.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ],
        );
        return false;
      }
    }

    return true;
  };

  const handleStart = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;

    onStart({
      countdownSeconds: selectedSeconds,
      mediaMode,
      facing,
      vibrationEnabled,
    });
  };

  const applyCustom = () => {
    const n = parseInt(customText.trim(), 10);
    if (Number.isFinite(n)) {
      const clamped = Math.min(CUSTOM_MAX, Math.max(CUSTOM_MIN, n));
      setSelectedSeconds(clamped);
      setCustomText(String(clamped));
      setUsingCustomTimer(true);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>PreRoll</Text>
      <Text style={styles.subtitle}>Countdown, then record — no wasted footage.</Text>

      <Text style={styles.sectionLabel}>Timer</Text>
      <View style={styles.chipRow}>
        {PRESETS.map((s) => (
          <Pressable
            key={s}
            onPress={() => {
              setSelectedSeconds(s);
              setUsingCustomTimer(false);
              setCustomText('');
            }}
            style={[
              styles.chip,
              !usingCustomTimer && selectedSeconds === s && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                !usingCustomTimer && selectedSeconds === s && styles.chipTextSelected,
              ]}
            >
              {s}s
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Custom (seconds)</Text>
      <View style={styles.customRow}>
        <TextInput
          style={styles.input}
          placeholder={`${CUSTOM_MIN}–${CUSTOM_MAX}`}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={customText}
          onChangeText={setCustomText}
          onSubmitEditing={applyCustom}
          onBlur={applyCustom}
          maxLength={3}
        />
        <Pressable onPress={applyCustom} style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>Set</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Media</Text>
      <View style={styles.segment}>
        <Pressable
          onPress={() => setMediaMode('video')}
          style={[styles.segmentBtn, mediaMode === 'video' && styles.segmentBtnOn]}
        >
          <Text style={[styles.segmentLabel, mediaMode === 'video' && styles.segmentLabelOn]}>
            Video
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMediaMode('picture')}
          style={[styles.segmentBtn, mediaMode === 'picture' && styles.segmentBtnOn]}
        >
          <Text style={[styles.segmentLabel, mediaMode === 'picture' && styles.segmentLabelOn]}>
            Photo
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Camera</Text>
      <View style={styles.segment}>
        <Pressable
          onPress={() => setFacing('back')}
          style={[styles.segmentBtn, facing === 'back' && styles.segmentBtnOn]}
        >
          <Text style={[styles.segmentLabel, facing === 'back' && styles.segmentLabelOn]}>
            Rear
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFacing('front')}
          style={[styles.segmentBtn, facing === 'front' && styles.segmentBtnOn]}
        >
          <Text style={[styles.segmentLabel, facing === 'front' && styles.segmentLabelOn]}>
            Front
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setVibrationEnabled((v) => !v)}
        style={styles.toggleRow}
      >
        <Text style={styles.toggleLabel}>Vibration on countdown</Text>
        <Text style={styles.toggleValue}>{vibrationEnabled ? 'On' : 'Off'}</Text>
      </Pressable>

      <Pressable
        onPress={handleStart}
        style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Start countdown and open camera"
      >
        <Text style={styles.startLabel}>Start</Text>
      </Pressable>

      <Text style={styles.hint}>
        Clips save to your gallery after you stop recording. Use a development build for full
        camera and library access (Expo Go is limited).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
  },
  sectionLabel: {
    marginTop: 28,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minHeight: 48,
    minWidth: 56,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.chipSelected,
    borderColor: colors.chipSelected,
  },
  chipText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: colors.chipText,
  },
  customRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 18,
  },
  applyBtn: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnOn: {
    backgroundColor: colors.chipSelected,
  },
  segmentLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentLabelOn: {
    color: colors.chipText,
  },
  toggleRow: {
    marginTop: 24,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleValue: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  startBtn: {
    marginTop: 28,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnPressed: {
    opacity: 0.9,
  },
  startLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.chipText,
  },
  hint: {
    marginTop: 20,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
