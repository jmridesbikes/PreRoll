import { Alert, Linking, Platform } from 'react-native';

const IOS_PHOTOS_URL = 'photos-redirect://';
/** Primary image collection on many Android devices */
const ANDROID_MEDIA_IMAGES = 'content://media/external/images/media';

export async function openSystemGallery(): Promise<void> {
  const url = Platform.OS === 'ios' ? IOS_PHOTOS_URL : ANDROID_MEDIA_IMAGES;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Gallery',
      'Could not open the Photos app from here. Open Photos or your gallery from the home screen.',
    );
  }
}
