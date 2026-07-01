import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  CheckIcon,
  ClockIcon,
  CloseIcon,
  MinusIcon,
  PathIcon,
  PlusIcon,
  ShieldIcon,
} from "@/components/icons";
import { useUVData } from "@/hooks/useUVData";
import {
  Activity,
  deriveActivities,
  Env,
  ENVS,
  envPath,
  fmtTime,
  PRESETS,
} from "@/lib/routine";
import { dayKey, readRoutine, writeRoutine } from "@/lib/routineStore";
import type { RoutineSnapshot } from "@/lib/routineStore";
import {
  fetchRemoteRoutine,
  subscribeRoutine,
  upsertRemoteRoutine,
} from "@/lib/routineSync";
import { supabase } from "@/lib/supabase";

const cardShadow = {
  shadowColor: "#14161B",
  shadowOpacity: 0.05,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const ACCENT = "#E2912A";
const ACCENT_TINT = "rgba(226,145,42,0.12)";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Draft = { name: string; start: number; end: number; env: Env };
const EMPTY_DRAFT: Draft = { name: "", start: 14, end: 15, env: "Everyday" };

export default function Routine() {
  const { data } = useUVData();

  // Routines are per-account: storage is keyed by the signed-in user's id, so a
  // different account only ever sees its own routine. `undefined` = auth not yet
  // resolved, `null` = signed out.
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data: u }) => {
      if (active) setUserId(u.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // The routine persists within a day and resets to empty at local midnight.
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nextId, setNextId] = useState(1);
  const [day, setDay] = useState(dayKey());
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  // Refs let the async sync / rollover callbacks read the latest values without
  // re-subscribing. `updatedAtRef` is the timestamp of the routine currently in
  // memory — used to ignore stale or self-echoed remote updates.
  const dayRef = useRef(day);
  dayRef.current = day;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const updatedAtRef = useRef(0);

  // Applies a local edit: updates state, caches it locally, and pushes it to
  // Supabase (so other devices get it).
  const commit = useCallback(
    (nextActivities: Activity[], nextNextId: number, nextDay: string) => {
      const snap: RoutineSnapshot = {
        day: nextDay,
        activities: nextActivities,
        nextId: nextNextId,
        updatedAt: Date.now(),
      };
      updatedAtRef.current = snap.updatedAt;
      setActivities(nextActivities);
      setNextId(nextNextId);
      setDay(nextDay);
      const uid = userIdRef.current;
      if (uid) {
        writeRoutine(uid, snap);
        void upsertRemoteRoutine(uid, snap);
      }
    },
    [],
  );

  // Adopts a snapshot from the cache or the server into memory (+ local cache).
  // Unlike `commit` it does NOT push back to Supabase, so it can't echo-loop.
  const adopt = useCallback((snap: RoutineSnapshot, uid: string) => {
    updatedAtRef.current = snap.updatedAt;
    setActivities(snap.activities);
    setNextId(snap.nextId);
    setDay(snap.day);
    writeRoutine(uid, snap);
  }, []);

  // (Re)load whenever the signed-in account changes: paint from the local cache
  // instantly, then reconcile with Supabase (newest `updatedAt` wins).
  useEffect(() => {
    if (userId === undefined) return; // auth not resolved yet
    if (!userId) {
      // Signed out — clear the screen; stored data stays for the next sign-in.
      updatedAtRef.current = 0;
      setActivities([]);
      setNextId(1);
      setDay(dayKey());
      return;
    }

    const today = dayKey();
    const local = readRoutine(userId);
    if (local) {
      updatedAtRef.current = local.updatedAt;
      setActivities(local.activities);
      setNextId(local.nextId);
      setDay(local.day);
    } else {
      updatedAtRef.current = 0;
      setActivities([]);
      setNextId(1);
      setDay(today);
    }

    let active = true;
    (async () => {
      const remote = await fetchRemoteRoutine(userId);
      if (!active || userIdRef.current !== userId) return;
      const remoteToday = remote && remote.day === today ? remote : null;
      const localToday = local && local.day === today ? local : null;
      if (remoteToday && remoteToday.updatedAt > updatedAtRef.current) {
        // Server (another device) has newer data — take it.
        adopt(remoteToday, userId);
      } else if (
        localToday &&
        localToday.updatedAt > (remoteToday?.updatedAt ?? 0)
      ) {
        // Local is ahead (offline edits, or the server has none) — push it up.
        void upsertRemoteRoutine(userId, localToday);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, adopt]);

  // Live updates pushed from another device while this screen is open.
  useEffect(() => {
    if (!userId) return;
    return subscribeRoutine(userId, (snap) => {
      if (userIdRef.current !== userId) return;
      // Only adopt strictly-newer, same-day snapshots (ignores our own echo).
      if (snap.day === dayKey() && snap.updatedAt > updatedAtRef.current) {
        adopt(snap, userId);
      }
    });
  }, [userId, adopt]);

  // Roll over to a fresh, empty day when the calendar date has changed.
  const checkRollover = useCallback(() => {
    if (dayRef.current !== dayKey()) commit([], 1, dayKey());
  }, [commit]);

  // Catch a rollover that happens while the app is backgrounded…
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") checkRollover();
    });
    return () => sub.remove();
  }, [checkRollover]);

  // …and one that happens while the app is open. Re-armed after each day change.
  useEffect(() => {
    const t = new Date();
    const midnight = new Date(
      t.getFullYear(),
      t.getMonth(),
      t.getDate() + 1,
      0,
      0,
      2,
    );
    const timer = setTimeout(checkRollover, midnight.getTime() - t.getTime());
    return () => clearTimeout(timer);
  }, [day, checkRollover]);

  const now = new Date();
  const dateLabel = `${WEEKDAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()}`;

  const derived = useMemo(
    () => deriveActivities(activities, data),
    [activities, data],
  );
  const protectCount = derived.filter((a) => !a.clear).length;

  const removeActivity = (id: number) =>
    commit(
      activities.filter((a) => a.id !== id),
      nextId,
      day,
    );

  // ── Add sheet ──────────────────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetH, setSheetH] = useState(520);
  const anim = useSharedValue(0); // 0 = closed, 1 = open

  const openAdd = () => {
    setDraft(EMPTY_DRAFT);
    setSheetOpen(true);
  };
  const closeAdd = () => {
    anim.value = withTiming(0, { duration: 260, easing: EASE }, (done) => {
      if (done) runOnJS(setSheetOpen)(false);
    });
  };
  useEffect(() => {
    if (sheetOpen) anim.value = withTiming(1, { duration: 340, easing: EASE });
  }, [sheetOpen, anim]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: anim.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - anim.value) * (sheetH + 40) }],
  }));

  const setD = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const startMinus = () => setD({ start: Math.max(5, draft.start - 0.5) });
  const startPlus = () => {
    const ns = Math.min(20.5, draft.start + 0.5);
    setD({ start: ns, end: Math.max(draft.end, ns + 0.5) });
  };
  const endMinus = () =>
    setD({ end: Math.max(draft.start + 0.5, draft.end - 0.5) });
  const endPlus = () => setD({ end: Math.min(21, draft.end + 0.5) });

  const valid = draft.name.trim().length > 0 && draft.end > draft.start;
  const addActivity = () => {
    if (!valid) return;
    commit(
      [...activities, { id: nextId, ...draft, name: draft.name.trim() }],
      nextId + 1,
      day,
    );
    closeAdd();
  };

  return (
    <View className="flex-1 bg-[#F7F8FA]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: 130,
          }}
        >
          {/* header */}
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-sm font-medium text-[#9aa0a8]">
                {dateLabel}
              </Text>
              <Text className="mt-[3px] text-[28px] font-bold tracking-tight text-[#14161B]">
                Your day
              </Text>
            </View>
            <View
              className="h-[42px] w-[42px] items-center justify-center rounded-full"
              style={{
                backgroundColor: "#E2912A",
                shadowColor: "#E2912A",
                shadowOpacity: 0.32,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
            >
              <Text className="text-base font-bold text-white">
                {WEEKDAYS[now.getDay()][0]}
              </Text>
            </View>
          </View>

          {/* summary chip */}
          <View
            className="mt-4 flex-row items-center gap-[10px] rounded-[18px] bg-[#14161B] px-4 py-[14px]"
            style={{
              shadowColor: "#14161B",
              shadowOpacity: 0.14,
              shadowRadius: 26,
              shadowOffset: { width: 0, height: 10 },
              elevation: 5,
            }}
          >
            <View
              className="h-[34px] w-[34px] items-center justify-center rounded-[10px]"
              style={{ backgroundColor: "rgba(245,184,92,0.22)" }}
            >
              <ShieldIcon color="#F5B85C" size={19} />
            </View>
            <Text className="flex-1 text-[14.5px] leading-[20px] text-[#E7E8EA]">
              {protectCount > 0 ? (
                <>
                  <Text className="font-bold text-white">
                    {protectCount}{" "}
                    {protectCount === 1 ? "activity" : "activities"}
                  </Text>{" "}
                  {protectCount === 1 ? "needs" : "need"} sun protection today.
                </>
              ) : (
                <>You're all clear today — no protection needed.</>
              )}
            </Text>
          </View>

          {/* timeline */}
          <View className="mt-[22px]">
            {derived.map((a, i) => (
              <View key={a.id} className="flex-row gap-[14px]">
                {/* time rail */}
                <View className="w-[52px] flex-shrink-0 items-center">
                  <Text className="text-center text-[12.5px] font-bold leading-[15px] text-[#14161B]">
                    {a.startLabel}
                  </Text>
                  {/* target dot: colored core, bg gap ring, colored outer ring */}
                  <View
                    className="mt-2 h-[17px] w-[17px] items-center justify-center rounded-full"
                    style={{ backgroundColor: a.dotColor }}
                  >
                    <View
                      className="h-[13px] w-[13px] rounded-full"
                      style={{
                        backgroundColor: a.dotColor,
                        borderWidth: 3,
                        borderColor: "#F7F8FA",
                      }}
                    />
                  </View>
                  <View
                    className="mt-[6px] w-[2px] flex-1 bg-[#E7E9ED]"
                    style={{ minHeight: 14 }}
                  />
                </View>

                {/* card */}
                <View
                  className="mb-4 flex-1 rounded-[20px] bg-white px-4 pb-[15px] pt-4"
                  style={cardShadow}
                >
                  <View className="flex-row items-start justify-between gap-[10px]">
                    <View className="flex-1">
                      <Text className="text-[17px] font-bold tracking-tight text-[#14161B]">
                        {a.name}
                      </Text>
                      <Text className="mt-[2px] text-[13px] font-medium text-[#9aa0a8]">
                        {a.timeRange} · {a.env}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="rounded-[20px] px-[10px] py-1"
                        style={{ backgroundColor: a.levelBg }}
                      >
                        <Text
                          className="text-[12.5px] font-bold"
                          style={{ color: a.dotColor }}
                        >
                          UV {a.uv} · {a.level}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => removeActivity(a.id)}
                        hitSlop={6}
                        className="h-[26px] w-[26px] items-center justify-center rounded-[8px]"
                      >
                        <CloseIcon color="#c4c8ce" size={15} />
                      </Pressable>
                    </View>
                  </View>

                  {a.clear ? (
                    <View className="mt-3 flex-row items-center gap-2">
                      <CheckIcon color="#4FA85C" size={17} />
                      <Text className="text-[14px] font-medium text-[#4FA85C]">
                        You're good — no protection needed.
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <View className="mt-[13px] flex-row flex-wrap gap-[7px]">
                        {a.items.map((item, k) => (
                          <View
                            key={k}
                            className="flex-row items-center gap-[6px] rounded-[11px] bg-[#F4F5F7] py-[7px] pl-[9px] pr-[11px]"
                          >
                            <PathIcon path={item.path} color={a.dotColor} size={16} />
                            <Text className="text-[13px] font-semibold text-[#14161B]">
                              {item.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View
                        className="mt-3 flex-row items-center gap-[7px] pt-3"
                        style={{ borderTopWidth: 1, borderTopColor: "#F1F2F4" }}
                      >
                        <ClockIcon color="#9aa0a8" size={14} />
                        <Text className="flex-1 text-[13px] text-[#6E727B]">
                          {a.note}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* add card */}
            <Pressable
              onPress={openAdd}
              className="ml-[66px] h-[54px] flex-row items-center justify-center gap-[9px] rounded-[18px]"
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: "#D5D9DF",
                backgroundColor: "rgba(255,255,255,0.4)",
              }}
            >
              <PlusIcon color="#6E727B" size={19} />
              <Text className="text-[15px] font-semibold text-[#6E727B]">
                Add activity
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ===== add bottom sheet ===== */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="none"
        onRequestClose={closeAdd}
        statusBarTranslucent
      >
        <View className="flex-1 justify-end">
          <Animated.View
            style={[
              { position: "absolute", inset: 0, backgroundColor: "rgba(20,22,27,0.4)" },
              backdropStyle,
            ]}
          >
            <Pressable className="flex-1" onPress={closeAdd} />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            pointerEvents="box-none"
          >
            <Animated.View
              onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
              style={[
                {
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingTop: 12,
                  paddingHorizontal: 22,
                  paddingBottom: 32,
                  shadowColor: "#14161B",
                  shadowOpacity: 0.18,
                  shadowRadius: 40,
                  shadowOffset: { width: 0, height: -12 },
                  elevation: 24,
                },
                sheetStyle,
              ]}
            >
              {/* grabber */}
              <View className="mx-auto mb-[18px] h-[5px] w-[38px] rounded-[3px] bg-[#E2E4E8]" />

              <View className="mb-[18px] flex-row items-center justify-between">
                <Text className="text-[21px] font-bold tracking-tight text-[#14161B]">
                  New activity
                </Text>
                <Pressable
                  onPress={closeAdd}
                  className="h-8 w-8 items-center justify-center rounded-[10px] bg-[#F4F5F7]"
                >
                  <CloseIcon color="#6E727B" size={17} />
                </Pressable>
              </View>

              {/* name */}
              <TextInput
                value={draft.name}
                onChangeText={(name) => setD({ name })}
                placeholder="What are you doing?"
                placeholderTextColor="#9aa0a8"
                className="h-[52px] rounded-[15px] px-4 text-base font-medium text-[#14161B]"
                style={{
                  borderWidth: 1,
                  borderColor: "#E4E6EA",
                  backgroundColor: "#FBFBFC",
                }}
              />

              {/* preset chips */}
              <View className="mt-3 flex-row flex-wrap gap-2">
                {PRESETS.map((name) => {
                  const active = draft.name === name;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setD({ name })}
                      className="rounded-[11px] px-[13px] py-2"
                      style={{
                        backgroundColor: active ? ACCENT_TINT : "#F4F5F7",
                        borderWidth: 1,
                        borderColor: active ? ACCENT : "transparent",
                      }}
                    >
                      <Text
                        className="text-[13.5px] font-semibold"
                        style={{ color: active ? ACCENT : "#14161B" }}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* time steppers */}
              <View className="mt-[18px] flex-row gap-3">
                <Stepper
                  label="STARTS"
                  value={fmtTime(draft.start)}
                  onMinus={startMinus}
                  onPlus={startPlus}
                />
                <Stepper
                  label="ENDS"
                  value={fmtTime(draft.end)}
                  onMinus={endMinus}
                  onPlus={endPlus}
                />
              </View>

              {/* environment */}
              <Text className="mb-2 mt-[18px] pl-[2px] text-[12.5px] font-semibold text-[#9aa0a8]">
                ENVIRONMENT
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ENVS.map((name) => {
                  const active = draft.env === name;
                  const color = active ? ACCENT : "#14161B";
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setD({ env: name })}
                      className="flex-row items-center gap-[6px] rounded-[12px] px-[13px] py-[9px]"
                      style={{
                        backgroundColor: active ? ACCENT_TINT : "#F4F5F7",
                        borderWidth: 1,
                        borderColor: active ? ACCENT : "transparent",
                      }}
                    >
                      <PathIcon path={envPath(name)} color={color} size={15} />
                      <Text
                        className="text-[13.5px] font-semibold"
                        style={{ color }}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* add button */}
              <Pressable
                onPress={addActivity}
                disabled={!valid}
                className="mt-[22px] h-[54px] items-center justify-center rounded-[16px]"
                style={{
                  backgroundColor: valid ? ACCENT : "#D8DCE1",
                  shadowColor: "#E2912A",
                  shadowOpacity: valid ? 0.26 : 0,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: valid ? 6 : 0,
                }}
              >
                <Text className="text-[17px] font-semibold tracking-tight text-white">
                  Add to routine
                </Text>
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View className="flex-1">
      <Text className="mb-[7px] pl-[2px] text-[12.5px] font-semibold text-[#9aa0a8]">
        {label}
      </Text>
      <View
        className="h-[52px] flex-row items-center justify-between rounded-[15px] px-[6px]"
        style={{ borderWidth: 1, borderColor: "#E4E6EA", backgroundColor: "#FBFBFC" }}
      >
        <Pressable
          onPress={onMinus}
          className="h-10 w-[38px] items-center justify-center rounded-[11px]"
        >
          <MinusIcon color="#14161B" size={17} />
        </Pressable>
        <Text className="text-[15.5px] font-bold text-[#14161B]">{value}</Text>
        <Pressable
          onPress={onPlus}
          className="h-10 w-[38px] items-center justify-center rounded-[11px]"
        >
          <PlusIcon color="#14161B" size={17} />
        </Pressable>
      </View>
    </View>
  );
}
