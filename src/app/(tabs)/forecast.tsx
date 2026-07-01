import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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
  G,
  Line,
  Path,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from "react-native-svg";

import ForecastSkeleton from "@/components/ForecastSkeleton";
import { AlertCircleIcon } from "@/components/icons";
import { useUVData } from "@/hooks/useUVData";
import {
  deriveForecast,
  deriveWeek,
  FALLBACK_FORECAST,
  FALLBACK_WEEK,
  FORECAST_AXIS,
  FORECAST_VB,
} from "@/lib/uv";

const cardShadow = {
  shadowColor: "#14161B",
  shadowOpacity: 0.05,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
};

const ATTRIBUTION_URL = "https://weatherkit.apple.com/legal-attribution.html";

function LegendDot({ color }: { color: string }) {
  return (
    <View
      style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }}
    />
  );
}

export default function Forecast() {
  const { data, error, loading, refreshing, refresh } = useUVData();
  const [range, setRange] = useState<"today" | "week">("today");
  const [chartW, setChartW] = useState(0);

  const v = data ? deriveForecast(data) : FALLBACK_FORECAST;
  const week = data ? deriveWeek(data) : FALLBACK_WEEK;
  // First load with nothing to show yet → skeleton. On error/non-iOS we fall
  // straight to the sample view instead.
  const showSkeleton = loading && data === null;

  const chartH = chartW ? chartW * (FORECAST_VB.h / FORECAST_VB.w) : 120;
  const nowXVb = (v.nowXPct / 100) * FORECAST_VB.w;
  const nowYVb = (v.nowYPct / 100) * FORECAST_VB.h;

  return (
    <View className="flex-1 bg-[#F7F8FA]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        {showSkeleton ? (
          <ForecastSkeleton />
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
            {/* header */}
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-sm font-medium text-[#9aa0a8]">
                  UV Forecast
                </Text>
                <Text className="mt-[3px] text-[28px] font-bold tracking-tight text-[#14161B]">
                  {range === "week" ? "This week" : "Today"}
                </Text>
              </View>
              <View className="flex-row gap-[6px] rounded-[13px] bg-[#ECEEF1] p-1">
                {(["today", "week"] as const).map((r) => {
                  const active = range === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRange(r)}
                      className="rounded-[10px] px-[14px] py-[6px]"
                      style={
                        active
                          ? {
                              backgroundColor: "#fff",
                              shadowColor: "#14161B",
                              shadowOpacity: 0.08,
                              shadowRadius: 2,
                              shadowOffset: { width: 0, height: 1 },
                              elevation: 1,
                            }
                          : undefined
                      }
                    >
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: active ? "#14161B" : "#9aa0a8" }}
                      >
                        {r === "today" ? "Today" : "Week"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {range === "week" ? (
              <>
                {/* summary line */}
                <View className="mt-4 flex-row items-center gap-2">
                  <AlertCircleIcon />
                  <Text className="flex-1 text-[15px] leading-[22px] text-[#6E727B]">
                    {week.summaryUv >= 6 ? (
                      <>
                        <Text className="font-semibold text-[#14161B]">
                          {week.summaryDay}
                        </Text>{" "}
                        is the harshest — UV {week.summaryUv}. Stay covered
                        midday all week.
                      </>
                    ) : (
                      <>Low UV all week — minimal protection needed.</>
                    )}
                  </Text>
                </View>

                {/* week bar chart */}
                <View
                  className="mt-[18px] rounded-[24px] bg-white px-[18px] pb-[18px] pt-[22px]"
                  style={cardShadow}
                >
                  <View className="mb-5 flex-row items-center justify-between">
                    <Text className="text-base font-bold tracking-tight text-[#14161B]">
                      Peak UV by day
                    </Text>
                    <Text className="text-[12.5px] font-semibold text-[#9aa0a8]">
                      7-day
                    </Text>
                  </View>

                  <View
                    className="flex-row items-end justify-between gap-[9px]"
                    style={{ height: 160 }}
                  >
                    {week.days.map((d, i) => (
                      <View
                        key={`${d.label}-${i}`}
                        className="flex-1 items-center"
                        style={{ height: "100%" }}
                      >
                        <View className="w-full flex-1 items-center justify-end">
                          <Text
                            className="mb-[6px] text-[13px] font-bold"
                            style={{ color: d.tagColor }}
                          >
                            {d.uv}
                          </Text>
                          <View
                            style={{
                              width: "100%",
                              maxWidth: 26,
                              height: `${d.fillPct}%`,
                              borderRadius: 7,
                              backgroundColor: d.barColor,
                              ...(d.glow
                                ? {
                                    shadowColor: "#D9534F",
                                    shadowOpacity: 0.35,
                                    shadowRadius: 16,
                                    shadowOffset: { width: 0, height: 6 },
                                    elevation: 6,
                                  }
                                : null),
                            }}
                          />
                        </View>
                        <Text
                          className="mt-[10px] text-[12px] font-semibold"
                          style={{ color: d.labelColor }}
                        >
                          {d.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* week stat pair */}
                <View className="mt-[14px] flex-row gap-3">
                  <View
                    className="flex-1 rounded-[20px] bg-white p-4"
                    style={cardShadow}
                  >
                    <Text className="text-[13px] font-semibold text-[#6E727B]">
                      Week's high
                    </Text>
                    <View className="mt-2 flex-row items-baseline gap-[6px]">
                      <Text className="text-[30px] font-bold tracking-tight text-[#14161B]">
                        {week.weekHigh.uv}
                      </Text>
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: week.weekHigh.tagColor }}
                      >
                        {week.weekHigh.tag}
                      </Text>
                    </View>
                    <Text className="mt-[2px] text-[13px] text-[#9aa0a8]">
                      {week.weekHigh.day}
                    </Text>
                  </View>
                  <View
                    className="flex-1 rounded-[20px] bg-white p-4"
                    style={cardShadow}
                  >
                    <Text className="text-[13px] font-semibold text-[#6E727B]">
                      Calmest day
                    </Text>
                    <View className="mt-2 flex-row items-baseline gap-[6px]">
                      <Text className="text-[30px] font-bold tracking-tight text-[#14161B]">
                        {week.calmest.uv}
                      </Text>
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: week.calmest.tagColor }}
                      >
                        {week.calmest.tag}
                      </Text>
                    </View>
                    <Text className="mt-[2px] text-[13px] text-[#9aa0a8]">
                      {week.calmest.day}
                    </Text>
                  </View>
                </View>

                {/* daily list */}
                <View
                  className="mt-[14px] rounded-[22px] bg-white px-[18px] py-[6px]"
                  style={cardShadow}
                >
                  {week.days.map((d, i) => (
                    <View
                      key={`row-${d.label}-${i}`}
                      className="flex-row items-center gap-[14px] py-[14px]"
                      style={{
                        borderBottomWidth: i === week.days.length - 1 ? 0 : 1,
                        borderBottomColor: "#F1F2F4",
                      }}
                    >
                      <Text
                        className="w-[42px] text-[14.5px] font-semibold"
                        style={{ color: d.dayColor }}
                      >
                        {d.day}
                      </Text>
                      <Text className="w-[58px] text-[13px] font-medium text-[#9aa0a8]">
                        {d.date}
                      </Text>
                      <View className="h-2 flex-1 overflow-hidden rounded-[4px] bg-[#EEF0F3]">
                        <View
                          style={{
                            height: "100%",
                            width: `${d.fillPct}%`,
                            borderRadius: 4,
                            backgroundColor: d.barColor,
                          }}
                        />
                      </View>
                      <Text className="w-[20px] text-right text-[15px] font-bold text-[#14161B]">
                        {d.uv}
                      </Text>
                      <Text
                        className="w-[70px] text-right text-[12.5px] font-semibold"
                        style={{ color: d.tagColor }}
                      >
                        {d.tag}
                      </Text>
                    </View>
                  ))}
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
              </>
            ) : (
              <>
                {/* summary line */}
                <View className="mt-4 flex-row items-center gap-2">
                  <AlertCircleIcon />
                  <Text className="flex-1 text-[15px] leading-[22px] text-[#6E727B]">
                    Peaks at{" "}
                    <Text className="font-semibold text-[#14161B]">
                      UV {v.peakUv}
                    </Text>{" "}
                    around {v.peakTimeLabel}. Cover up between{" "}
                    <Text className="font-semibold text-[#14161B]">
                      {v.peakWindowLabel}
                    </Text>
                    .
                  </Text>
                </View>

                {/* curve card */}
                <View
                  className="mt-[18px] rounded-[24px] bg-white px-[18px] pb-[18px] pt-[22px]"
                  style={cardShadow}
                >
                  {/* legend */}
                  <View className="mb-[18px] flex-row gap-4">
                    <View className="flex-row items-center gap-[6px]">
                      <LegendDot color="#5FBF6A" />
                      <Text className="text-[12.5px] font-medium text-[#6E727B]">
                        Safe
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-[6px]">
                      <LegendDot color="#E2912A" />
                      <Text className="text-[12.5px] font-medium text-[#6E727B]">
                        Peak — protect
                      </Text>
                    </View>
                  </View>

                  {/* chart */}
                  <View
                    onLayout={(e) => setChartW(e.nativeEvent.layout.width)}
                    style={{ position: "relative", height: chartH }}
                  >
                    <Svg
                      width="100%"
                      height="100%"
                      viewBox={`0 0 ${FORECAST_VB.w} ${FORECAST_VB.h}`}
                      preserveAspectRatio="none"
                    >
                      <Defs>
                        <SvgLinearGradient
                          id="fc-area"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <Stop
                            offset="0"
                            stopColor="#E2912A"
                            stopOpacity={0.28}
                          />
                          <Stop
                            offset="1"
                            stopColor="#E2912A"
                            stopOpacity={0.02}
                          />
                        </SvgLinearGradient>
                        <SvgLinearGradient
                          id="fc-line"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <Stop offset="0" stopColor="#5FBF6A" />
                          <Stop offset="0.22" stopColor="#9DB84A" />
                          <Stop offset="0.5" stopColor="#E2912A" />
                          <Stop offset="0.78" stopColor="#9DB84A" />
                          <Stop offset="1" stopColor="#5FBF6A" />
                        </SvgLinearGradient>
                      </Defs>

                      {/* gridlines */}
                      <G stroke="#EEF0F3" strokeWidth={1}>
                        <Line x1={0} y1={50} x2={FORECAST_VB.w} y2={50} />
                        <Line x1={0} y1={100} x2={FORECAST_VB.w} y2={100} />
                        <Line x1={0} y1={150} x2={FORECAST_VB.w} y2={150} />
                      </G>

                      {/* shaded windows */}
                      {v.safeRects.map((r, i) => (
                        <Rect
                          key={`safe-${i}`}
                          x={r.x}
                          y={0}
                          width={r.width}
                          height={FORECAST_VB.baseline}
                          fill="#5FBF6A"
                          opacity={0.07}
                        />
                      ))}
                      {v.peakRect ? (
                        <Rect
                          x={v.peakRect.x}
                          y={0}
                          width={v.peakRect.width}
                          height={FORECAST_VB.baseline}
                          fill="#E2912A"
                          opacity={0.09}
                        />
                      ) : null}

                      {/* area + line */}
                      <Path d={v.areaPath} fill="url(#fc-area)" />
                      <Path
                        d={v.linePath}
                        fill="none"
                        stroke="url(#fc-line)"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                      />

                      {/* now marker line */}
                      {v.nowVisible ? (
                        <Line
                          x1={nowXVb}
                          y1={nowYVb}
                          x2={nowXVb}
                          y2={FORECAST_VB.baseline}
                          stroke="#E2912A"
                          strokeWidth={1.5}
                          strokeDasharray="3 4"
                        />
                      ) : null}
                    </Svg>

                    {/* now dot + label (overlay so they stay crisp) */}
                    {v.nowVisible ? (
                      <>
                        <View
                          style={{
                            position: "absolute",
                            left: `${v.nowXPct}%`,
                            top: `${v.nowYPct}%`,
                            marginLeft: -7,
                            marginTop: -7,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: "#fff",
                            borderWidth: 3,
                            borderColor: "#E2912A",
                          }}
                        />
                        <View
                          style={{
                            position: "absolute",
                            left: `${v.nowXPct}%`,
                            top: -4,
                            transform: [{ translateX: -30 }],
                            backgroundColor: "#14161B",
                            paddingHorizontal: 9,
                            paddingVertical: 3,
                            borderRadius: 8,
                          }}
                        >
                          <Text className="text-[11px] font-bold text-white">
                            Now · {v.nowUv}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>

                  {/* x axis */}
                  <View className="mt-3 flex-row justify-between">
                    {FORECAST_AXIS.map((t, i) => (
                      <Text
                        key={`${t}-${i}`}
                        className="text-[11.5px] font-medium text-[#b6bac1]"
                      >
                        {t}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* window callouts */}
                <View className="mt-[14px] flex-row gap-3">
                  <View
                    className="flex-1 rounded-[20px] bg-white p-4"
                    style={cardShadow}
                  >
                    <View className="flex-row items-center gap-[7px]">
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 5,
                          backgroundColor: "#5FBF6A",
                        }}
                      />
                      <Text className="text-[13px] font-semibold text-[#6E727B]">
                        Safe windows
                      </Text>
                    </View>
                    <Text className="mt-[10px] text-[17px] font-bold tracking-tight text-[#14161B]">
                      {v.safeBefore}
                    </Text>
                    {v.safeAfter ? (
                      <Text className="text-[17px] font-bold tracking-tight text-[#14161B]">
                        {v.safeAfter}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    className="flex-1 rounded-[20px] bg-white p-4"
                    style={cardShadow}
                  >
                    <View className="flex-row items-center gap-[7px]">
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 5,
                          backgroundColor: "#E2912A",
                        }}
                      />
                      <Text className="text-[13px] font-semibold text-[#6E727B]">
                        Peak window
                      </Text>
                    </View>
                    <Text className="mt-[10px] text-[17px] font-bold tracking-tight text-[#14161B]">
                      {v.peakWindowFull ?? "None today"}
                    </Text>
                    <Text className="mt-[2px] text-[13px] text-[#9aa0a8]">
                      SPF 30 + reapply
                    </Text>
                  </View>
                </View>

                {/* hourly breakdown */}
                <View
                  className="mt-[14px] rounded-[22px] bg-white px-[18px] py-[6px]"
                  style={cardShadow}
                >
                  {v.rows.map((row, i) => (
                    <View
                      key={`${row.time}-${i}`}
                      className="flex-row items-center gap-[14px] py-[13px]"
                      style={{
                        borderBottomWidth: i === v.rows.length - 1 ? 0 : 1,
                        borderBottomColor: "#F1F2F4",
                      }}
                    >
                      <Text className="w-[46px] text-[14.5px] font-semibold text-[#14161B]">
                        {row.time}
                      </Text>
                      <View className="h-2 flex-1 overflow-hidden rounded-[4px] bg-[#EEF0F3]">
                        <View
                          style={{
                            height: "100%",
                            width: `${row.pct * 100}%`,
                            borderRadius: 4,
                            backgroundColor: row.barColor,
                          }}
                        />
                      </View>
                      <Text className="w-[22px] text-right text-[15px] font-bold text-[#14161B]">
                        {row.uv}
                      </Text>
                      <Text
                        className="w-[64px] text-right text-[12.5px] font-semibold"
                        style={{ color: row.tagColor }}
                      >
                        {row.tag}
                      </Text>
                    </View>
                  ))}
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
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
