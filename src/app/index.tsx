import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GlobalColors, globalStyles } from "../global/theme";

export default function Index() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={globalStyles.container}>
        <Text style={globalStyles.font_title}>Astro App</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/catalog")}>
          <Text style={styles.buttonText}>Catalogue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/screen-mode")}>
          <Text style={styles.buttonText}>Screen Mode (Cylindrique)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push("/spherical-mode")}>
          <Text style={styles.buttonText}>Screen Mode (Sphérique)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => { }}>
          <Text style={styles.buttonText}>Planificateur</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  button: {
    backgroundColor: GlobalColors.foreground,
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
    width: 200
  },
  buttonText: {
    color: GlobalColors.background,
    fontWeight: "bold",
  },
});
