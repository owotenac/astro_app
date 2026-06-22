import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { CurrentFilter, useFilterStore } from './useFilterStore';

const STORAGE_KEY = '@astro_app';

export interface Settings {
  filter: CurrentFilter
}

export const useSettings = () => {
  const { setFilter } = useFilterStore();
  const [settings, setSettings] = useState<Settings>({
    filter: {
      magMin: 0.0,
      magMax: 15.0,
      altMin: 0.0,
      altMax: 90.0,
      types: []
    }
  });

  // Charger les favoris au démarrage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        //keep settings
        setSettings(parsedSettings);
        //store 
        setFilter(parsedSettings.filter);
      }
    } catch (e) {
      console.error("Erreur lors du chargement des settings", e);
    }
  };

  const applySettings = async (filter: CurrentFilter) => {
    try {
      let newSettings = { ...settings };
      newSettings.filter = filter

      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde", e);
    }
  };

  return { settings, applySettings, loadSettings };
};