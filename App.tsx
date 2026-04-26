import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CaptureScreen } from './src/screens/CaptureScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import type { CaptureSession } from './src/types/session';
import { colors } from './src/theme/colors';

export default function App() {
  const [session, setSession] = useState<CaptureSession | null>(null);

  const handleDone = useCallback(() => {
    setSession(null);
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        {session ? (
          <CaptureScreen session={session} onDone={handleDone} />
        ) : (
          <SetupScreen onStart={setSession} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
