import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Field, SocialButton } from "@/components/auth";
import {
  AppleIcon,
  ChevronLeftIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
  SunMarkIcon,
} from "@/components/icons";
import { signInWithApple, signInWithGoogle } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  async function handleGoogle() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session) router.replace("/home");
    } catch (error) {
      Alert.alert(
        "Google sign-in failed",
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    if (appleLoading) return;
    setAppleLoading(true);
    try {
      const session = await signInWithApple();
      if (session) router.replace("/home");
    } catch (error) {
      Alert.alert(
        "Apple sign-in failed",
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setAppleLoading(false);
    }
  }

  async function handleSignUp() {
    if (loading) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Sign up failed", error.message);
      return;
    }
    if (!data.session) {
      // Email confirmation is enabled — no session until the user confirms.
      Alert.alert(
        "Check your email",
        "Confirm your email to finish signing up.",
      );
      return;
    }
    router.replace("/home");
  }

  return (
    <View className="flex-1 bg-[#F7F8FA]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow px-7 pb-9 pt-3"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* back button */}
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white active:opacity-70"
            style={{
              shadowColor: "#14161B",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <ChevronLeftIcon />
          </Pressable>

          {/* header */}
          <View className="mt-[30px] items-center">
            <View
              style={{
                shadowColor: "#E2912A",
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.28,
                shadowRadius: 7,
                elevation: 4,
              }}
            >
              <SunMarkIcon />
            </View>
            <Text className="mt-[18px] text-center text-[27px] font-bold leading-[30px] tracking-tight text-[#14161B]">
              Create your Account
            </Text>
            <Text className="mt-2 max-w-[260px] text-center text-[15.5px] leading-snug text-[#6E727B]">
              Start your daily SPF habit.
            </Text>
          </View>

          {/* social auth */}
          <View className="mt-[34px] gap-3">
            <SocialButton
              variant="dark"
              icon={<AppleIcon />}
              label={appleLoading ? "Connecting…" : "Continue with Apple"}
              onPress={handleApple}
              disabled={appleLoading}
            />
            <SocialButton
              variant="light"
              icon={<GoogleIcon />}
              label={googleLoading ? "Connecting…" : "Continue with Google"}
              onPress={handleGoogle}
              disabled={googleLoading}
            />
          </View>

          {/* divider */}
          <View className="my-6 flex-row items-center gap-3.5">
            <View className="h-px flex-1 bg-[#E4E6EA]" />
            <Text className="text-[13px] font-medium text-[#9aa0a8]">or</Text>
            <View className="h-px flex-1 bg-[#E4E6EA]" />
          </View>

          {/* email form */}
          <View className="gap-3">
            <Field
              icon={<MailIcon />}
              placeholder="Email address"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              icon={<LockIcon />}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* primary cta */}
          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            className="mt-4 h-[54px] w-full items-center justify-center rounded-2xl bg-[#E2912A] active:opacity-90"
            style={{
              shadowColor: "#E2912A",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 4,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Text className="text-[17px] font-semibold tracking-tight text-white">
              {loading ? "Creating account…" : "Create Account"}
            </Text>
          </Pressable>

          {/* legal */}
          <Text className="mt-4 max-w-[280px] self-center text-center text-xs leading-5 text-[#9aa0a8]">
            By continuing you agree to our{" "}
            <Text className="font-medium text-[#6E727B]">Terms</Text> and{" "}
            <Text className="font-medium text-[#6E727B]">Privacy Policy</Text>.
          </Text>

          {/* footer */}
          <View className="mt-auto pt-5">
            <Pressable onPress={() => router.replace("/log-in")}>
              <Text className="text-center text-[14.5px] text-[#6E727B]">
                Already have an account?{" "}
                <Text className="font-semibold text-[#14161B]">Log In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
