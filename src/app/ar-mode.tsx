import { Camera, CameraView } from 'expo-camera';
import { DeviceMotion } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';

import typesMapping from '@/assets/data/celestialtype.json';
import { useFilterStore } from '@/hooks/useFilterStore';
import { useLocation } from '@/hooks/useLocation';
import { CelestialObject } from '@/model/celestialobject';
import { computeAzAlt } from '@/utils/compute';
import { filterCatalog } from '@/utils/filter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HORIZONTAL_FOV = 60;
const PIXELS_PER_DEGREE = SCREEN_WIDTH / HORIZONTAL_FOV;

// ─── Paramètres de lissage ────────────────────────────────────────────────────
const SMOOTHING = 0.2;
const MIN_DELTA_DEG = 0.5;

interface RenderedObject {
    name: string;
    typeLabel: string;
    color: string;
    screenX: number;
    screenY: number;
    isVisible: boolean;
    isUnderHorizon: boolean; // Ajouté pour donner l'information astro sans bloquer l'affichage
    alt: number;
    az: number;
}

export default function AREyeScreen() {
    const currentFilter = useFilterStore(state => state.currentFilter);
    const location = useLocation();
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [visibleObjects, setVisibleObjects] = useState<RenderedObject[]>([]);
    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>([]);
    const frameCounterRef = useRef(0);
    // ─── Refs pour le lissage ─────────────────────────────────────────────────
    const smoothedAzRef = useRef(0);
    const smoothedAltRef = useRef(0);
    const prevAzRef = useRef(0);
    const prevAltRef = useRef(0);
    const isInitializedRef = useRef(false);

    // 1. Demande des permissions caméra au montage
    useEffect(() => {
        (async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermission(cameraStatus.status === 'granted');
        })();
    }, []);

    // 2. Mise à jour du catalogue filtré
    useEffect(() => {
        setFilteredCatalog(filterCatalog(currentFilter));
    }, [currentFilter]);

    // 3. Boucle capteur avec reconstruction de visée stable
    useEffect(() => {
        if (!location.ready) return;

        DeviceMotion.setUpdateInterval(16); // ~60fps

        const subscription = DeviceMotion.addListener((motionData) => {
            if (!motionData.rotation) return;

            // 1. Angles bruts en degrés
            const alphaDeg = motionData.rotation.alpha * (180 / Math.PI);
            const betaDeg = motionData.rotation.beta * (180 / Math.PI);
            const gammaDeg = motionData.rotation.gamma * (180 / Math.PI);

            // 2. CORRECTION GÉOMÉTRIQUE PORTRAIT STABLE
            // On extrait l'azimut et l'altitude en inversant les axes croisés de l'OS
            let phoneAzimuth = 0;
            let phoneAltitude = 0;

            // Si le téléphone renvoie des valeurs inversées à 180°, on force le re-mappage ici :
            phoneAzimuth = ((-alphaDeg) + 360) % 360;

            // Pour l'altitude, on prend la bascule de Gamma (Roulis qui devient Tangage en Portrait)
            phoneAltitude = gammaDeg;

            // ─── L'INVERSEUR À 180° (Ton intuition) ──────────────────────────────────
            // Si tes objets font l'inverse de tes mouvements ou sont à l'opposé :
            // On applique une rotation complète de 180° sur la boussole
            phoneAzimuth = (phoneAzimuth + 180) % 360;

            // Et on inverse le sens de l'altitude (Haut devient Bas)
            phoneAltitude = -phoneAltitude;

            // Calibrage de l'horizon (pour que le zéro soit face à toi et pas vers le ciel)
            phoneAltitude = phoneAltitude - 90;


            // ─── SYNCHRONISATION DIRECTE SANS LISSAGE ─────────────────────────────
            smoothedAzRef.current = phoneAzimuth;
            smoothedAltRef.current = phoneAltitude;

            prevAzRef.current = smoothedAzRef.current;
            prevAltRef.current = smoothedAltRef.current;

            const now = new Date();
            const nextVisibleObjects: RenderedObject[] = [];

            for (const obj of filteredCatalog) {
                if (!obj.ra_deg || !obj.dec_deg) continue;

                const { azimuth: objAzimuth, altitude: objAltitude } = computeAzAlt(obj, now);

                // Delta Azimut standard
                let deltaAzimuth = objAzimuth - smoothedAzRef.current;
                if (deltaAzimuth > 180) deltaAzimuth -= 360;
                if (deltaAzimuth < -180) deltaAzimuth += 360;

                // Delta Altitude standard
                const deltaAltitude = objAltitude - smoothedAltRef.current;

                // PROJECTION PIXEL DIRECTE
                const screenX = (SCREEN_WIDTH / 2) - (deltaAzimuth * PIXELS_PER_DEGREE);
                const screenY = (SCREEN_HEIGHT / 2) - (deltaAltitude * PIXELS_PER_DEGREE);

                const typeInfo = typesMapping[obj.Type as keyof typeof typesMapping] || { label: obj.Type, color: '#9E9E9E' };

                // Élargissement temporaire du champ de vision (FOV à 120°) pour forcer 
                // les objets à rester visibles à l'écran, même s'ils sont mal placés
                if (Math.abs(deltaAzimuth) < 120 && Math.abs(deltaAltitude) < 120) {
                    nextVisibleObjects.push({
                        name: obj.Name,
                        typeLabel: typeInfo.label,
                        color: typeInfo.color,
                        screenX,
                        screenY,
                        isVisible: screenX >= 0 && screenX <= SCREEN_WIDTH && screenY >= 0 && screenY <= SCREEN_HEIGHT,
                        isUnderHorizon: objAltitude < 0,
                        alt: objAltitude,
                        az: objAzimuth,
                    });
                }
            }

            setVisibleObjects(nextVisibleObjects);
        });

        return () => subscription.remove();
    }, [location.ready, filteredCatalog]);

    if (hasCameraPermission === null || !location.ready) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.messageText}>Initialisation des capteurs célestes...</Text>
            </View>
        );
    }

    if (!hasCameraPermission) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>
                    L'accès à l'appareil photo est indispensable pour le mode Réalité Augmentée.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView style={StyleSheet.absoluteFill} facing="back" />
            <View style={[styles.arOverlay, StyleSheet.absoluteFill]}>
                <View style={styles.hudHeader}>
                    <Text style={styles.hudText}>Mode AR Céleste</Text>
                    <Text style={styles.hudSubText}>
                        {location.error ?? `GPS OK (Lat: ${location.latitude.toFixed(2)} / Lon: ${location.longitude.toFixed(2)})`}
                    </Text>
                </View>

                {/* Conteneur principal pour les éléments superposés */}
                <View style={StyleSheet.absoluteFill}>
                    <View style={styles.crosshair} />

                    {visibleObjects.map((obj, index) => (
                        <View
                            key={index}
                            style={[
                                styles.astronomicalBadge,
                                {
                                    left: obj.screenX - 50,
                                    top: obj.screenY - 20,
                                    borderColor: obj.color,
                                    // S'il est sous l'horizon, on applique une opacité globale de 0.35 pour signifier qu'il est "occulté par la Terre"
                                    opacity: obj.isVisible
                                        ? (obj.isUnderHorizon ? 0.35 : 1)
                                        : 0.2,
                                    // Optionnel : style pointillé ou fond plus sombre pour les objets sous l'horizon
                                    borderStyle: obj.isUnderHorizon ? 'dashed' : 'solid',
                                },
                            ]}
                        >
                            <Text style={styles.badgeTitle}>{obj.name}</Text>
                            <Text style={[styles.badgeSubtitle, { color: obj.color }]}>
                                {obj.typeLabel} {obj.isUnderHorizon ? '(Sous l\'horiz.)' : ''}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0b0c10',
        padding: 20,
    },
    messageText: {
        marginTop: 15,
        color: '#ffffff',
        fontSize: 16,
    },
    errorText: {
        color: '#ff4d4d',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
    },
    arOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'transparent',
    },
    hudHeader: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(11, 12, 16, 0.7)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1f2833',
        zIndex: 10, // S'assure que le HUD reste au-dessus des badges
    },
    hudText: {
        color: '#4682B4',
        fontSize: 18,
        fontWeight: 'bold',
    },
    hudSubText: {
        color: '#c5c6c7',
        fontSize: 12,
        marginTop: 4,
    },
    crosshair: {
        position: 'absolute',
        top: SCREEN_HEIGHT / 2 - 10,
        left: SCREEN_WIDTH / 2 - 10,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    astronomicalBadge: {
        position: 'absolute',
        width: 100,
        padding: 6,
        backgroundColor: 'rgba(11, 12, 16, 0.85)',
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
    },
    badgeTitle: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    badgeSubtitle: {
        fontSize: 9,
        marginTop: 2,
        fontWeight: '600',
        textAlign: 'center',
    },
});