import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Catalog from "../components/catalog";
import SphericalPlanetariumScreen from "../components/spherical-mode";
import { GlobalColors, globalStyles } from "../global/theme";

export default function Index() {

  const openCatalog = () => {
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={globalStyles.container}>

        <View style={styles.planetariumContainer}>
          <View style={{ width: "30%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={globalStyles.font_title}>Astro App</Text>
                    <TouchableOpacity onPress={() => router.push("/filter")}>
                        <MaterialCommunityIcons name="tune-variant" size={30} color={GlobalColors.accent} />
                    </TouchableOpacity>          
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 2, gap: 20 }}>
              {/* <TouchableOpacity style={styles.button} onPress={() => router.push("/catalog")}>
              <Text style={styles.buttonText}>Catalogue</Text>
            </TouchableOpacity> */}
              {/* <TouchableOpacity style={styles.button} onPress={() => { }}>
              <Text style={styles.buttonText}>Planificateur</Text>
            </TouchableOpacity> */}
            </View>
            <Catalog />
          </View>
          <SphericalPlanetariumScreen />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  planetariumContainer: {
    flex: 1,
    //marginTop: ,
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    backgroundColor: GlobalColors.foreground,
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
    width: 200,
  },
  buttonText: {
    color: GlobalColors.background,
    fontWeight: "bold",
  }
})
