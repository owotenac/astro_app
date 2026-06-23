import Filter from '@/components/filter';
import Mount from '@/components/mount';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Catalog from "../components/catalog";
import ObjectDetailsComponent from "../components/object-details";
import SphericalPlanetariumScreen from "../components/spherical-mode";
import { GlobalColors, globalStyles } from "../global/theme";
import { CelestialObject } from "../model/celestialobject";

export default function Index() {
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [showMount, setShowMount] = useState<boolean>(false);

  const handleObjectSelect = (object: CelestialObject) => {
    setSelectedObject(object);
  };

  const handleCloseDetails = () => {
    setSelectedObject(null);
  };

  const openFilter = () => {
    setShowFilter(!showFilter);
  }

  const openMount = () => {
    setShowMount(!showMount);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={globalStyles.container}>

        <View style={styles.planetariumContainer}>
          <View style={{ width: "30%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={globalStyles.font_title}>Astro App</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", gap: 10 }}>
                <TouchableOpacity onPress={openFilter}>
                  <MaterialCommunityIcons name="tune-variant" size={30} color={GlobalColors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={openMount}>
                  <MaterialCommunityIcons name="telescope" size={30} color={GlobalColors.accent} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Afficher soit le Catalogue soit les Détails soit les settings*/}
            {selectedObject ? (
              <ObjectDetailsComponent
                object={selectedObject}
                onClose={handleCloseDetails}
              />
            ) : (
              showFilter ? (
                <Filter onClose={openFilter} />
              ) : (
                showMount ? (
                  <Mount onClose={openMount} />
                ) : (
                  <Catalog onSelectObject={handleObjectSelect} />
                )
              )
            )}
          </View>
          <SphericalPlanetariumScreen onSelectObject={handleObjectSelect} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  planetariumContainer: {
    flex: 1,
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