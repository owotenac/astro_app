import Camera from '@/components/camera';
import Filter from '@/components/filter';
import Mount from '@/components/mount';
import { useMountStore } from '@/hooks/useMountStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Catalog from "../components/catalog";
import ObjectDetailsComponent from "../components/object-details";
import SvgSphericalPlanetarium from "../components/spherical-mode-svg";
import { GlobalColors, globalStyles } from "../global/theme";

type Panel = 'catalog' | 'filter' | 'mount' | 'camera' | 'details';

export default function Index() {
  const selectedObject = useMountStore(state => state.selectedObject);
  const setSelectedObject = useMountStore(state => state.setSelectedObject);
  const [activePanel, setActivePanel] = useState<Panel>('catalog');

  useEffect(() => {
    if (selectedObject) {
      setActivePanel('details');
    }
  }, [selectedObject]);

  const togglePanel = (panel: Panel) => {
    setActivePanel(activePanel === panel ? 'catalog' : panel);
  };

  const closePanel = () => {
    setSelectedObject(null);
    setActivePanel('catalog');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={globalStyles.container}>

        <View style={styles.planetariumContainer}>
          <View style={{ width: "30%" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={globalStyles.font_title}>Astro App</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", gap: 10 }}>
                <TouchableOpacity onPress={() => togglePanel('filter')}>
                  <MaterialCommunityIcons name="tune-variant" size={30} color={activePanel === 'filter' ? GlobalColors.primary : GlobalColors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => togglePanel('mount')}>
                  <MaterialCommunityIcons name="telescope" size={30} color={activePanel === 'mount' ? GlobalColors.primary : GlobalColors.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => togglePanel('camera')}>
                  <MaterialCommunityIcons name="camera" size={30} color={activePanel === 'camera' ? GlobalColors.primary : GlobalColors.accent} />
                </TouchableOpacity>
              </View>
            </View>

            {activePanel === 'details' && selectedObject && (
              <ObjectDetailsComponent object={selectedObject} onClose={closePanel} />
            )}
            {activePanel === 'filter' && <Filter onClose={closePanel} />}
            {activePanel === 'mount' && <Mount onClose={closePanel} />}
            {activePanel === 'camera' && <Camera onClose={closePanel} />}
            {activePanel === 'catalog' && <Catalog />}
          </View>
          <SvgSphericalPlanetarium />
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