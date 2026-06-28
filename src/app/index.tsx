import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import AnimatedSun from "@/components/AnimatedSun";

function LocationPin() {
  return (
    <Svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6E727B"
      strokeWidth={2.2}
    >
      <Path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <Circle cx={12} cy={10} r={2.4} />
    </Svg>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-[#F4F5F7] px-3.5 py-3">
      <Text className="text-xs font-medium text-[#9aa0a8]">{label}</Text>
      <Text className="mt-0.5 text-[17px] font-bold tracking-tight text-[#14161B]">
        {value}
      </Text>
    </View>
  );
}

export default function Index() {
  return (
    <View className="flex-1 bg-[#F7F8FA]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-between px-7 pb-6 pt-8">
          {/* Animated sun hero */}
          <View className="items-center">
            <AnimatedSun />
            <Text className="mt-2.5 text-center text-3xl font-bold leading-9 tracking-tight text-[#14161B]">
              Welcome to Sunny
            </Text>
          </View>

          {/* Glanceable preview card */}
          <View
            className="rounded-3xl bg-white px-5 pb-6 pt-5"
            style={{
              shadowColor: "#14161B",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <LocationPin />
                <Text className="text-[13.5px] font-medium text-[#6E727B]">
                  Austin, TX
                </Text>
              </View>
              <Text className="text-[13.5px] font-medium text-[#9aa0a8]">
                Now · 1:20 PM
              </Text>
            </View>

            <View className="mt-3.5 flex-row items-baseline gap-2.5">
              <Text className="text-[60px] font-bold leading-[54px] tracking-tighter text-[#14161B]">
                7
              </Text>
              <View className="gap-0.5">
                <Text className="text-[13px] font-semibold uppercase tracking-wide text-[#9aa0a8]">
                  UV Index
                </Text>
                <View className="self-start rounded-lg bg-[#fbeed9] px-2.5 py-0.5">
                  <Text className="text-[13px] font-semibold text-[#E2912A]">
                    High
                  </Text>
                </View>
              </View>
            </View>

            {/* UV scale */}
            <View className="mt-[18px]">
              <LinearGradient
                colors={["#5FBF6A", "#E9C44A", "#E2912A", "#D9534F", "#8E5BD0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: 8, borderRadius: 4 }}
              />
              <View
                className="absolute h-4 w-4 rounded-full border-[3px] border-[#14161B] bg-white"
                style={{
                  left: "62%",
                  top: 4,
                  marginLeft: -8,
                  marginTop: -8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.18,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              />
            </View>
            <View className="mt-[7px] flex-row justify-between">
              <Text className="text-[11.5px] font-medium text-[#b6bac1]">
                Low
              </Text>
              <Text className="text-[11.5px] font-medium text-[#b6bac1]">
                Moderate
              </Text>
              <Text className="text-[11.5px] font-medium text-[#b6bac1]">
                Very High
              </Text>
            </View>

            <View className="mt-5 flex-row gap-2.5">
              <StatTile label="Wear" value="SPF 30" />
              <StatTile label="Reapply in" value="2 hrs" />
            </View>
          </View>

          {/* Footer */}
          <View className="items-center gap-[18px]">
            <Text className="text-center text-[12.5px] text-[#9aa0a8]">
              Your skin profile stays private on your device.
            </Text>
            <Pressable
              className="h-[54px] w-full items-center justify-center rounded-2xl bg-[#14161B] active:opacity-[0.88]"
              onPress={() => router.push("/sign-up")}
            >
              <Text className="text-[17px] font-semibold tracking-tight text-white">
                Get Started
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push("/log-in")}>
              <Text className="text-[14.5px] text-[#6E727B]">
                Already have an account?{" "}
                <Text className="font-semibold text-[#14161B]">Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
