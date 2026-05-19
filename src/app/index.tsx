import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Theme, globalStyles, GlobalColors } from "../global/theme";
import { router } from "expo-router";

export default function Index() {
  return (
    <View style={globalStyles.container}>
      <Text style={Theme.fonts.title}>Astro App</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/catalog")}>
        <Text style={styles.buttonText}>Catalogue</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => {}}>
        <Text style={styles.buttonText}>AR Mode</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => {}}>
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
