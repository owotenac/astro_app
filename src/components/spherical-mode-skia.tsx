/**
 * Planétarium sphérique en Skia
 *
 * Version mobile optimisée utilisant @shopify/react-native-skia
 */

import typesMapping from '@/assets/data/celestialtype.json';
import { GlobalColors, globalStyles, Spacing, textStyles } from '@/global/theme';
import { useCatalog } from '@/hooks/useCatalog';
import { useFilterStore } from '@/hooks/useFilterStore';
import { useLocation } from '@/hooks/useLocation';
import { useMountStore } from '@/hooks/useMountStore';
import { useObservationStore } from '@/hooks/useObservationStore';
import { useResponsive } from '@/hooks/useResponsive';
import { useSettingsStore } from '@/hooks/useSettings';
import { CelestialObject } from '@/model/celestialobject';
import { ConstellationObject } from '@/model/constellations';
import { Planet } from '@/model/planet';
import { PointableObject } from '@/model/pointable';
import { StarObject } from '@/model/stars';
import { computeAzAlt } from '@/utils/compute';
import { filterCatalog } from '@/utils/filter';
import { computeAllPlanets } from '@/utils/planets';
import { azimuthalEquidistantProject } from '@/utils/projection';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { Canvas, Circle, Group, Line, matchFont, Text as SkiaText, vec } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import constellationJson from '../../assets/data/constellations_lines.json';
import starJson from '../../assets/data/stars.json';

// ─── Constantes ───────────────────────────────────────────────────────────────

const CARDINALS = [
    { az: 0, label: 'N' },
    { az: 45, label: 'NE' },
    { az: 90, label: 'E' },
    { az: 135, label: 'SE' },
    { az: 180, label: 'S' },
    { az: 225, label: 'SO' },
    { az: 270, label: 'O' },
    { az: 315, label: 'NO' },
];

const ALTITUDE_CIRCLES = [75, 60, 45, 30, 15, 0];

// ─── Types ────────────────────────────────────────────────────────────────────

interface RenderedObject extends PointableObject {
    object: CelestialObject;
    color: string;
}

interface RenderedStar extends PointableObject {
    size: number;
    opacity: number;
    displayName: string | null;
}

interface ConstellationSegment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface RenderedConstellation {
    id: string;
    name: string;
    segments: ConstellationSegment[];
}

interface RenderedPlanet extends PointableObject {
    planet: Planet;
}

const starCatalog: StarObject[] = starJson as StarObject[];
const constellationCatalog: ConstellationObject[] = constellationJson as ConstellationObject[];
const starCatalogSorted = [...starCatalog].sort((a, b) => a.v_mag - b.v_mag);

const starByHip: Map<number, StarObject> = new Map();
for (const star of starCatalog) {
    const existing = starByHip.get(star.hip);
    if (!existing || star.v_mag < existing.v_mag) {
        starByHip.set(star.hip, star);
    }
}

const magToSize = (mag: number): number => Math.max(1, 4 - mag * 0.5);
const magToOpacity = (mag: number): number => Math.max(0.3, Math.min(1, 1.2 - mag * 0.15));

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SkiaSphericalPlanetarium() {
    // Fonts (créées dans le composant pour éviter l'exécution sur web)
    const font = useMemo(() => matchFont({
        fontFamily: 'System',
        fontWeight: 'normal' as const,
        fontSize: 10,
    }), []);

    const cardinalFont = useMemo(() => matchFont({
        fontFamily: 'System',
        fontWeight: 'bold' as const,
        fontSize: 12,
    }), []);
    const { width: screenWidth, height: screenHeight, isMobilePortrait } = useResponsive();

    const HEADER_HEIGHT = 52;
    const FOOTER_HEIGHT_COLLAPSED = 56;
    const FOOTER_HEIGHT_EXPANDED = 180;
    const NAV_HEIGHT = isMobilePortrait ? 60 : 0;

    const [footerExpanded, setFooterExpanded] = useState(false);
    const currentFooterHeight = isMobilePortrait
        ? (footerExpanded ? FOOTER_HEIGHT_EXPANDED : FOOTER_HEIGHT_COLLAPSED)
        : 100;

    const availableHeight = screenHeight - HEADER_HEIGHT - currentFooterHeight - NAV_HEIGHT - 16;
    const skyViewSize = Math.max(100, Math.min(screenWidth - 16, availableHeight));
    const skyRadius = skyViewSize / 2;
    const skyCenter = skyRadius;

    const currentFilter = useFilterStore(state => state.currentFilter);
    const { catalog } = useCatalog();
    const location = useLocation();
    const setTargetDate = useObservationStore(state => state.setTargetDate);
    const slewMode = useMountStore(state => state.slewMode);
    const setTargetPosition = useMountStore(state => state.setTargetPosition);
    const setSelectedObject = useMountStore(state => state.setSelectedObject);

    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>([]);
    const [visibleObjects, setVisibleObjects] = useState<RenderedObject[]>([]);
    const [visibleStars, setVisibleStars] = useState<RenderedStar[]>([]);
    const [visibleConstellations, setVisibleConstellations] = useState<RenderedConstellation[]>([]);
    const [visiblePlanets, setVisiblePlanets] = useState<RenderedPlanet[]>([]);
    const [timeOffset, setTimeOffset] = useState(0);
    const [displayTimeOffset, setDisplayTimeOffset] = useState(0);

    const viewSettings = useSettingsStore(state => state.settings.view);
    const updateView = useSettingsStore(state => state.updateView);

    const [showStars, setShowStars] = useState(viewSettings.showStars);
    const [showObjects, setShowObjects] = useState(viewSettings.showObjects);
    const [showNames, setShowNames] = useState(viewSettings.showNames);
    const [showConstellations, setShowConstellations] = useState(viewSettings.showConstellations);
    const [mirrorView, setMirrorView] = useState(viewSettings.mirrorView);
    const [showPlanets, setShowPlanets] = useState(viewSettings.showPlanets);
    const [starMagnitude, setStarMagnitude] = useState(viewSettings.starMagnitude);

    // Zoom state (React state - Skia est déjà rapide)
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);

    useEffect(() => {
        setShowStars(viewSettings.showStars);
        setShowConstellations(viewSettings.showConstellations);
        setShowObjects(viewSettings.showObjects);
        setShowNames(viewSettings.showNames);
        setMirrorView(viewSettings.mirrorView);
        setStarMagnitude(viewSettings.starMagnitude);
    }, [viewSettings]);

    // ── Date/heure cible ──────────────────────────────────────────────────────
    const targetDate = useMemo(() => {
        const d = new Date();
        d.setTime(d.getTime() + timeOffset * 3600 * 1000);
        return d;
    }, [timeOffset]);

    const displayDate = useMemo(() => {
        const d = new Date();
        d.setTime(d.getTime() + displayTimeOffset * 3600 * 1000);
        return d;
    }, [displayTimeOffset]);

    useEffect(() => {
        if (catalog.length > 0) {
            setFilteredCatalog(filterCatalog(catalog, currentFilter, '', targetDate));
        }
    }, [catalog, currentFilter, targetDate]);

    useEffect(() => {
        setTargetDate(targetDate);
    }, [targetDate, setTargetDate]);

    useEffect(() => {
        const tick = () => {
            setTimeOffset(t => t + 0.0001);
            setDisplayTimeOffset(t => t + 0.0001);
        };
        tick();
        const intervalId = setInterval(tick, 5000);
        return () => clearInterval(intervalId);
    }, []);

    // ── Pinch-to-zoom ─────────────────────────────────────────────────────────
    const baseZoom = useRef(1);
    const basePanX = useRef(0);
    const basePanY = useRef(0);

    const updateTransform = useCallback((z: number, x: number, y: number) => {
        setZoom(z);
        setPanX(x);
        setPanY(y);
    }, []);

    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            baseZoom.current = zoom;
        })
        .onUpdate((e) => {
            const newZoom = Math.max(1, Math.min(5, baseZoom.current * e.scale));
            runOnJS(setZoom)(newZoom);
        })
        .onEnd(() => {
            if (zoom <= 1.05) {
                runOnJS(updateTransform)(1, 0, 0);
            }
        });

    const panGesture = Gesture.Pan()
        .onStart(() => {
            basePanX.current = panX;
            basePanY.current = panY;
        })
        .onUpdate((e) => {
            if (zoom <= 1) return;
            const maxPan = (skyViewSize * (zoom - 1)) / 2;
            const newPanX = Math.max(-maxPan, Math.min(maxPan, basePanX.current + e.translationX));
            const newPanY = Math.max(-maxPan, Math.min(maxPan, basePanY.current + e.translationY));
            runOnJS(setPanX)(newPanX);
            runOnJS(setPanY)(newPanY);
        });

    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

    // ── Projection des objets célestes ────────────────────────────────────────
    useEffect(() => {
        if (!location.ready || !showObjects) return;

        const nextObjects: RenderedObject[] = [];

        for (const obj of filteredCatalog) {
            if (!obj.ra_deg || !obj.dec_deg) continue;

            const { azimuth, altitude } = computeAzAlt(obj, targetDate);
            const projected = azimuthalEquidistantProject(azimuth, altitude, skyRadius, -5, mirrorView);

            if (!projected.visible) continue;

            const typeInfo = typesMapping[obj.Type as keyof typeof typesMapping]
                ?? { label: obj.Type, color: GlobalColors.unknownType };

            nextObjects.push({
                object: obj,
                color: typeInfo.color,
                x: projected.x + skyCenter,
                y: projected.y + skyCenter,
                alt: altitude,
                az: azimuth,
                name: obj.Common_names || obj.M || obj.Name,
                type: 'object',
            });
        }

        setVisibleObjects(nextObjects);
    }, [location.ready, filteredCatalog, targetDate, mirrorView, showObjects]);

    // ── Étoiles filtrées par magnitude ────────────────────────────────────────
    const filteredStars = useMemo(() => {
        const result: StarObject[] = [];
        for (const star of starCatalogSorted) {
            if (star.v_mag > starMagnitude) break;
            result.push(star);
        }
        return result;
    }, [starMagnitude]);

    // ── Projection des étoiles ────────────────────────────────────────────────
    useEffect(() => {
        if (!location.ready || !showStars) return;

        const nextStars: RenderedStar[] = [];

        for (const star of filteredStars) {
            const starAsObj = { ra_deg: star.ra, dec_deg: star.dec } as CelestialObject;
            const { azimuth, altitude } = computeAzAlt(starAsObj, targetDate);
            if (altitude < -5) continue;

            const projected = azimuthalEquidistantProject(azimuth, altitude, skyRadius, -5, mirrorView);
            if (!projected.visible) continue;

            nextStars.push({
                x: projected.x + skyCenter,
                y: projected.y + skyCenter,
                size: magToSize(star.v_mag),
                opacity: magToOpacity(star.v_mag),
                name: star.common_name || `HIP ${star.hip}`,
                displayName: star.v_mag <= 2.5 ? star.common_name : null,
                az: azimuth,
                alt: altitude,
                type: 'star',
            });
        }

        setVisibleStars(nextStars);
    }, [location.ready, targetDate, filteredStars, mirrorView, showStars]);

    // ── Projection des constellations ────────────────────────────────────────
    useEffect(() => {
        if (!location.ready || !showConstellations) return;

        const nextConstellations: RenderedConstellation[] = [];

        for (const constellation of constellationCatalog) {
            const segments: ConstellationSegment[] = [];

            for (const line of constellation.lines) {
                for (let i = 0; i < line.length - 1; i++) {
                    const star1 = starByHip.get(line[i]);
                    const star2 = starByHip.get(line[i + 1]);

                    if (!star1 || !star2) continue;

                    const pos1 = computeAzAlt({ ra_deg: star1.ra, dec_deg: star1.dec } as CelestialObject, targetDate);
                    const pos2 = computeAzAlt({ ra_deg: star2.ra, dec_deg: star2.dec } as CelestialObject, targetDate);

                    if (pos1.altitude < -5 && pos2.altitude < -5) continue;

                    const proj1 = azimuthalEquidistantProject(pos1.azimuth, pos1.altitude, skyRadius, -5, mirrorView);
                    const proj2 = azimuthalEquidistantProject(pos2.azimuth, pos2.altitude, skyRadius, -5, mirrorView);

                    if (!proj1.visible || !proj2.visible) continue;

                    segments.push({
                        x1: proj1.x + skyCenter,
                        y1: proj1.y + skyCenter,
                        x2: proj2.x + skyCenter,
                        y2: proj2.y + skyCenter,
                    });
                }
            }

            if (segments.length > 0) {
                nextConstellations.push({
                    id: constellation.id,
                    name: constellation.name,
                    segments,
                });
            }
        }

        setVisibleConstellations(nextConstellations);
    }, [location.ready, targetDate, mirrorView, showConstellations]);

    // ── Projection des planètes ───────────────────────────────────────────────
    useEffect(() => {
        if (!location.ready || !showPlanets) return;

        const planets = computeAllPlanets(targetDate, true);
        const nextPlanets: RenderedPlanet[] = [];

        for (const planet of planets) {
            if (planet.altitude < -5) continue;

            const projected = azimuthalEquidistantProject(planet.azimuth, planet.altitude, skyRadius, -5, mirrorView);
            if (!projected.visible) continue;

            nextPlanets.push({
                planet,
                x: projected.x + skyCenter,
                y: projected.y + skyCenter,
                az: planet.azimuth,
                alt: planet.altitude,
                name: planet.name,
                type: 'planet',
            });
        }

        setVisiblePlanets(nextPlanets);
    }, [location.ready, targetDate, mirrorView, showPlanets]);

    // ── Cercles de grille ─────────────────────────────────────────────────────
    const gridCircles = useMemo(() => {
        return ALTITUDE_CIRCLES.map(alt => {
            const zenithDist = 90 - alt;
            return { alt, radius: (zenithDist / 90) * skyRadius };
        });
    }, [skyRadius]);

    // ── Lignes et labels cardinaux ────────────────────────────────────────────
    const cardinalData = useMemo(() => {
        return CARDINALS.map(c => {
            const projected = azimuthalEquidistantProject(c.az, 0, skyRadius, -10, mirrorView);
            return {
                ...c,
                x2: projected.x + skyCenter,
                y2: projected.y + skyCenter,
            };
        });
    }, [mirrorView, skyRadius, skyCenter]);

    const observationTime = (): string => {
        return `${displayDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })} - ${displayDate.getHours()}h${displayDate.getMinutes().toString().padStart(2, '0')}`;
    };

    const toggleShowStars = () => {
        const newValue = !showStars;
        setShowStars(newValue);
        updateView({ showStars: newValue });
    };

    const toggleShowObjects = () => {
        const newValue = !showObjects;
        setShowObjects(newValue);
        updateView({ showObjects: newValue });
    };

    const toggleShowNames = () => {
        const newValue = !showNames;
        setShowNames(newValue);
        updateView({ showNames: newValue });
    };

    const toggleShowConstellations = () => {
        const newValue = !showConstellations;
        setShowConstellations(newValue);
        updateView({ showConstellations: newValue });
    };

    const toggleMirrorView = () => {
        const newValue = !mirrorView;
        setMirrorView(newValue);
        updateView({ mirrorView: newValue });
    };

    const toggleShowPlanets = () => {
        const newValue = !showPlanets;
        setShowPlanets(newValue);
        updateView({ showPlanets: newValue });
    };

    const resetZoom = () => {
        setZoom(1);
        setPanX(0);
        setPanY(0);
    };

    // ── Rendu ─────────────────────────────────────────────────────────────────

    return (
        <SafeAreaProvider>
            <SafeAreaView style={globalStyles.appShell}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <Text style={textStyles.viewTitle}>Grille Azimutale (Skia)</Text>
                    </View>
                    {zoom > 1 && (
                        <TouchableOpacity onPress={resetZoom} style={styles.headerButton}>
                            <Text style={textStyles.accentBold}>{zoom.toFixed(1)}x</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Slew Mode Banner */}
                {slewMode && (
                    <View style={styles.slewModeBanner}>
                        <MaterialCommunityIcons name="target" size={18} color={GlobalColors.background} />
                        <Text style={textStyles.inverse}>Mode pointage actif</Text>
                    </View>
                )}

                {/* Vue du ciel Skia */}
                <View style={globalStyles.skyViewport}>
                    <GestureDetector gesture={composedGesture}>
                        <View style={[styles.canvasContainer, { width: skyViewSize, height: skyViewSize, borderRadius: skyRadius }]}>
                            <Canvas style={{ width: skyViewSize, height: skyViewSize }}>
                                <Group
                                    transform={[
                                        { translateX: skyCenter },
                                        { translateY: skyCenter },
                                        { scale: zoom },
                                        { translateX: panX / zoom },
                                        { translateY: panY / zoom },
                                        { translateX: -skyCenter },
                                        { translateY: -skyCenter },
                                    ]}
                                >
                                    {/* Fond du ciel */}
                                    <Circle
                                        cx={skyCenter}
                                        cy={skyCenter}
                                        r={skyRadius}
                                        color={GlobalColors.skyDome}
                                    />

                                    {/* Cercles d'altitude */}
                                    {gridCircles.map(({ alt, radius }) => (
                                        <Circle
                                            key={`grid-${alt}`}
                                            cx={skyCenter}
                                            cy={skyCenter}
                                            r={radius}
                                            color={GlobalColors.gridStroke}
                                            style="stroke"
                                            strokeWidth={1}
                                        />
                                    ))}

                                    {/* Lignes cardinales */}
                                    {cardinalData.filter(c => c.az % 45 === 0).map(c => (
                                        <Line
                                            key={`line-${c.az}`}
                                            p1={vec(skyCenter, skyCenter)}
                                            p2={vec(c.x2, c.y2)}
                                            color={GlobalColors.gridStroke}
                                            strokeWidth={1}
                                        />
                                    ))}

                                    {/* Labels cardinaux */}
                                    {cardinalFont && cardinalData.map(c => (
                                        <SkiaText
                                            key={`label-${c.az}`}
                                            x={c.x2 - 5}
                                            y={c.y2 + 4}
                                            text={c.label}
                                            font={cardinalFont}
                                            color={c.az % 90 === 0 ? GlobalColors.cardinalPrimary : GlobalColors.cardinalSecondary}
                                        />
                                    ))}

                                    {/* Constellations */}
                                    {showConstellations && visibleConstellations.map(constellation =>
                                        constellation.segments.map((seg, i) => (
                                            <Line
                                                key={`${constellation.id}-seg-${i}`}
                                                p1={vec(seg.x1, seg.y1)}
                                                p2={vec(seg.x2, seg.y2)}
                                                color={GlobalColors.constellationStroke}
                                                strokeWidth={1}
                                            />
                                        ))
                                    )}

                                    {/* Étoiles */}
                                    {showStars && visibleStars.map((star, i) => (
                                        <Circle
                                            key={`star-${i}`}
                                            cx={star.x}
                                            cy={star.y}
                                            r={star.size / 2}
                                            color={`rgba(255, 255, 255, ${star.opacity})`}
                                        />
                                    ))}

                                    {/* Objets célestes */}
                                    {showObjects && visibleObjects.map((obj, i) => {
                                        const label = obj.object.Common_names || obj.object.M || obj.object.Name;
                                        return (
                                            <Group key={`obj-${i}`} opacity={obj.alt < 0 ? 0.25 : 1}>
                                                <Circle
                                                    cx={obj.x}
                                                    cy={obj.y}
                                                    r={9}
                                                    color={GlobalColors.objectLabelBg}
                                                />
                                                <Circle
                                                    cx={obj.x}
                                                    cy={obj.y}
                                                    r={9}
                                                    color={obj.color}
                                                    style="stroke"
                                                    strokeWidth={1.5}
                                                />
                                                <Circle
                                                    cx={obj.x}
                                                    cy={obj.y}
                                                    r={2.5}
                                                    color={obj.color}
                                                />
                                                {showNames && font && (
                                                    <SkiaText
                                                        x={obj.x - (label.length * 3)}
                                                        y={obj.y + 20}
                                                        text={label}
                                                        font={font}
                                                        color={obj.color}
                                                    />
                                                )}
                                            </Group>
                                        );
                                    })}

                                    {/* Planètes */}
                                    {showPlanets && visiblePlanets.map((p, i) => (
                                        <Group key={`planet-${i}`} opacity={p.planet.altitude < 10 ? 0.25 : 1}>
                                            <Circle
                                                cx={p.x}
                                                cy={p.y}
                                                r={p.planet.radius}
                                                color={p.planet.color}
                                            />
                                            {showNames && font && (
                                                <SkiaText
                                                    x={p.x - (p.planet.name.length * 3)}
                                                    y={p.y + 20}
                                                    text={p.planet.name}
                                                    font={font}
                                                    color={p.planet.color}
                                                />
                                            )}
                                        </Group>
                                    ))}

                                    {/* Zénith */}
                                    <Circle
                                        cx={skyCenter}
                                        cy={skyCenter}
                                        r={3}
                                        color={GlobalColors.zenithDot}
                                    />
                                </Group>
                            </Canvas>
                        </View>
                    </GestureDetector>
                </View>

                {/* Footer */}
                <View style={[styles.footer, isMobilePortrait && styles.footerMobile]}>
                    {(!isMobilePortrait || footerExpanded) && (
                        <>
                            <View style={[styles.footerElement, isMobilePortrait && styles.footerElementMobile]}>
                                <View style={styles.footerRow}>
                                    <Text style={textStyles.sectionLabel}>Heure</Text>
                                    <Text style={textStyles.valueEmphasis}>{observationTime()}</Text>
                                </View>
                                <Slider
                                    containerStyle={styles.footerSlider}
                                    minimumValue={0}
                                    maximumValue={24}
                                    step={0.25}
                                    value={displayTimeOffset}
                                    onValueChange={(val) => setDisplayTimeOffset(val[0])}
                                    onSlidingComplete={(val) => setTimeOffset(val[0])}
                                    minimumTrackTintColor={GlobalColors.primary}
                                    maximumTrackTintColor={GlobalColors.sliderTrack}
                                    thumbTintColor={GlobalColors.accent}
                                />
                            </View>
                            <View style={[styles.footerElement, isMobilePortrait && styles.footerElementMobile]}>
                                <Text style={textStyles.sectionLabel}>Magnitude · {starMagnitude.toFixed(1)}</Text>
                                <Slider
                                    containerStyle={styles.footerSlider}
                                    minimumValue={0}
                                    maximumValue={7}
                                    step={0.1}
                                    value={starMagnitude}
                                    onValueChange={(val) => {
                                        setStarMagnitude(val[0]);
                                        updateView({ starMagnitude: val[0] });
                                    }}
                                    minimumTrackTintColor={GlobalColors.primary}
                                    maximumTrackTintColor={GlobalColors.sliderTrack}
                                    thumbTintColor={GlobalColors.accent}
                                />
                            </View>
                        </>
                    )}
                    <View style={[styles.footerToggles, isMobilePortrait && styles.footerTogglesMobile]}>
                        <View style={globalStyles.footerToolbar}>
                            <TouchableOpacity
                                style={[globalStyles.footerIconButton, showStars && globalStyles.footerIconButtonActive]}
                                onPress={toggleShowStars}
                            >
                                <MaterialCommunityIcons name="star" size={18} color={showStars ? GlobalColors.textPrimary : GlobalColors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[globalStyles.footerIconButton, showConstellations && globalStyles.footerIconButtonActive]}
                                onPress={toggleShowConstellations}
                            >
                                <MaterialCommunityIcons name="vector-polyline" size={18} color={showConstellations ? GlobalColors.textPrimary : GlobalColors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[globalStyles.footerIconButton, showObjects && globalStyles.footerIconButtonActive]}
                                onPress={toggleShowObjects}
                            >
                                <MaterialCommunityIcons name="brightness-4" size={18} color={showObjects ? GlobalColors.textPrimary : GlobalColors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[globalStyles.footerIconButton, showPlanets && globalStyles.footerIconButtonActive]}
                                onPress={toggleShowPlanets}
                            >
                                <MaterialCommunityIcons name="brightness-2" size={18} color={showPlanets ? GlobalColors.textPrimary : GlobalColors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[globalStyles.footerIconButton, showNames && globalStyles.footerIconButtonActive]}
                                onPress={toggleShowNames}
                            >
                                <MaterialCommunityIcons name="alphabetical" size={18} color={showNames ? GlobalColors.textPrimary : GlobalColors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={globalStyles.footerIconButton} onPress={toggleMirrorView}>
                                <MaterialCommunityIcons name="flip-horizontal" size={18} color={GlobalColors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        {isMobilePortrait && (
                            <TouchableOpacity
                                style={globalStyles.footerIconButton}
                                onPress={() => setFooterExpanded(!footerExpanded)}
                            >
                                <MaterialCommunityIcons
                                    name={footerExpanded ? "chevron-down" : "chevron-up"}
                                    size={20}
                                    color={GlobalColors.textMuted}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

            </SafeAreaView>
        </SafeAreaProvider>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        backgroundColor: GlobalColors.overlayDark,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: GlobalColors.separator,
    },
    headerInfo: {
        flex: 1,
    },
    headerButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 4,
        backgroundColor: GlobalColors.surfaceRaised,
    },
    slewModeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        backgroundColor: GlobalColors.primary,
    },
    canvasContainer: {
        overflow: 'hidden',
    },
    footer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: GlobalColors.overlayDark,
        borderTopWidth: 1,
        borderTopColor: GlobalColors.separator,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: Spacing.xl,
    },
    footerMobile: {
        flexDirection: 'column',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    footerElement: {
        borderRightWidth: 1,
        borderRightColor: GlobalColors.separator,
        paddingRight: Spacing.xl,
        justifyContent: 'center',
        minWidth: 200,
    },
    footerElementMobile: {
        borderRightWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: GlobalColors.separator,
        paddingRight: 0,
        paddingBottom: Spacing.sm,
        minWidth: undefined,
        width: '100%',
    },
    footerToggles: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerTogglesMobile: {
        width: '100%',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
        gap: Spacing.sm,
    },
    footerSlider: {
    },
});
