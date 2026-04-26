import {
  AndroidHaptics,
  ImpactFeedbackStyle,
  impactAsync,
  performAndroidHapticsAsync,
} from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

/**
 * Per-second countdown feedback: motor vibration + haptics.
 * Relying on expo-haptics alone is often too subtle (especially Android + camera preview).
 */
export function playCountdownTick(): void {
  if (Platform.OS === 'android') {
    Vibration.vibrate(65);
    void performAndroidHapticsAsync(AndroidHaptics.Segment_Tick).catch(() => {});
  } else {
    Vibration.vibrate(50);
    void impactAsync(ImpactFeedbackStyle.Medium).catch(() => {});
  }
}
