import { View } from "react-native";

import { Bone, useSkeletonPulse } from "@/components/skeleton";

/**
 * Loading placeholder for the Forecast screen. Bone positions/sizes mirror the
 * real layout (header + segmented control, summary, curve card, callouts,
 * hourly breakdown) so content doesn't jump when the UV data arrives.
 */
export default function ForecastSkeleton() {
  const opacity = useSkeletonPulse();

  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 12 }}>
      {/* header + segmented control */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <View style={{ gap: 8 }}>
          <Bone opacity={opacity} style={{ width: 90, height: 13, borderRadius: 7 }} />
          <Bone opacity={opacity} style={{ width: 110, height: 28, borderRadius: 9 }} />
        </View>
        <Bone opacity={opacity} style={{ width: 128, height: 34, borderRadius: 13 }} />
      </View>

      {/* summary line */}
      <View style={{ gap: 8, marginTop: 16 }}>
        <Bone opacity={opacity} style={{ width: "100%", height: 13, borderRadius: 7 }} />
        <Bone opacity={opacity} style={{ width: "70%", height: 13, borderRadius: 7 }} />
      </View>

      {/* curve card */}
      <Bone opacity={opacity} style={{ height: 190, borderRadius: 24, marginTop: 18 }} />

      {/* window callouts */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
        <Bone opacity={opacity} style={{ flex: 1, height: 96, borderRadius: 20 }} />
        <Bone opacity={opacity} style={{ flex: 1, height: 96, borderRadius: 20 }} />
      </View>

      {/* hourly breakdown */}
      <Bone opacity={opacity} style={{ height: 280, borderRadius: 22, marginTop: 14 }} />
    </View>
  );
}
