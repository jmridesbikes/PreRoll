import * as MediaLibrary from 'expo-media-library';

export class MediaLibraryPermissionError extends Error {
  constructor() {
    super('Photos access is required to save your recording.');
    this.name = 'MediaLibraryPermissionError';
  }
}

export async function saveToLibraryAsync(uri: string): Promise<void> {
  const existing = await MediaLibrary.getPermissionsAsync();
  let granted = existing.status === 'granted';
  if (!granted) {
    const req = await MediaLibrary.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) {
    throw new MediaLibraryPermissionError();
  }
  await MediaLibrary.saveToLibraryAsync(uri);
}
