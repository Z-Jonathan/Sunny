import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TabPlaceholder({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View className="flex-1 bg-[#F7F8FA]">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 items-center justify-center px-7">
        <Text className="text-2xl font-bold tracking-tight text-[#14161B]">
          {title}
        </Text>
        <Text className="mt-2 text-center text-[15px] leading-[21px] text-[#6E727B]">
          {subtitle}
        </Text>
      </SafeAreaView>
    </View>
  );
}
