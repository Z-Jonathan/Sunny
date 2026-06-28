import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <View className="flex-1 bg-[#F7F8FA]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-between px-7 pb-6 pt-8">
          <View className="mt-10 items-center">
            <Text className="text-center text-3xl font-bold tracking-tight text-[#14161B]">
              You&apos;re in ☀️
            </Text>
            {email ? (
              <Text className="mt-2 text-center text-[15.5px] text-[#6E727B]">
                Signed in as {email}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={handleSignOut}
            className="h-[54px] w-full items-center justify-center rounded-2xl bg-[#14161B] active:opacity-[0.88]"
          >
            <Text className="text-[17px] font-semibold tracking-tight text-white">Sign Out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
