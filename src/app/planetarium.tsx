import Camera from '@/components/camera';
import Filter from '@/components/filter';
import Mount from '@/components/mount';
import PlateSolving from '@/components/plate-solving';
import { useMountStore } from '@/hooks/useMountStore';
import { checkServerHealth } from '@/utils/ascom_services';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Catalog from "../components/catalog";
import ObjectDetailsComponent from "../components/object-details";
import SvgSphericalPlanetarium from "../components/spherical-mode-svg";
import { GlobalColors, globalStyles, textStyles } from "../global/theme";

type Panel = 'catalog' | 'filter' | 'mount' | 'camera' | 'plate-solving' | 'details';

const TOOLBAR_ICON_SIZE = 18;

export default function Planetarium() {
  const selectedObject = useMountStore(state => state.selectedObject);
  const setSelectedObject = useMountStore(state => state.setSelectedObject);
  const [activePanel, setActivePanel] = useState<Panel>('catalog');
  const [serverAvailable, setServerAvailable] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      const available = await checkServerHealth();
      setServerAvailable(available);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

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
                  disabled={!serverAvailable}
                >
                  <MaterialCommunityIcons name="telescope" size={TOOLBAR_ICON_SIZE} color={serverAvailable ? toolbarIconColor('mount') : GlobalColors.textDisabled} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.toolbarButton, activePanel === 'camera' && globalStyles.toolbarButtonActive]}
                  onPress={() => togglePanel('camera')}
                  disabled={!serverAvailable}
                >
                  <MaterialCommunityIcons name="camera" size={TOOLBAR_ICON_SIZE} color={serverAvailable ? toolbarIconColor('camera') : GlobalColors.textDisabled} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.toolbarButton, activePanel === 'plate-solving' && globalStyles.toolbarButtonActive]}
                  onPress={() => togglePanel('plate-solving')}
                  disabled={!serverAvailable}
                >
                  <MaterialCommunityIcons name="target" size={TOOLBAR_ICON_SIZE} color={serverAvailable ? toolbarIconColor('plate-solving') : GlobalColors.textDisabled} />
                </TouchableOpacity>

              </View>
            </View>

            {activePanel === 'details' && selectedObject && (
              <ObjectDetailsComponent object={selectedObject} onClose={closePanel} />
            )}
            {activePanel === 'filter' && <Filter onClose={closePanel} />}
            {activePanel === 'mount' && <Mount onClose={closePanel} />}
            {activePanel === 'camera' && <Camera onClose={closePanel} />}
            {activePanel === 'plate-solving' && <PlateSolving onClose={closePanel} />}
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
