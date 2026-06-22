import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalibrationResult {
    azimuthOffset: number;  // Azimut (°) correspondant au pixel 0 de la photo
    horizonY: number;       // Position Y (px, espace MAP) de l'horizon à 0°
}

interface Props {
    panoramaSource: any;
    originalWidth: number;
    originalHeight: number;
    mapWidth?: number;
    verticalFOV?: number;
    onComplete: (result: CalibrationResult) => void;
    onCancel?: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const COMPASS_LABELS = [
    { az: 0, label: 'N' },
    { az: 45, label: 'NE' },
    { az: 90, label: 'E' },
    { az: 135, label: 'SE' },
    { az: 180, label: 'S' },
    { az: 225, label: 'SO' },
    { az: 270, label: 'O' },
    { az: 315, label: 'NO' },
];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PanoramaCalibration({
    panoramaSource,
    originalWidth,
    originalHeight,
    mapWidth = 3600,
    verticalFOV = 66,
    onComplete,
    onCancel,
}: Props) {

    const MAP_HEIGHT = (originalHeight / originalWidth) * mapWidth;
    const PX_PER_DEG_AZ = mapWidth / 360;

    // ── Étape — ref + state synchronisés pour le PanResponder ─────────────────
    const stepRef = useRef<1 | 2>(1);
    const [step, setStepState] = useState<1 | 2>(1);
    const setStep = useCallback((s: 1 | 2) => {
        stepRef.current = s;
        setStepState(s);
    }, []);

    // ── Étape 1 : Azimut ──────────────────────────────────────────────────────
    const [scrollX, setScrollX] = useState(0);

    // Azimut pointé par le centre de l'écran (lecture temps réel)
    const azimutAtCenter = ((scrollX + WINDOW_WIDTH / 2) / PX_PER_DEG_AZ) % 360;

    // ── Étape 2 : Horizon ─────────────────────────────────────────────────────
    const [horizonOffset, setHorizonOffset] = useState(0); // décalage vertical en px
    const lastY = useRef(0);
    const [isDragging, setIsDragging] = useState(false);

    // horizonY dans l'espace MAP = milieu de MAP_HEIGHT décalé par le drag
    const horizonMapY = MAP_HEIGHT / 2 - horizonOffset;

    // ── PanResponder — lit stepRef pour éviter la closure figée ───────────────
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => stepRef.current === 2,
            onMoveShouldSetPanResponder: () => stepRef.current === 2,
            onPanResponderGrant: (e) => {
                lastY.current = e.nativeEvent.pageY;
                setIsDragging(true);
            },
            onPanResponderMove: (e) => {
                const dy = e.nativeEvent.pageY - lastY.current;
                lastY.current = e.nativeEvent.pageY;
                setHorizonOffset(prev => {
                    const next = prev + dy;
                    const maxOffset = MAP_HEIGHT / 2 - 20;
                    return Math.max(-maxOffset, Math.min(maxOffset, next));
                });
            },
            onPanResponderRelease: () => setIsDragging(false),
        })
    ).current;

    // ── Validation étape 1 ────────────────────────────────────────────────────
    const handleValidateAzimuth = useCallback(() => {
        setStep(2);
    }, [setStep]);

    // ── Validation étape 2 → résultat final ──────────────────────────────────
    const handleValidateHorizon = useCallback(() => {
        // Le Nord est au centre de l'écran → northInMap = scrollX + demi-écran
        const northInMap = scrollX + WINDOW_WIDTH / 2;
        // azimuthOffset = azimut du pixel 0 de la photo
        // = -(position du Nord en degrés), normalisé dans [0, 360[
        let azimuthOffset = (360 - (northInMap / PX_PER_DEG_AZ) % 360) % 360;

        onComplete({
            azimuthOffset: Math.round(azimuthOffset * 10) / 10,
            horizonY: Math.round(horizonMapY),
        });
    }, [scrollX, horizonMapY, PX_PER_DEG_AZ, onComplete]);

    // ── Retour étape 1 ────────────────────────────────────────────────────────
    const handleBack = useCallback(() => {
        setStep(1);
    }, [setStep]);

    // ── Étape 1 : Azimut ──────────────────────────────────────────────────────
    const renderAzimuthStep = () => (
        <View style={styles.flex}>
            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                scrollEventThrottle={16}
                onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
                contentContainerStyle={{ width: mapWidth, height: MAP_HEIGHT }}
                style={styles.flex}
            >
                <Image
                    source={panoramaSource}
                    style={{ position: 'absolute', width: mapWidth, height: MAP_HEIGHT }}
                    resizeMode="cover"
                />

                {/* Repères cardinaux sur la photo */}
                {COMPASS_LABELS.map(({ az, label }) => (
                    <View
                        key={az}
                        style={[styles.cardinalMark, {
                            left: az * PX_PER_DEG_AZ - 20,
                            top: MAP_HEIGHT * 0.06,
                        }]}
                    >
                        <View style={styles.cardinalLine} />
                        <Text style={styles.cardinalLabel}>{label}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Curseur central fixe — le "pointeur Nord" */}
            <View style={styles.centerCursorContainer} pointerEvents="none">
                <View style={styles.centerCursorLine} />
                <View style={styles.centerCursorTriangle} />
                <Text style={styles.centerCursorLabel}>{Math.round(azimutAtCenter)}°</Text>
            </View>

            {/* Instruction */}
            <View style={styles.instructionBanner} pointerEvents="none">
                <MaterialCommunityIcons name="compass-rose" size={18} color="#4682B4" />
                <Text style={styles.instructionText}>
                    Faites défiler jusqu'à ce que la flèche pointe vers le{' '}
                    <Text style={styles.bold}>Nord</Text> de votre photo
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerInfo}>
                    <Text style={styles.footerLabel}>Azimut au centre</Text>
                    <Text style={styles.footerValue}>{Math.round(azimutAtCenter)}°</Text>
                </View>
                <TouchableOpacity style={styles.validateButton} onPress={handleValidateAzimuth}>
                    <Text style={styles.validateButtonText}>Confirmer le Nord</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Étape 2 : Horizon ─────────────────────────────────────────────────────
    const renderHorizonStep = () => (
        <View style={styles.flex} {...panResponder.panHandlers}>
            {/* Image décalée verticalement */}
            <View style={styles.overflowHidden}>
                <Image
                    source={panoramaSource}
                    style={{
                        width: WINDOW_WIDTH,
                        height: MAP_HEIGHT,
                        transform: [{ translateY: horizonOffset }],
                    }}
                    resizeMode="cover"
                />
            </View>

            {/* Ligne d'horizon fixe au centre de l'écran */}
            <View
                style={[styles.horizonLine, {
                    top: WINDOW_HEIGHT / 2 - 1,
                    borderColor: isDragging ? '#FFD700' : '#FF4444',
                }]}
                pointerEvents="none"
            />
            <View
                style={[styles.horizonLabel, { top: WINDOW_HEIGHT / 2 - 22 }]}
                pointerEvents="none"
            >
                <Text style={styles.horizonLabelText}>Horizon 0°</Text>
            </View>

            {/* Instruction */}
            <View style={styles.instructionBanner} pointerEvents="none">
                <MaterialCommunityIcons name="gesture-swipe-vertical" size={18} color="#4682B4" />
                <Text style={styles.instructionText}>
                    Glissez verticalement pour aligner la ligne{' '}
                    <Text style={styles.bold}>rouge</Text> sur votre horizon réel
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color="#4682B4" />
                    <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
                <View style={styles.footerInfo}>
                    <Text style={styles.footerLabel}>Décalage</Text>
                    <Text style={styles.footerValue}>
                        {horizonOffset > 0 ? '+' : ''}{Math.round(horizonOffset)}px
                    </Text>
                </View>
                <TouchableOpacity style={styles.validateButton} onPress={handleValidateHorizon}>
                    <Text style={styles.validateButtonText}>Confirmer</Text>
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Rendu principal ───────────────────────────────────────────────────────
    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                {onCancel && (
                    <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                        <MaterialCommunityIcons name="close" size={20} color="#c5c6c7" />
                    </TouchableOpacity>
                )}
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Calibration panorama</Text>
                    <Text style={styles.headerStep}>Étape {step} / 2</Text>
                </View>
                <View style={styles.stepDots}>
                    <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
                    <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
                </View>
            </View>

            {step === 1 ? renderAzimuthStep() : renderHorizonStep()}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0b0c10',
    },
    flex: {
        flex: 1,
    },
    overflowHidden: {
        flex: 1,
        overflow: 'hidden',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: '#1f2833',
        backgroundColor: '#0b0c10',
        zIndex: 10,
    },
    cancelButton: {
        padding: 4,
        marginRight: 8,
    },
    headerCenter: {
        flex: 1,
    },
    headerTitle: {
        color: '#4682B4',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStep: {
        color: '#c5c6c7',
        fontSize: 12,
        marginTop: 2,
    },
    stepDots: {
        flexDirection: 'row',
        gap: 6,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1f2833',
        borderWidth: 1,
        borderColor: '#4682B4',
    },
    stepDotActive: {
        backgroundColor: '#4682B4',
    },

    // Repères cardinaux (étape 1)
    cardinalMark: {
        position: 'absolute',
        alignItems: 'center',
        width: 40,
    },
    cardinalLine: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    cardinalLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    // Curseur central (étape 1)
    centerCursorContainer: {
        position: 'absolute',
        left: WINDOW_WIDTH / 2 - 1,
        top: 0,
        bottom: 80,
        alignItems: 'center',
        zIndex: 5,
    },
    centerCursorLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#FFD700',
        opacity: 0.8,
    },
    centerCursorTriangle: {
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 14,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFD700',
        marginBottom: 4,
    },
    centerCursorLabel: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },

    // Ligne d'horizon (étape 2)
    horizonLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    horizonLabel: {
        position: 'absolute',
        left: 12,
        backgroundColor: 'rgba(255,68,68,0.85)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    horizonLabelText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },

    // Instruction
    instructionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(11,12,16,0.92)',
        borderWidth: 1,
        borderColor: '#1f2833',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        zIndex: 5,
    },
    instructionText: {
        color: '#c5c6c7',
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    bold: {
        color: '#fff',
        fontWeight: 'bold',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: 'rgba(11,12,16,0.97)',
        borderTopWidth: 1,
        borderColor: '#1f2833',
        zIndex: 10,
    },
    footerInfo: {
        alignItems: 'center',
    },
    footerLabel: {
        color: '#c5c6c7',
        fontSize: 11,
    },
    footerValue: {
        color: '#4682B4',
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 2,
    },
    validateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#4682B4',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 8,
    },
    validateButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#4682B4',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#4682B4',
        fontSize: 14,
    },
});