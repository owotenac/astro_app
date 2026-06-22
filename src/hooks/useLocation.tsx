import { updateObserver } from '@/utils/compute';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export interface LocationState {
    latitude: number;
    longitude: number;
    altitude: number;
    ready: boolean;
    error: string | null;
}

const DEFAULT_LOCATION: LocationState = {
    latitude: 43.6076,
    longitude: 3.4906,
    altitude: 30,
    ready: false,
    error: null,
};

export function useLocation() {
    const [location, setLocation] = useState<LocationState>(DEFAULT_LOCATION);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocation(prev => ({
                    ...prev,
                    ready: true,
                    error: 'Permission GPS refusée, position par défaut utilisée',
                }));
                updateObserver(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.altitude);
                return;
            }

            try {
                const result = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                const { latitude, longitude, altitude } = result.coords;
                updateObserver(latitude, longitude, altitude ?? 0);
                setLocation({
                    latitude,
                    longitude,
                    altitude: altitude ?? 0,
                    ready: true,
                    error: null,
                });
            } catch (e) {
                setLocation(prev => ({
                    ...prev,
                    ready: true,
                    error: 'Erreur GPS, position par défaut utilisée',
                }));
                updateObserver(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.altitude);
            }
        })();
    }, []);

    return location;
}