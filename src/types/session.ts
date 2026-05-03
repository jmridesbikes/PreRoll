import type { CameraType } from 'expo-camera';

export type MediaMode = 'video' | 'picture';

/** Maps to `CameraView` flash (front + on uses `screen` in capture). */
export type PhotoFlashMode = 'off' | 'on' | 'auto';

export type CaptureSession = {
  countdownSeconds: number;
  mediaMode: MediaMode;
  facing: CameraType;
  vibrationEnabled: boolean;
  photoFlashMode: PhotoFlashMode;
  /** Rear torch stays on during countdown and recording for video. */
  videoSolidTorch: boolean;
};
