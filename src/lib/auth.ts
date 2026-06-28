import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "@/lib/supabase";

// Dismiss the auth popup automatically once the provider redirects back (web).
WebBrowser.maybeCompleteAuthSession();

// Deep link the OAuth provider redirects to after the user authorizes.
// Resolves to `sunny://auth-callback` in a build, or an `exp://…` URL in Expo Go.
const redirectTo = Linking.createURL("auth-callback");

/** Collects params from both the query string and the URL fragment. */
function getUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const { queryParams } = Linking.parse(url);
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (typeof value === "string") params[key] = value;
  }

  // Implicit-flow tokens arrive in the fragment, which Linking.parse drops.
  const fragment = url.split("#")[1];
  if (fragment) {
    for (const pair of fragment.split("&")) {
      const [key, value] = pair.split("=");
      if (key && value) params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }

  return params;
}

/**
 * Completes a Supabase auth session from an OAuth redirect URL.
 * Handles the PKCE flow (`?code=`, supabase-js default) and the
 * implicit flow (`#access_token=`) as a fallback. Returns the session,
 * or null if the URL carried no auth payload.
 */
export async function createSessionFromUrl(url: string) {
  const params = getUrlParams(url);

  if (params.error_code || params.error) {
    throw new Error(params.error_description || params.error_code || params.error);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  return null;
}

type OAuthProvider = "google" | "apple";

/**
 * Runs the browser-based OAuth flow for a provider and establishes a Supabase
 * session. Returns the session on success, or null if the user dismissed the
 * browser.
 */
async function signInWithProvider(provider: OAuthProvider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Could not start sign-in.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return null;

  return createSessionFromUrl(result.url);
}

export const signInWithGoogle = () => signInWithProvider("google");

/**
 * Signs in with Apple. Uses the native Sign in with Apple sheet on iOS
 * (requires a dev/standalone build — not Expo Go) and falls back to the
 * browser OAuth flow on Android and web. Returns the session, or null if
 * the user cancelled.
 */
export async function signInWithApple() {
  console.log("[apple] signInWithApple called, platform:", Platform.OS);
  if (Platform.OS !== "ios") {
    console.log("[apple] taking web OAuth fallback");
    return signInWithProvider("apple");
  }
  console.log("[apple] taking native flow");

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    console.log("[apple] got credential, identityToken?", !!credential.identityToken);

    if (!credential.identityToken) {
      throw new Error("No identity token returned from Apple.");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    console.log("[apple] signInWithIdToken error:", error?.message ?? "none");
    console.log("[apple] session:", data.session ? "present" : "null");
    if (error) throw error;
    return data.session;
  } catch (e) {
    console.log("[apple] caught:", (e as { code?: string }).code, (e as Error).message);
    if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return null;
    throw e;
  }
}
