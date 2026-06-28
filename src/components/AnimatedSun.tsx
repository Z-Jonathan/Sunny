import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { G, Line } from "react-native-svg";

const SUN_COLOR = "#E2912A";

const RAYS: [number, number, number, number][] = [
  [100, 34, 100, 14],
  [100, 166, 100, 186],
  [34, 100, 14, 100],
  [166, 100, 186, 100],
  [53.4, 53.4, 39.3, 39.3],
  [146.6, 146.6, 160.7, 160.7],
  [146.6, 53.4, 160.7, 39.3],
  [53.4, 146.6, 39.3, 160.7],
];

function Ring({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 3600, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.55, 1.6]) }],
    opacity: interpolate(progress.value, [0, 0.25, 1], [0, 0.55, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 1.5,
          borderColor: SUN_COLOR,
        },
        style,
      ]}
    />
  );
}

export default function AnimatedSun() {
  const spin = useSharedValue(0);
  const corePulse = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 26000, easing: Easing.linear }),
      -1,
      false,
    );
    corePulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [spin, corePulse]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(corePulse.value, [0, 1], [1, 1.05]) }],
  }));

  return (
    <View
      style={{
        position: "relative",
        width: 200,
        height: 200,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ring delay={0} />
      <Ring delay={1200} />
      <Ring delay={2400} />

      <Animated.View style={[{ position: "absolute" }, spinStyle]}>
        <Svg width={200} height={200} viewBox="0 0 200 200">
          <G stroke={SUN_COLOR} strokeWidth={4} strokeLinecap="round">
            {RAYS.map(([x1, y1, x2, y2], i) => (
              <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </G>
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          {
            width: 84,
            height: 84,
            borderRadius: 42,
            shadowColor: SUN_COLOR,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 15,
            elevation: 8,
          },
          coreStyle,
        ]}
      >
        <LinearGradient
          colors={["#F5B85C", "#E2912A"]}
          start={{ x: 0.38, y: 0.32 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 42 }}
        />
      </Animated.View>
    </View>
  );
}
