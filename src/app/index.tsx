import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GlobalColors, globalStyles } from "../global/theme";

export default function Index() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.font_title}>Astro App</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/catalog")}>
        <Text style={styles.buttonText}>Catalogue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => { }}>
        <Text style={styles.buttonText}>AR Mode</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => { }}>
        <Text style={styles.buttonText}>Planificateur</Text>
      </TouchableOpacity>
    </View>
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
