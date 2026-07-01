import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from "expo-router/ui";
import { forwardRef, Ref, useEffect } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  ActivityIcon,
  CalendarIcon,
  SunRaysIcon,
  UserIcon,
} from "@/components/icons";

type TabIcon = (props: { color?: string; size?: number }) => React.JSX.Element;

type TabButtonProps = TabTriggerSlotProps & {
  icon: TabIcon;
  label: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Strong ease-out curve — built-in easings are too weak for enter/exit.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

const PILL = "#14161B";
const ICON_OFF = "#9aa0a8";

// The active tab morphs into a dark pill with an icon + label; inactive tabs
// are icon-only. Everything is driven off a single `focus` value so the pill
// expands, the background fades, and the icon crossfades in sync — rather than
// hard-swapping between two layouts.
const TabButton = forwardRef(function TabButton(
  { icon: Icon, label, isFocused, onPressIn, onPressOut, ...props }: TabButtonProps,
  ref: Ref<View>,
) {
  const reduceMotion = useReducedMotion();
  const focus = useSharedValue(isFocused ? 1 : 0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    focus.value = reduceMotion
      ? (isFocused ? 1 : 0)
      : withTiming(isFocused ? 1 : 0, { duration: 240, easing: EASE_OUT });
  }, [isFocused, reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      focus.value,
      [0, 1],
      ["rgba(20,22,27,0)", "rgba(20,22,27,1)"],
    ),
    paddingHorizontal: interpolate(focus.value, [0, 1], [0, 18]),
    gap: interpolate(focus.value, [0, 1], [0, 7]),
    // Press feedback — subtle scale so the tap feels heard.
    transform: [{ scale: 1 - pressed.value * 0.06 }],
  }));

  const iconActive = useAnimatedStyle(() => ({ opacity: focus.value }));
  const iconInactive = useAnimatedStyle(() => ({ opacity: 1 - focus.value }));

  return (
    <AnimatedPressable
      ref={ref}
      {...props}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 120, easing: EASE_OUT });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: 160, easing: EASE_OUT });
        onPressOut?.(e);
      }}
      // Animates the pill's width change as the label enters/exits.
      layout={LinearTransition.duration(240).easing(EASE_OUT)}
      style={[
        {
          height: 46,
          minWidth: 46,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 22,
        },
        containerStyle,
      ]}
    >
      <View className="h-[21px] w-[21px] items-center justify-center">
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.iconCenter, iconActive]}
        >
          <Icon color="#fff" size={20} />
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.iconCenter, iconInactive]}
        >
          <Icon color={ICON_OFF} size={20} />
        </Animated.View>
      </View>

      {isFocused && (
        <Animated.Text
          entering={reduceMotion ? undefined : FadeIn.duration(180).easing(EASE_OUT)}
          exiting={reduceMotion ? undefined : FadeOut.duration(120)}
          numberOfLines={1}
          className="text-[14.5px] font-semibold tracking-tight text-white"
        >
          {label}
        </Animated.Text>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  iconCenter: { alignItems: "center", justifyContent: "center" },
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const barStyle: ViewStyle = {
    position: "absolute",
    alignSelf: "center",
    bottom: insets.bottom + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(20,22,27,0.06)",
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: PILL,
    shadowOpacity: 0.16,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  };

  return (
    <Tabs>
      <TabSlot />
      <TabList style={barStyle}>
        <TabTrigger name="home" href="/home" asChild>
          <TabButton icon={SunRaysIcon} label="Today" />
        </TabTrigger>
        <TabTrigger name="forecast" href="/forecast" asChild>
          <TabButton icon={ActivityIcon} label="Forecast" />
        </TabTrigger>
        <TabTrigger name="calendar" href="/calendar" asChild>
          <TabButton icon={CalendarIcon} label="Routine" />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton icon={UserIcon} label="Profile" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
