import { GlobalColors } from "@/global/theme";
import { useObservationStore } from "@/hooks/useObservationStore";
import { useSettingsStore } from "@/hooks/useSettings";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [loaded, error] = useFonts({
    //'astro_font_regular': require("@/assets/fonts/SquadaOne-Regular.ttf")
    'astro_font_regular': require("@/assets/fonts/Blinker-Regular.ttf")
  });

  const loadSettings = useSettingsStore(state => state.loadSettings);
  const initTargetDate = useObservationStore(state => state.initTargetDate);

  useEffect(() => {
    initTargetDate();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      loadSettings();
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: {
            backgroundColor: GlobalColors.background,
          },
          animationDuration: 300,
        }}
      />
    </GestureHandlerRootView>
  );
}
