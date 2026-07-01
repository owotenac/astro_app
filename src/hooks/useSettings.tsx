import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { CurrentFilter, useFilterStore } from './useFilterStore';

const STORAGE_KEY = '@astro_app';

export interface CameraSettings {
  gain: number;
  exposureTime: number;
}

export interface ViewSettings {
  showStars: boolean;
  showConstellations: boolean;
  showObjects: boolean;
  showNames: boolean;
  showPlanets: boolean;
  mirrorView: boolean;
  starMagnitude: number;
}

export interface Settings {
  filter: CurrentFilter;
  camera: CameraSettings;
  view: ViewSettings;
}

const defaultSettings: Settings = {
  filter: {
    magMin: 0.0,
    magMax: 11.0,
    altMin: 0.0,
    altMax: 90.0,
    types: []
  },
  camera: {
    gain: 20,
    exposureTime: 5
  },
  view: {
    showStars: true,
    showConstellations: true,
    showObjects: true,
    showNames: true,
    showPlanets: true,
    mirrorView: true,
    starMagnitude: 2.5
  }
};

interface SettingsStore {
  settings: Settings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateFilter: (filter: CurrentFilter) => Promise<void>;
  updateCamera: (camera: Partial<CameraSettings>) => Promise<void>;
  updateView: (view: Partial<ViewSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const mergedSettings = { ...defaultSettings, ...parsed };
        set({ settings: mergedSettings, isLoaded: true });
        useFilterStore.getState().setFilter(mergedSettings.filter);
      } else {
        set({ isLoaded: true });
      }
    } catch (e) {
      console.error("Erreur lors du chargement des settings", e);
      set({ isLoaded: true });
    }
  },

  updateFilter: async (filter: CurrentFilter) => {
    const newSettings = { ...get().settings, filter };
    set({ settings: newSettings });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  },

  updateCamera: async (camera: Partial<CameraSettings>) => {
    const newSettings = {
      ...get().settings,
      camera: { ...get().settings.camera, ...camera }
    };
    set({ settings: newSettings });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  },

  updateView: async (view: Partial<ViewSettings>) => {
    const newSettings = {
      ...get().settings,
      view: { ...get().settings.view, ...view }
    };
    set({ settings: newSettings });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }
}));