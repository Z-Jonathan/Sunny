import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Path,
  RadialGradient,
  Stop,
  Circle as SvgCircle,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

import {
  ChevronRightIcon,
  FlameIcon,
  PinIcon,
  RefreshIcon,
  TargetIcon,
} from "@/components/icons";
import TodaySkeleton from "@/components/TodaySkeleton";
import { useUVToday } from "@/hooks/useUVToday";
import { supabase } from "@/lib/supabase";
import { FALLBACK_VIEW, uvArcPath } from "@/lib/uv";

const cardShadow = {
  shadowColor: "#14161B",
  shadowOpacity: 0.05,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
};

const ATTRIBUTION_URL = "https://weatherkit.apple.com/legal-attribution.html";

function greetingFor(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function Home() {
  const [name, setName] = useState("Maya");
  const { view, locationLabel, error, loading, refreshing, refresh } =
    useUVToday();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      const display =
        (user?.user_metadata?.full_name as string | undefined) ??
        user?.email?.split("@")[0];
      if (display) setName(display.charAt(0).toUpperCase() + display.slice(1));
    });
  }, []);

  const greeting = greetingFor(new Date().getHours());
  const initial = name.charAt(0).toUpperCase();

  // Real data once it loads; the polished sample until then (and on Android/web).
  const v = view ?? FALLBACK_VIEW;
  // First load with nothing to show yet → skeleton. On error/non-iOS we fall
  // straight to the sample view instead.
  const showSkeleton = loading && view === null;

  return (
    <View className="flex-1 bg-[#F7F8FA]">
      <StatusBar style="dark" />

      {/* soft warm wash behind hero */}
      <Svg
        width={380}
        height={380}
        style={{ position: "absolute", top: -90, alignSelf: "center" }}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="wash" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#E2912A" stopOpacity={0.16} />
            <Stop offset="0.68" stopColor="#E2912A" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <SvgCircle cx={190} cy={190} r={190} fill="url(#wash)" />
      </Svg>

      <SafeAreaView className="flex-1" edges={["top"]}>
        {showSkeleton ? (
          <TodaySkeleton />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor="#E2912A"
                colors={["#E2912A"]}
              />
            }
            contentContainerStyle={{
              paddingHorizontal: 22,
              paddingTop: 12,
              paddingBottom: 130,
            }}
          >
            {/* top bar: greeting + avatar */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-medium text-[#9aa0a8]">
                  {greeting}, {name}
                </Text>
                <View className="mt-[3px] flex-row items-center gap-[5px]">
                  <PinIcon />
                  <Text className="text-[18px] font-bold tracking-tight text-[#14161B]">
                    {locationLabel ?? "Locating…"}
                  </Text>
                </View>
              </View>
              <LinearGradient
                colors={["#F5B85C", "#E2912A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#E2912A",
                  shadowOpacity: 0.32,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }}
              >
                <Text className="text-base font-bold text-white">
                  {initial}
                </Text>
              </LinearGradient>
            </View>

            {/* HERO UV dial */}
            <View className="mt-6 items-center">
              <View style={{ width: 268, height: 268 }}>
                <Svg width={268} height={268} viewBox="0 0 268 268">
                  <Defs>
                    <SvgLinearGradient id="uvgrad" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#F5B85C" />
                      <Stop offset="1" stopColor="#E2912A" />
                    </SvgLinearGradient>
                  </Defs>
                  {/* track: 270° arc, gap centered at bottom */}
                  <Path
                    d="M 50.6 217.4 A 118 118 0 1 1 217.4 217.4"
                    fill="none"
                    stroke="#E7E9ED"
                    strokeWidth={18}
                    strokeLinecap="round"
                  />
                  {/* value arc, scaled to the live UV index */}
                  <Path
                    d={uvArcPath(v.ringFill)}
                    fill="none"
                    stroke="url(#uvgrad)"
                    strokeWidth={18}
                    strokeLinecap="round"
                  />
                </Svg>
                <View className="absolute inset-0 items-center justify-center">
                  <Text className="text-[13px] font-semibold uppercase tracking-[1.8px] text-[#9aa0a8]">
                    UV Index
                  </Text>
                  <Text
                    className="text-[#14161B]"
                    style={{
                      fontSize: 92,
                      fontWeight: "700",
                      letterSpacing: -3,
                      lineHeight: 85,
                      marginTop: 4,
                    }}
                  >
                    {v.uvIndex}
                  </Text>
                  <Text className="mt-[4px] overflow-hidden rounded-full bg-[#E2912A]/[0.13] px-[14px] py-1 text-sm font-semibold text-[#E2912A]">
                    {v.category}
                  </Text>
                </View>
              </View>
              <Text className="mt-2 max-w-[250px] text-center text-[14.5px] leading-[20px] text-[#6E727B]">
                {v.blurb}
              </Text>
            </View>

            {/* SPF recommendation banner */}
            <Pressable
              className="mt-[26px] flex-row items-center gap-[14px] rounded-[22px] bg-[#14161B] px-[18px] py-4 active:opacity-90"
              style={{
                shadowColor: "#14161B",
                shadowOpacity: 0.16,
                shadowRadius: 30,
                shadowOffset: { width: 0, height: 12 },
                elevation: 6,
              }}
            >
              <View className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#F5B85C]/[0.22]">
                <TargetIcon />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-medium text-[#9ca0a9]">
                  Recommended for you
                </Text>
                <Text className="mt-[2px] text-[18px] font-bold tracking-tight text-white">
                  Apply {v.spf} now
                </Text>
              </View>
              <ChevronRightIcon />
            </Pressable>

            {/* stat pair: burn time + reapply */}
            <View className="mt-3 flex-row gap-3">
              <View
                className="flex-1 rounded-[22px] bg-white p-[18px]"
                style={cardShadow}
              >
                <View className="h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#D9534F]/10">
                  <FlameIcon />
                </View>
                <Text className="mt-[14px] text-[13px] font-medium text-[#9aa0a8]">
                  Burn time
                </Text>
                <Text className="mt-[3px] text-2xl font-bold tracking-tight text-[#14161B]">
                  {v.burnTime}
                </Text>
                <Text className="mt-[2px] text-[12.5px] text-[#b6bac1]">
                  unprotected
                </Text>
              </View>
              <View
                className="flex-1 rounded-[22px] bg-white p-[18px]"
                style={cardShadow}
              >
                <View className="h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#E2912A]/[0.12]">
                  <RefreshIcon />
                </View>
                <Text className="mt-[14px] text-[13px] font-medium text-[#9aa0a8]">
                  Reapply in
                </Text>
                <Text className="mt-[3px] text-2xl font-bold tracking-tight text-[#14161B]">
                  {v.reapplyIn}
                </Text>
                <Text className="mt-[2px] text-[12.5px] text-[#b6bac1]">
                  {v.reapplyAt}
                </Text>
              </View>
            </View>

            {/* today's peak window */}
            <View
              className="mt-3 rounded-[22px] bg-white px-[18px] pb-4 pt-5"
              style={cardShadow}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold tracking-tight text-[#14161B]">
                  Today&apos;s UV
                </Text>
                <Text className="overflow-hidden rounded-full bg-[#E2912A]/[0.12] px-[11px] py-[3px] text-[13px] font-semibold text-[#E2912A]">
                  {v.peak}
                </Text>
              </View>

              {/* hourly curve */}
              <View className="mt-6 h-24 flex-row items-stretch justify-between gap-[7px]">
                {v.bars.map((bar, i) => (
                  <View key={i} className="flex-1 justify-end">
                    {bar.now ? (
                      <LinearGradient
                        colors={["#F5B85C", "#E2912A"]}
                        style={{
                          width: "100%",
                          height: `${bar.h * 100}%`,
                          borderRadius: 6,
                          shadowColor: "#E2912A",
                          shadowOpacity: 0.4,
                          shadowRadius: 14,
                          shadowOffset: { width: 0, height: 6 },
                          elevation: 4,
                        }}
                      >
                        <Text className="absolute -top-[22px] w-full text-center text-[11px] font-bold text-[#E2912A]">
                          Now
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          height: `${bar.h * 100}%`,
                          borderRadius: 6,
                          backgroundColor: bar.color,
                        }}
                      />
                    )}
                  </View>
                ))}
              </View>
              <View className="mt-[10px] flex-row justify-between">
                {v.axis.map((t, i) => (
                  <Text
                    key={`${t}-${i}`}
                    className="text-[11px] font-medium text-[#b6bac1]"
                  >
                    {t}
                  </Text>
                ))}
              </View>
            </View>

            {error ? (
              <Text className="mt-4 text-center text-[12px] text-[#b6bac1]">
                Showing sample data · {error}
              </Text>
            ) : null}

            {/* Apple WeatherKit attribution (required) */}
            <Pressable
              className="mt-4 self-center"
              onPress={() => Linking.openURL(ATTRIBUTION_URL)}
            >
              <Text className="text-[11px] text-[#b6bac1]"> Weather</Text>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
