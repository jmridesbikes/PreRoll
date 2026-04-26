import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  secondsLeft: number;
};

export function CountdownOverlay({ secondsLeft }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = secondsLeft <= 3 && secondsLeft > 0;

  useEffect(() => {
    if (!pulse) {
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, scale]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.Text style={[styles.number, { transform: [{ scale }] }]}>
        {secondsLeft > 0 ? String(secondsLeft) : '—'}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  number: {
    fontSize: 120,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
