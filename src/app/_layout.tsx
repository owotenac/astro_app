import { GlobalColors } from "@/global/theme";
import { useSettings } from "@/hooks/useSettings";
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

  const { loadSettings } = useSettings();

  useEffect(() => {
    if (loaded || error) {
      loadSettings()
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
