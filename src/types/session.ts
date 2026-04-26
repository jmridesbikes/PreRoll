import type { CameraType } from 'expo-camera';

export type MediaMode = 'video' | 'picture';

export type CaptureSession = {
  countdownSeconds: number;
  mediaMode: MediaMode;
  facing: CameraType;
  vibrationEnabled: boolean;
};
