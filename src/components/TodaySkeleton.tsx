import { View } from "react-native";

import { Bone, useSkeletonPulse } from "@/components/skeleton";

/**
 * Loading placeholder for the Today screen. Bone positions/sizes mirror the
 * real layout so content doesn't jump when the UV data arrives.
 */
export default function TodaySkeleton() {
  const opacity = useSkeletonPulse();

  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 12 }}>
      {/* top bar: greeting + avatar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ gap: 8 }}>
          <Bone opacity={opacity} style={{ width: 130, height: 13, borderRadius: 7 }} />
          <Bone opacity={opacity} style={{ width: 95, height: 18, borderRadius: 9 }} />
        </View>
        <Bone opacity={opacity} style={{ width: 42, height: 42, borderRadius: 21 }} />
      </View>

      {/* hero dial */}
      <View style={{ alignItems: "center", marginTop: 24 }}>
        <Bone opacity={opacity} style={{ width: 268, height: 268, borderRadius: 134 }} />
        <Bone
          opacity={opacity}
          style={{ width: 220, height: 14, borderRadius: 7, marginTop: 16 }}
        />
      </View>

      {/* SPF banner */}
      <Bone opacity={opacity} style={{ height: 78, borderRadius: 22, marginTop: 26 }} />

      {/* stat pair */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <Bone opacity={opacity} style={{ flex: 1, height: 132, borderRadius: 22 }} />
        <Bone opacity={opacity} style={{ flex: 1, height: 132, borderRadius: 22 }} />
      </View>

      {/* today's UV card */}
      <Bone opacity={opacity} style={{ height: 196, borderRadius: 22, marginTop: 12 }} />
    </View>
  );
}
