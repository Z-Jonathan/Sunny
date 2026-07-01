import { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

/** A looping opacity pulse shared by every bone in a skeleton. */
export function useSkeletonPulse() {
  const value = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0.5,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [value]);
  return value;
}

/** A single grey placeholder block driven by a shared pulse value. */
export function Bone({
  opacity,
  style,
}: {
  opacity: Animated.Value;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      style={[{ backgroundColor: "#E7E9ED", borderRadius: 12, opacity }, style]}
    />
  );
}
