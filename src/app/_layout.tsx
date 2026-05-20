import { GlobalColors } from "@/global/theme";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack

    screenOptions={{
      headerShown: false,
      animation: "fade",
      contentStyle: {
        backgroundColor: GlobalColors.background,
      },
      animationDuration: 300,
    }}
  />;
}
