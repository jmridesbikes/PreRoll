import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

import { playCountdownTick } from '../lib/countdownFeedback';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { RecordingHUD } from '../components/RecordingHUD';
import {
  MediaLibraryPermissionError,
  saveToLibraryAsync,
} from '../lib/saveToLibrary';
import type { CaptureSession } from '../types/session';
import { colors } from '../theme/colors';

type Props = {
  session: CaptureSession;
  onDone: () => void;
};

export function CaptureScreen({ session, onDone }: Props) {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const captureTriggeredRef = useRef(false);

  const [phase, setPhase] = useState<'countdown' | 'recording' | 'saving'>('countdown');
  const [secondsLeft, setSecondsLeft] = useState(session.countdownSeconds);
  const [cameraReady, setCameraReady] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [mountError, setMountError] = useState<string | null>(null);
  /** Short rear-LED pulses during countdown only (rear camera); off while recording. */
  const [torchPulseOn, setTorchPulseOn] = useState(false);

  const startCapture = useCallback(async () => {
    const cam = cameraRef.current;
    const { mediaMode } = sessionRef.current;
    if (!cam) {
      onDone();
      return;
    }
    try {
      if (mediaMode === 'video') {
        setTorchPulseOn(false);
        setPhase('recording');
        const promise = cam.recordAsync();
        recordingPromiseRef.current = promise;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setTorchPulseOn(false);
        setPhase('saving');
        const photo = await cam.takePictureAsync({ quality: 0.85 });
        if (!photo?.uri) {
          throw new Error('Could not capture photo');
        }
        await saveToLibraryAsync(photo.uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDone();
      }
    } catch (e) {
      console.warn(e);
      if (e instanceof MediaLibraryPermissionError) {
        Alert.alert('Photos access needed', e.message, [
          { text: 'Not now', style: 'cancel', onPress: onDone },
          {
            text: 'Settings',
            onPress: () => {
              void Linking.openSettings();
              onDone();
            },
          },
        ]);
        return;
      }
      Alert.alert(
        'Capture failed',
        e instanceof Error ? e.message : 'Something went wrong. Try again.',
        [{ text: 'OK', onPress: onDone }],
      );
    }
  }, [onDone]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (phase === 'countdown' && (next === 'inactive' || next === 'background')) {
        onDone();
      }
    });
    return () => sub.remove();
  }, [phase, onDone]);

  useEffect(() => {
    const rearCountdown =
      cameraReady && phase === 'countdown' && session.facing === 'back';
    if (!rearCountdown) {
      setTorchPulseOn(false);
      return;
    }

    const PULSE_ON_MS = 110;
    const PULSE_INTERVAL_MS = 950;
    let offTimeout: ReturnType<typeof setTimeout> | undefined;

    const pulseOnce = () => {
      if (offTimeout) clearTimeout(offTimeout);
      setTorchPulseOn(true);
      offTimeout = setTimeout(() => setTorchPulseOn(false), PULSE_ON_MS);
    };

    pulseOnce();
    const intervalId = setInterval(pulseOnce, PULSE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      if (offTimeout) clearTimeout(offTimeout);
      setTorchPulseOn(false);
    };
  }, [cameraReady, phase, session.facing]);

  useEffect(() => {
    if (!cameraReady || phase !== 'countdown') return;
    captureTriggeredRef.current = false;
    const end = Date.now() + session.countdownSeconds * 1000;
    let lastTickedSecond: number | null = null;

    const id = setInterval(() => {
      if (captureTriggeredRef.current) return;
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (session.vibrationEnabled && remaining > 0 && lastTickedSecond !== remaining) {
        lastTickedSecond = remaining;
        playCountdownTick();
      }

      if (remaining <= 0 && !captureTriggeredRef.current) {
        captureTriggeredRef.current = true;
        clearInterval(id);
        void startCapture();
      }
    }, 50);

    return () => clearInterval(id);
  }, [
    cameraReady,
    phase,
    session.countdownSeconds,
    session.vibrationEnabled,
    startCapture,
  ]);

  useEffect(() => {
    if (phase !== 'recording') return;
    const started = Date.now();
    const id = setInterval(() => {
      setRecordingElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  const handleStopRecording = useCallback(async () => {
    cameraRef.current?.stopRecording();
    try {
      const result = await recordingPromiseRef.current;
      const uri = result?.uri;
      if (!uri) {
        throw new Error('No video file was created');
      }
      setPhase('saving');
      await saveToLibraryAsync(uri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDone();
    } catch (e) {
      console.warn(e);
      if (e instanceof MediaLibraryPermissionError) {
        Alert.alert('Photos access needed', e.message, [
          { text: 'Not now', style: 'cancel', onPress: onDone },
          {
            text: 'Settings',
            onPress: () => {
              void Linking.openSettings();
              onDone();
            },
          },
        ]);
        return;
      }
      Alert.alert(
        'Could not finish recording',
        e instanceof Error ? e.message : 'Try again.',
        [{ text: 'OK', onPress: onDone }],
      );
    }
  }, [onDone]);

  if (mountError) {
    return (
      <View style={[styles.fallback, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.fallbackTitle}>Camera unavailable</Text>
        <Text style={styles.fallbackBody}>{mountError}</Text>
        <Pressable onPress={onDone} style={styles.fallbackBtn}>
          <Text style={styles.fallbackBtnText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const cameraMode = session.mediaMode === 'video' ? 'video' : 'picture';
  const enableTorch =
    phase === 'countdown' && session.facing === 'back' && torchPulseOn;

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={session.facing}
        mode={cameraMode}
        mute={session.mediaMode === 'picture'}
        enableTorch={enableTorch}
        flash="off"
        videoQuality="720p"
        responsiveOrientationWhenOrientationLocked
        onCameraReady={() => setCameraReady(true)}
        onMountError={(event) => {
          setMountError(event.message);
        }}
      />

      {phase === 'countdown' && <CountdownOverlay secondsLeft={secondsLeft} />}

      {phase === 'recording' && (
        <RecordingHUD elapsedSeconds={recordingElapsed} onStop={handleStopRecording} />
      )}

      {phase === 'saving' && (
        <View style={styles.savingOverlay}>
          <Text style={styles.savingText}>Saving to library…</Text>
        </View>
      )}

      {phase === 'countdown' && (
        <View
          pointerEvents="box-none"
          style={[styles.cancelRow, { paddingBottom: insets.bottom + 16 }]}
        >
          <Pressable
            onPress={onDone}
            style={({ pressed }) => [styles.cancelPressable, pressed && styles.cancelPressablePressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel countdown"
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  cancelRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '22%',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPressable: {
    minWidth: 280,
    minHeight: 60,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelPressablePressed: {
    opacity: 0.88,
  },
  cancelLabel: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  fallback: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  fallbackBody: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
  },
  fallbackBtn: {
    marginTop: 28,
    alignSelf: 'flex-start',
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackBtnText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
});
