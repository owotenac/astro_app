import typesMapping from '@/assets/data/celestialtype.json';
import PanoramaCalibration, { type CalibrationResult } from '@/components/panorama-calibration';
import { GlobalColors, globalStyles } from '@/global/theme';
import { useFilterStore } from '@/hooks/useFilterStore';
import { useLocation } from '@/hooks/useLocation';
import { CelestialObject } from '@/model/celestialobject';
import { computeAzAlt } from '@/utils/compute';
import { filterCatalog } from '@/utils/filter';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// ─── Panorama ─────────────────────────────────────────────────────────────────

const PANORAMA_ASSET = require('@/assets/images/panorama_test.jpg');

const ORIGINAL_WIDTH = 8640;
const ORIGINAL_HEIGHT = 1592;

// Largeur de rendu cible (1px = 1° en azimut)
const MAP_WIDTH = 3600;
const MAP_HEIGHT = (ORIGINAL_HEIGHT / ORIGINAL_WIDTH) * MAP_WIDTH;

// Pixels par degré
const PX_PER_DEG_AZ = MAP_WIDTH / 360;         // 10 px/°
const VERTICAL_FOV = 66;                       // FoV vertical réel de la photo en °
const PX_PER_DEG_ALT = MAP_HEIGHT / VERTICAL_FOV;

// Valeurs de calibration par défaut (avant que l'utilisateur calibre)
const DEFAULT_CALIBRATION: CalibrationResult = {
    azimuthOffset: 0,
    horizonY: MAP_HEIGHT / 2,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RenderedObject {
    object: CelestialObject;
    color: string;
    x: number;
    y: number;
    alt: number;
    az: number;
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function PanoramaPlanetariumScreen() {
    const currentFilter = useFilterStore(state => state.currentFilter);
    const location = useLocation();

    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>([]);
    const [visibleObjects, setVisibleObjects] = useState<RenderedObject[]>([]);

    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibration, setCalibration] = useState<CalibrationResult>(DEFAULT_CALIBRATION);

    const [timeOffset, setTimeOffset] = useState(0); // en heures, ±12

    // ── Catalogue filtré ──────────────────────────────────────────────────────
    useEffect(() => {
        setFilteredCatalog(filterCatalog(currentFilter));
    }, [currentFilter]);

    // ── Moteur de projection cylindrique ─────────────────────────────────────
    useEffect(() => {
        if (!location.ready) return;

        const targetDate = new Date();
        targetDate.setTime(targetDate.getTime() + timeOffset * 3600 * 1000);

        const nextObjects: RenderedObject[] = [];

        for (const obj of filteredCatalog) {
            if (!obj.ra_deg || !obj.dec_deg) continue;

            const { azimuth, altitude } = computeAzAlt(obj, targetDate);

            // Ignorer ce qui est trop bas sous l'horizon
            if (altitude < -20) continue;

            // Décalage azimut selon calibration
            let az = azimuth - calibration.azimuthOffset;
            if (az < 0) az += 360;
            if (az >= 360) az -= 360;

            // Projection en pixels
            const x = az * PX_PER_DEG_AZ;
            const y = calibration.horizonY - altitude * PX_PER_DEG_ALT;

            const typeInfo = typesMapping[obj.Type as keyof typeof typesMapping]
                ?? { label: obj.Type, color: '#9E9E9E' };

            nextObjects.push({
                object: obj,
                color: typeInfo.color,
                x, y,
                alt: altitude,
                az: azimuth,
            });
        }

        setVisibleObjects(nextObjects);
    }, [location.ready, filteredCatalog, timeOffset, calibration]);


    // ── Helpers ───────────────────────────────────────────────────────────────

    const cardinalX = (az: number): number => {
        // Les cardinaux suivent le même offset que les objets
        let adjusted = az - calibration.azimuthOffset;
        if (adjusted < 0) adjusted += 360;
        if (adjusted >= 360) adjusted -= 360;
        return adjusted * PX_PER_DEG_AZ;
    };

    const observationTime = (): string => {
        const d = new Date();
        d.setTime(d.getTime() + timeOffset * 3600 * 1000);
        return `${d.getHours()}h${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleCalibrationComplete = (result: CalibrationResult) => {
        setCalibration(result);
        setIsCalibrating(false);
        // TODO: AsyncStorage.setItem('panorama_calibration', JSON.stringify(result));
    };

    // ── Rendu ─────────────────────────────────────────────────────────────────

    if (isCalibrating) {
        return (
            <PanoramaCalibration
                panoramaSource={PANORAMA_ASSET}
                originalWidth={ORIGINAL_WIDTH}
                originalHeight={ORIGINAL_HEIGHT}
                mapWidth={MAP_WIDTH}
                verticalFOV={VERTICAL_FOV}
                onComplete={handleCalibrationComplete}
                onCancel={() => setIsCalibrating(false)}
            />
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={[globalStyles.container, { padding: 0, paddingTop: 0 }]}>

                {/* Header */}
                <View style={styles.header}>
                    {/* <Text style={styles.headerTitle}></Text> */}
                    <TouchableOpacity onPress={() => setIsCalibrating(true)}>
                        <MaterialCommunityIcons name="crosshairs-gps" size={30} color={GlobalColors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/filter')}>
                        <MaterialCommunityIcons name="tune-variant" size={30} color={GlobalColors.foreground} />
                    </TouchableOpacity>
                </View>

                {/* Panorama scrollable */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
                    style={styles.skyView}
                >
                    {/* <Image
                        source={PANORAMA_ASSET}
                        style={{ position: 'absolute', width: MAP_WIDTH, height: MAP_HEIGHT }}
                        resizeMode="cover"
                    /> */}

                    {/* Points cardinaux (suivent l'offset) */}
                    {([0, 90, 180, 270] as const).map((az) => {
                        const labels: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'O' };
                        return (
                            <Text key={az} style={[styles.cardinal, { left: cardinalX(az), top: 16 }]}>
                                │ {labels[az]}
                            </Text>
                        );
                    })}

                    {/* Objets célestes */}
                    {visibleObjects.map((obj, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => router.push({
                                pathname: '/object-details',
                                params: { object: JSON.stringify(obj.object) }
                            })}
                        >
                            <View
                                style={[styles.objectMarker, {
                                    left: obj.x - 16,
                                    top: obj.y - 16,
                                    opacity: obj.alt < 0 ? 0.25 : 1,
                                }]}
                            >
                                {/* Rond */}
                                <View style={[styles.objectDot, { borderColor: obj.color }]}>
                                    <View style={[styles.objectDotInner, { backgroundColor: obj.color }]} />
                                </View>
                                {/* Nom */}
                                <Text style={[styles.objectName, { color: obj.color }]}>
                                    {obj.object.Common_names ? obj.object.Common_names : obj.object.M ? obj.object.M : obj.object.Name}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Footer — slider temporel */}
                <View style={styles.footer}>
                    <View style={styles.footerRow}>
                        <Text style={styles.footerLabel}>Heure d'observation</Text>
                        <Text style={styles.footerValue}>{observationTime()}</Text>
                    </View>
                    <Slider
                        minimumValue={-12}
                        maximumValue={12}
                        step={0.25}
                        value={timeOffset}
                        onValueChange={(val) => setTimeOffset(val[0])}
                        minimumTrackTintColor="#4682B4"
                        maximumTrackTintColor="#1f2833"
                        thumbTintColor="#4682B4"
                    />
                </View>

            </SafeAreaView>
        </SafeAreaProvider>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        backgroundColor: 'rgba(65, 61, 61, 0.25)',
        top: 0,
        zIndex: 10,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderColor: '#848688ff',
        gap: 20,
    },
    headerTitle: {
        color: '#161b1fff',
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    skyView: {
        flex: 1,
        backgroundColor: '#020205',
    },
    cardinal: {
        position: 'absolute',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    objectMarker: {
        position: 'absolute',
        alignItems: 'center',
        gap: 4,
    },
    objectDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    objectDotInner: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    objectName: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    footer: {
        padding: 20,
        backgroundColor: 'rgba(11,12,16,0.95)',
        borderTopWidth: 1,
        borderColor: '#1f2833',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    footerLabel: {
        color: '#c5c6c7',
        fontSize: 12,
    },
    footerValue: {
        color: '#4682B4',
        fontSize: 13,
        fontWeight: 'bold',
    },
});