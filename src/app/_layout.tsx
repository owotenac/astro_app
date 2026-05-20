import { GlobalColors } from "@/global/theme";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [loaded, error] = useFonts({
    //'astro_font_regular': require("@/assets/fonts/SquadaOne-Regular.ttf")
    'astro_font_regular': require("@/assets/fonts/Blinker-Regular.ttf")
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

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
