import { Image } from "expo-image";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

// Tight-cropped lockup (mark flush-left, "Sunny" to the right), transparent bg.
const LOCKUP = require("../../assets/images/sunny-lockup.png");
const ASPECT = 3.174; // width / height of the cropped asset

const FULL_W = 264;
const HEIGHT = Math.round(FULL_W / ASPECT); // ~83
const MARK_W = Math.round(FULL_W * 0.232); // clip point just past the mark

// Strong ease-out so the extend feels intentional, not linear-limp.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function AnimatedLogo() {
  // enter: mark fades + settles in. extend: word wipes out from behind the mark.
  const enter = useSharedValue(0);
  const extend = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      // Honor reduced motion: fade in the full lockup, no width/scale movement.
      extend.value = 1;
      enter.value = withTiming(1, { duration: 260 });
      return;
    }
    enter.value = withTiming(1, { duration: 420, easing: EASE_OUT });
    // hold on just the mark, then extend to the full lockup
    extend.value = withDelay(
      640,
      withTiming(1, { duration: 720, easing: EASE_OUT }),
    );
  }, [enter, extend, reduceMotion]);

  // The clip window is centered, so the mark starts centered and glides to its
  // final left position as the word reveals — a proper logo reveal.
  const clipStyle = useAnimatedStyle(() => ({
    width: interpolate(extend.value, [0, 1], [MARK_W, FULL_W]),
    opacity: enter.value,
    transform: [
      { scale: interpolate(enter.value, [0, 1], [0.92, 1]) },
    ],
  }));

  return (
    <View style={{ height: HEIGHT, justifyContent: "center" }}>
      <Animated.View
        style={[
          { height: HEIGHT, overflow: "hidden", alignSelf: "center" },
          clipStyle,
        ]}
      >
        <Image
          source={LOCKUP}
          contentFit="contain"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FULL_W,
            height: HEIGHT,
          }}
        />
      </Animated.View>
    </View>
  );
}
