import Camera from '@/components/camera';
import Filter from '@/components/filter';
import MobileNav from '@/components/MobileNav';
import Mount from '@/components/mount';
import PlateSolving from '@/components/plate-solving';
import Weather from '@/components/weather';
import { useMountStore } from '@/hooks/useMountStore';
import { useResponsive } from '@/hooks/useResponsive';
import { checkServerHealth } from '@/utils/ascom_services';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Catalog from "../components/catalog";
import ObjectDetailsComponent from "../components/object-details";
import SvgSphericalPlanetarium from "../components/spherical-mode-svg";
import { GlobalColors, globalStyles, Spacing, textStyles } from "../global/theme";

type Panel = 'catalog' | 'filter' | 'mount' | 'camera' | 'plate-solving' | 'details' | 'weather';

const TOOLBAR_ICON_SIZE = 18;

export default function Planetarium() {
  const { isMobilePortrait } = useResponsive();
  const selectedObject = useMountStore(state => state.selectedObject);
  const setSelectedObject = useMountStore(state => state.setSelectedObject);
  const [activePanel, setActivePanel] = useState<Panel>('catalog');
  const [serverAvailable, setServerAvailable] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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
      if (isMobilePortrait) {
        setModalVisible(true);
      }
    }
  }, [selectedObject, isMobilePortrait]);

  const togglePanel = (panel: Panel) => {
    if (isMobilePortrait) {
      setActivePanel(panel);
      setModalVisible(true);
    } else {
      setActivePanel(activePanel === panel ? 'catalog' : panel);
    }
  };

  const closePanel = () => {
    setSelectedObject(null);
    setActivePanel('catalog');
    if (isMobilePortrait) {
      setModalVisible(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const toolbarIconColor = (panel: Panel) =>
    activePanel === panel ? GlobalColors.textPrimary : GlobalColors.textMuted;

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'details':
        return selectedObject ? <ObjectDetailsComponent object={selectedObject} onClose={closePanel} /> : null;
      case 'filter':
        return <Filter onClose={closePanel} />;
      case 'mount':
        return <Mount onClose={closePanel} />;
      case 'camera':
        return <Camera onClose={closePanel} />;
      case 'plate-solving':
        return <PlateSolving onClose={closePanel} />;
      case 'weather':
        return <Weather onClose={closePanel} />;
      case 'catalog':
      default:
        return <Catalog />;
    }
  };

  const panelTitle = {
    catalog: 'Catalogue',
    filter: 'Filtres',
    mount: 'Monture',
    camera: 'Caméra',
    'plate-solving': 'Plate Solving',
    details: selectedObject?.Name || 'Détails',
    weather: 'Météo',
  };

  if (isMobilePortrait) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={globalStyles.appShell}>
          <View style={styles.mobileContainer}>
            <SvgSphericalPlanetarium />
            <MobileNav
              activePanel={activePanel}
              onPanelPress={togglePanel}
              serverAvailable={serverAvailable}
            />
          </View>

          <Modal
            visible={modalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={closeModal}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal} style={styles.modalBackButton}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.textPrimary} />
                </TouchableOpacity>
                <Text style={textStyles.appTitle}>{panelTitle[activePanel]}</Text>
                <View style={styles.modalBackButton} />
              </View>
              <View style={styles.modalContent}>
                {renderPanelContent()}
              </View>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

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
                <TouchableOpacity
                  style={[globalStyles.toolbarButton, activePanel === 'weather' && globalStyles.toolbarButtonActive]}
                  onPress={() => togglePanel('weather')}
                >
                  <MaterialCommunityIcons name="weather-cloudy" size={TOOLBAR_ICON_SIZE} color={toolbarIconColor('weather')} />
                </TouchableOpacity>
              </View>
            </View>
            {renderPanelContent()}
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
  mobileContainer: {
    flex: 1,
    position: 'relative',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: GlobalColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: GlobalColors.separator,
    backgroundColor: GlobalColors.sidebarBackground,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
})
