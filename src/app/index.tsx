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
import { GlobalColors, globalStyles, textStyles } from "../global/theme";

type Panel = 'catalog' | 'filter' | 'mount' | 'camera' | 'details';

const TOOLBAR_ICON_SIZE = 18;

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

  const toolbarIconColor = (panel: Panel) =>
    activePanel === panel ? GlobalColors.textPrimary : GlobalColors.textMuted;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={globalStyles.appShell}>
        <View style={styles.planetariumContainer}>
          <View style={globalStyles.sidebar}>
            <View style={globalStyles.sidebarHeader}>
              <Text style={textStyles.appTitle}>Astro App</Text>
              <View style={globalStyles.toolbar}>
                <TouchableOpacity
                  style={[globalStyles.toolbarButton, activePanel === 'filter' && globalStyles.toolbarButtonActive]}
                  onPress={() => togglePanel('filter')}
                >
                  <MaterialCommunityIcons name="tune-variant" size={TOOLBAR_ICON_SIZE} color={toolbarIconColor('filter')} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.toolbarButton, activePanel === 'mount' && globalStyles.toolbarButtonActive]}
                  onPress={() => togglePanel('mount')}
                >
                  <MaterialCommunityIcons name="telescope" size={TOOLBAR_ICON_SIZE} color={toolbarIconColor('mount')} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.toolbarButton, activePanel === 'camera' && globalStyles.toolbarButtonActive]}
                  onPress={() => togglePanel('camera')}
                >
                  <MaterialCommunityIcons name="camera" size={TOOLBAR_ICON_SIZE} color={toolbarIconColor('camera')} />
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
          <View style={globalStyles.mainContent}>
            <SvgSphericalPlanetarium />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  planetariumContainer: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
    overflow: "hidden",
  },
})
