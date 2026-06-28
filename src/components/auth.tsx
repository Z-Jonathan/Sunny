import { Pressable, Text, TextInput, View } from "react-native";

export function SocialButton({
  variant,
  icon,
  label,
}: {
  variant: "dark" | "light";
  icon: React.ReactNode;
  label: string;
}) {
  const dark = variant === "dark";
  return (
    <Pressable
      className={`relative h-[54px] w-full flex-row items-center justify-center rounded-2xl ${
        dark ? "bg-[#14161B] active:opacity-[0.88]" : "border border-[#E4E6EA] bg-white active:bg-[#F4F5F7]"
      }`}
    >
      <View className="absolute left-5">{icon}</View>
      <Text className={`text-[16.5px] font-semibold tracking-tight ${dark ? "text-white" : "text-[#14161B]"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  icon,
  placeholder,
  secureTextEntry,
  keyboardType,
  value,
  onChangeText,
}: {
  icon: React.ReactNode;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "default";
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View className="h-[54px] flex-row items-center gap-3 rounded-2xl border border-[#E4E6EA] bg-white px-4">
      {icon}
      <TextInput
        className="flex-1 text-base text-[#14161B]"
        placeholder={placeholder}
        placeholderTextColor="#9aa0a8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
