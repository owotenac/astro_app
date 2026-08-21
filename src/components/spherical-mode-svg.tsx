/**
 * Planétarium sphérique en SVG
 *
 * Utilise react-native-svg pour le rendu.
 */

import typesMapping from '@/assets/data/celestialtype.json';
import { GlobalColors, globalStyles, Radius, Spacing, starFillOpacity, SvgTypography, textStyles } from '@/global/theme';
import { useFilterStore } from '@/hooks/useFilterStore';
import { useLocation } from '@/hooks/useLocation';
import { useMountStore } from '@/hooks/useMountStore';
import { useObservationStore } from '@/hooks/useObservationStore';
import { usePlateSolveStore } from '@/hooks/usePlateSolveStore';
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
import { computeFovCorners } from '@/utils/platesolve';
import { azimuthalEquidistantProject } from '@/utils/projection';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useDebouncedCallback } from 'use-debounce';

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
    size?: number;
    opacity?: number;
}

interface RenderedStar extends PointableObject {
    size: number;
    opacity: number;
    displayName: string | null;  // Nom à afficher (null si pas de nom commun)
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

// Pré-trier les étoiles par magnitude pour optimiser le filtre
const starCatalogSorted = [...starCatalog].sort((a, b) => a.v_mag - b.v_mag);

// Index HIP → étoile pour lookup rapide (garde la plus brillante si doublon)
const starByHip: Map<number, StarObject> = new Map();
for (const star of starCatalog) {
    const existing = starByHip.get(star.hip);
    if (!existing || star.v_mag < existing.v_mag) {
        starByHip.set(star.hip, star);
    }
}

const svg_magToSize = (mag: number): number => Math.max(1, 4 - mag * 0.5);
const svg_magToOpacity = (mag: number): number => Math.max(0.3, Math.min(1, 1.2 - mag * 0.15));

// ─── Sous-composants mémoïsés ─────────────────────────────────────────────────

const StarsLayer = React.memo(({ stars, showNames, onPress }: { stars: RenderedStar[]; showNames: boolean; onPress?: (star: RenderedStar) => void }) => (
    <G>
        {stars.map((star, i) => (
            <G key={`star-${i}`} onPress={onPress ? () => onPress(star) : undefined}>
                <Circle
                    cx={star.x}
                    cy={star.y}
                    r={star.size / 2}
                    fill={starFillOpacity(star.opacity)}
                />
                {star.displayName && showNames && (
                    <SvgText
                        x={star.x}
                        y={star.y - 12}
                        fontSize={SvgTypography.starName.fontSize}
                        fontWeight={SvgTypography.starName.fontWeight}
                        fontFamily={SvgTypography.starName.fontFamily}
                        fill={GlobalColors.starName}
                        textAnchor="middle"
                    >
                        {star.displayName}
                    </SvgText>
                )}
            </G>
        ))}
    </G>
));

const ConstellationsLayer = React.memo(({ constellations }: { constellations: RenderedConstellation[] }) => (
    <G>
        {constellations.map(constellation => (
            <G key={`const-${constellation.id}`}>
                {constellation.segments.map((seg, i) => (
                    <Line
                        key={`${constellation.id}-seg-${i}`}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke={GlobalColors.constellationStroke}
                        strokeWidth={1}
                    />
                ))}
            </G>
        ))}
    </G>
));

const PlanetsLayer = React.memo(({ planets, showNames, onPress }: { planets: RenderedPlanet[]; showNames: boolean; onPress?: (planet: RenderedPlanet) => void }) => (
    <G>
        {planets.map((p, i) => (
            <G key={`planet-${i}`} opacity={p.planet.altitude < 10 ? 0.25 : 1} onPress={onPress ? () => onPress(p) : undefined}>
                <Circle
                    cx={p.x}
                    cy={p.y}
                    r={p.planet.radius}
                    fill={p.planet.color}
                />
                {showNames && (
                    <SvgText
                        x={p.x}
                        y={p.y + 20}
                        fontSize={SvgTypography.objectName.fontSize}
                        fontWeight={SvgTypography.objectName.fontWeight}
                        fontFamily={SvgTypography.objectName.fontFamily}
                        fill={p.planet.color}
                        textAnchor="middle"
                    >
                        {p.planet.name}
                    </SvgText>
                )}
            </G>
        ))}
    </G>
));

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SvgSphericalPlanetarium() {
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
    const location = useLocation();
    const setTargetDate = useObservationStore(state => state.setTargetDate);
    const mountPosition = useMountStore(state => state.mountPosition);
    const plateSolveCalibration = usePlateSolveStore(state => state.lastResult?.calibration);
    const cameraDimensions = usePlateSolveStore(state => state.cameraDimensions);
    const slewMode = useMountStore(state => state.slewMode);
    const setTargetPosition = useMountStore(state => state.setTargetPosition);
    const selectedObject = useMountStore(state => state.selectedObject);
    const setSelectedObject = useMountStore(state => state.setSelectedObject);

    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>([]);
    const [visibleObjects, setVisibleObjects] = useState<RenderedObject[]>([]);
    const [visibleStars, setVisibleStars] = useState<RenderedStar[]>([]);
    const [visibleConstellations, setVisibleConstellations] = useState<RenderedConstellation[]>([]);
    const [visiblePlanets, setVisiblePlanets] = useState<RenderedPlanet[]>([]);
    const [timeOffset, setTimeOffset] = useState(0);

    const viewSettings = useSettingsStore(state => state.settings.view);
    const updateView = useSettingsStore(state => state.updateView);

    const [showStars, setShowStars] = useState(viewSettings.showStars);
    const [showObjects, setShowObjects] = useState(viewSettings.showObjects);
    const [showNames, setShowNames] = useState(viewSettings.showNames);
    const [showConstellations, setShowConstellations] = useState(viewSettings.showConstellations);
    const [mirrorView, setMirrorView] = useState(viewSettings.mirrorView);
    const [showPlanets, setShowPlanets] = useState(viewSettings.showPlanets);

    const [starMagnitude, setStarMagnitude] = useState(viewSettings.starMagnitude);

    useEffect(() => {
        setShowStars(viewSettings.showStars);
        setShowConstellations(viewSettings.showConstellations);
        setShowObjects(viewSettings.showObjects);
        setShowNames(viewSettings.showNames);
        setMirrorView(viewSettings.mirrorView);
        setStarMagnitude(viewSettings.starMagnitude);
    }, [viewSettings]);

    // Zoom state
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const svgContainerRef = useRef<View>(null);

    // ── ViewBox calculé pour le zoom ──────────────────────────────────────────
    const viewBox = useMemo(() => {
        const viewBoxSize = (skyViewSize / zoom) + 20; // +20 for small offset to avoid text cut
        const offsetX = (skyViewSize - viewBoxSize) / 2 + panX;
        const offsetY = (skyViewSize - viewBoxSize) / 2 + panY;
        return `${offsetX} ${offsetY} ${viewBoxSize} ${viewBoxSize}`;
    }, [zoom, panX, panY]);

    // ── Date/heure cible ──────────────────────────────────────────────────────
    const targetDate = useMemo(() => {
        const d = new Date();
        d.setTime(d.getTime() + timeOffset * 3600 * 1000);
        return d;
    }, [timeOffset]);

    useEffect(() => {
        setFilteredCatalog(filterCatalog(currentFilter, '', targetDate));
    }, [currentFilter, targetDate]);

    useEffect(() => {
        setTargetDate(targetDate);
    }, [targetDate, setTargetDate]);

    useEffect(() => {
        const tick = () => setTimeOffset(t => t + 0.0001);
        tick();
        // Toutes les 5 secondes suffit pour un planétarium
        const intervalId = setInterval(tick, 5000);
        return () => clearInterval(intervalId);
    }, []);

    // ── Wheel zoom (web) ──────────────────────────────────────────────────────
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            const container = svgContainerRef.current as unknown as HTMLElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Position de la souris dans le viewBox actuel
            const viewBoxSize = skyViewSize / zoom;
            const currentOffsetX = (skyViewSize - viewBoxSize) / 2 + panX;
            const currentOffsetY = (skyViewSize - viewBoxSize) / 2 + panY;

            const mouseViewBoxX = currentOffsetX + (mouseX / skyViewSize) * viewBoxSize;
            const mouseViewBoxY = currentOffsetY + (mouseY / skyViewSize) * viewBoxSize;

            // Nouveau zoom
            const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(1, Math.min(10, zoom * zoomDelta));

            // Nouveau viewBox size
            const newViewBoxSize = skyViewSize / newZoom;

            // Recalculer le pan pour garder la souris au même endroit
            const newOffsetX = mouseViewBoxX - (mouseX / skyViewSize) * newViewBoxSize;
            const newOffsetY = mouseViewBoxY - (mouseY / skyViewSize) * newViewBoxSize;

            const newPanX = newOffsetX - (skyViewSize - newViewBoxSize) / 2;
            const newPanY = newOffsetY - (skyViewSize - newViewBoxSize) / 2;

            setZoom(newZoom);
            setPanX(newPanX);
            setPanY(newPanY);
        };

        const container = svgContainerRef.current as unknown as HTMLElement;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [zoom, panX, panY]);

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

    // ── Étoiles filtrées par magnitude (mémoïsé) ────────────────────────────────
    const filteredStars = useMemo(() => {
        // Catalogue trié par magnitude → on peut s'arrêter dès qu'on dépasse la limite
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
                size: svg_magToSize(star.v_mag),
                opacity: svg_magToOpacity(star.v_mag),
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
                // Chaque line est un tableau de HIP connectés
                for (let i = 0; i < line.length - 1; i++) {
                    const star1 = starByHip.get(line[i]);
                    const star2 = starByHip.get(line[i + 1]);

                    if (!star1 || !star2) continue;

                    // Calculer Az/Alt pour chaque étoile
                    const pos1 = computeAzAlt({ ra_deg: star1.ra, dec_deg: star1.dec } as CelestialObject, targetDate);
                    const pos2 = computeAzAlt({ ra_deg: star2.ra, dec_deg: star2.dec } as CelestialObject, targetDate);

                    // Ne pas dessiner si les deux étoiles sont sous l'horizon
                    if (pos1.altitude < -5 && pos2.altitude < -5) continue;

                    // Projeter les positions
                    const proj1 = azimuthalEquidistantProject(pos1.azimuth, pos1.altitude, skyRadius, -5, mirrorView);
                    const proj2 = azimuthalEquidistantProject(pos2.azimuth, pos2.altitude, skyRadius, -5, mirrorView);

                    // Ne dessiner que si les deux étoiles sont visibles
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
    }, []);

    // ── Lignes et labels cardinaux ────────────────────────────────────────────
    const cardinalData = useMemo(() => {
        return CARDINALS.map(c => {
            const projected = azimuthalEquidistantProject(c.az, 0, skyRadius, -10, mirrorView);
            return {
                ...c,
                x2: projected.x + skyCenter,
                y2: projected.y + skyCenter,
                labelX: projected.x + skyCenter,
                labelY: projected.y + skyCenter,
            };
        });
    }, [mirrorView]);

    // ── Position de la monture projetée ───────────────────────────────────────
    const projectedMountPosition = useMemo(() => {
        if (!mountPosition) return null;
        const projected = azimuthalEquidistantProject(mountPosition.az, mountPosition.alt, skyRadius, -5, mirrorView);
        if (!projected.visible) return null;
        return {
            x: projected.x + skyCenter,
            y: projected.y + skyCenter,
        };
    }, [mountPosition, mirrorView]);

    // ── Objet sélectionné ─────────────────────────────────────────────────────
    const selectedPos = useMemo(() => {
        if (!selectedObject) return null;
        return visibleObjects.find(obj => obj.object.Name === selectedObject.Name);
    }, [selectedObject, visibleObjects]);

    // ── Champ de vision plate solve ───────────────────────────────────────────
    const plateSolveFov = useMemo(() => {
        if (!plateSolveCalibration || !cameraDimensions || !location.ready) return null;

        const corners = computeFovCorners(plateSolveCalibration, cameraDimensions);

        const projectedCorners = corners.map(corner => {
            const { azimuth, altitude } = computeAzAlt(
                { ra_deg: corner.ra, dec_deg: corner.dec } as CelestialObject,
                targetDate
            );
            const projected = azimuthalEquidistantProject(azimuth, altitude, skyRadius, -5, mirrorView);
            return {
                x: projected.x + skyCenter,
                y: projected.y + skyCenter,
                visible: projected.visible,
            };
        });

        if (projectedCorners.some(c => !c.visible)) return null;

        return projectedCorners.map(c => `${c.x},${c.y}`).join(' ');
    }, [plateSolveCalibration, cameraDimensions, location.ready, targetDate, mirrorView]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handlePointablePress = useCallback((pointable: PointableObject) => {
        if (slewMode) {
            setTargetPosition({ az: pointable.az, alt: pointable.alt, name: pointable.name });
        }
    }, [slewMode, setTargetPosition]);

    const handleObjectPress = useCallback((obj: RenderedObject) => {
        if (slewMode) {
            handlePointablePress(obj);
        } else {
            setSelectedObject(obj.object);
        }
    }, [slewMode, handlePointablePress, setSelectedObject]);

    const handlePlanetPress = useCallback((planet: RenderedPlanet) => {
        if (slewMode) {
            handlePointablePress(planet);
        }
    }, [slewMode, handlePointablePress]);

    const handleStarPress = useCallback((star: RenderedStar) => {
        if (slewMode) {
            handlePointablePress(star);
        }
    }, [slewMode, handlePointablePress]);

    const debouncedTime = useDebouncedCallback(
        (timeOffset) => {
            setTimeOffset(timeOffset);
        },
        100
    )

    const observationTime = (): string => {
        return `${targetDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })} - ${targetDate.getHours()}h${targetDate.getMinutes().toString().padStart(2, '0')}m${targetDate.getSeconds().toString().padStart(2, '0')}s`;
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

    const toogleShowPlanets = () => {
        const newValue = !showPlanets;
        setShowPlanets(newValue);
        updateView({ showPlanets: newValue });
    }

    // ── Rendu ─────────────────────────────────────────────────────────────────

    return (
        <SafeAreaProvider>
            <SafeAreaView style={globalStyles.appShell}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <Text style={textStyles.viewTitle}>Grille Azimutale</Text>
                        {/* <Text style={[textStyles.caption, styles.headerSubtitle]}>Zénith au centre · {mirrorView ? 'Est à gauche' : 'Est à droite'}</Text> */}
                    </View>
                    {zoom > 1 && (
                        <TouchableOpacity
                            onPress={() => { setZoom(1); setPanX(0); setPanY(0); }}
                            style={styles.headerButton}
                        >
                            <Text style={textStyles.accentBold}>{zoom.toFixed(1)}x</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Slew Mode Banner */}
                {slewMode && (
                    <View style={styles.slewModeBanner}>
                        <MaterialCommunityIcons name="target" size={18} color={GlobalColors.background} />
                        <Text style={textStyles.inverse}>Mode pointage actif — touchez un objet</Text>
                    </View>
                )}

                {/* Vue du ciel SVG */}
                <View style={globalStyles.skyViewport}>
                    <View
                        ref={svgContainerRef}
                        style={[styles.svgContainer, { borderRadius: skyRadius }]}
                    >
                        <Svg width={skyViewSize} height={skyViewSize} viewBox={viewBox}>
                            {/* Fond du ciel */}
                            <Circle
                                cx={skyCenter}
                                cy={skyCenter}
                                r={skyRadius}
                                fill={GlobalColors.skyDome}
                                stroke={GlobalColors.gridStrokeStrong}
                                strokeWidth={2}
                            />

                            {/* Cercles d'altitude */}
                            {gridCircles.map(({ alt, radius }) => (
                                <G key={`grid-${alt}`}>
                                    <Circle
                                        cx={skyCenter}
                                        cy={skyCenter}
                                        r={radius}
                                        fill="none"
                                        stroke={GlobalColors.gridStroke}
                                        strokeWidth={1}
                                        strokeDasharray="4,4"
                                    />
                                    {alt > 0 && (
                                        <SvgText
                                            x={skyCenter}
                                            y={skyCenter - radius - 2}
                                            fontSize={SvgTypography.gridLabel.fontSize}
                                            fill={GlobalColors.gridLabel}
                                            textAnchor="middle"
                                        >
                                            {alt}°
                                        </SvgText>
                                    )}
                                </G>
                            ))}

                            {/* Lignes et labels cardinaux */}
                            {cardinalData.filter(c => c.az % 45 === 0).map(c => (
                                <Line
                                    key={`line-${c.az}`}
                                    x1={skyCenter}
                                    y1={skyCenter}
                                    x2={c.x2}
                                    y2={c.y2}
                                    stroke={GlobalColors.gridStroke}
                                    strokeWidth={1}
                                />
                            ))}

                            {cardinalData.map(c => (
                                <SvgText
                                    key={`label-${c.az}`}
                                    x={c.labelX}
                                    y={c.labelY + 4}
                                    fontSize={c.az % 90 === 0 ? SvgTypography.cardinalMajor.fontSize : SvgTypography.cardinalMinor.fontSize}
                                    fontWeight={SvgTypography.cardinalMajor.fontWeight}
                                    fontFamily={SvgTypography.cardinalMajor.fontFamily}
                                    fill={c.az % 90 === 0 ? GlobalColors.cardinalPrimary : GlobalColors.cardinalSecondary}
                                    textAnchor="middle"
                                >
                                    {c.label}
                                </SvgText>
                            ))}

                            {/* Zénith */}
                            <Circle
                                cx={skyCenter}
                                cy={skyCenter}
                                r={3}
                                fill={GlobalColors.zenithDot}
                            />
                            <SvgText
                                x={skyCenter}
                                y={skyCenter + 14}
                                fontSize={SvgTypography.zenithLabel.fontSize}
                                fill={GlobalColors.zenithLabel}
                                textAnchor="middle"
                            >
                                Z
                            </SvgText>

                            {/* Lignes des constellations */}
                            {showConstellations && <ConstellationsLayer constellations={visibleConstellations} />}

                            {/* Étoiles */}
                            {showStars && <StarsLayer stars={visibleStars} showNames={showNames} onPress={slewMode ? handleStarPress : undefined} />}

                            {/* Objets célestes */}
                            {showObjects && (
                                <G>
                                    {visibleObjects.map((obj, i) => (
                                        <G
                                            key={`obj-${i}`}
                                            opacity={obj.alt < 0 ? 0.25 : 1}
                                            onPress={() => handleObjectPress(obj)}
                                        >
                                            <Circle
                                                cx={obj.x}
                                                cy={obj.y}
                                                r={9}
                                                fill={GlobalColors.objectLabelBg}
                                                stroke={obj.color}
                                                strokeWidth={1.5}
                                            />
                                            <Circle
                                                cx={obj.x}
                                                cy={obj.y}
                                                r={2.5}
                                                fill={obj.color}
                                            />
                                            {showNames && (
                                                <SvgText
                                                    x={obj.x}
                                                    y={obj.y + 18}
                                                    fontSize={SvgTypography.objectName.fontSize}
                                                    fontWeight={SvgTypography.objectName.fontWeight}
                                                    fontFamily={SvgTypography.objectName.fontFamily}
                                                    fill={obj.color}
                                                    textAnchor="middle"
                                                >
                                                    {obj.object.Common_names || obj.object.M || obj.object.Name}
                                                </SvgText>
                                            )}
                                        </G>
                                    ))}
                                </G>
                            )}

                            {/* Planètes */}
                            {showPlanets && <PlanetsLayer planets={visiblePlanets} showNames={showNames} onPress={slewMode ? handlePlanetPress : undefined} />}
                            {/* Plate Solve FOV Rectangle */}
                            {plateSolveFov && (
                                <Polygon
                                    points={plateSolveFov}
                                    //fill={GlobalColors.fovFill}
                                    stroke={GlobalColors.fovStroke}
                                    strokeWidth={1}
                                />
                            )}

                            {/* Mount Position Marker */}
                            {projectedMountPosition && (
                                <G>
                                    <Circle
                                        cx={projectedMountPosition.x}
                                        cy={projectedMountPosition.y}
                                        r={14}
                                        fill="none"
                                        stroke={GlobalColors.mountMarker}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={projectedMountPosition.x - 20}
                                        y1={projectedMountPosition.y}
                                        x2={projectedMountPosition.x - 8}
                                        y2={projectedMountPosition.y}
                                        stroke={GlobalColors.mountMarker}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={projectedMountPosition.x + 8}
                                        y1={projectedMountPosition.y}
                                        x2={projectedMountPosition.x + 20}
                                        y2={projectedMountPosition.y}
                                        stroke={GlobalColors.mountMarker}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={projectedMountPosition.x}
                                        y1={projectedMountPosition.y - 20}
                                        x2={projectedMountPosition.x}
                                        y2={projectedMountPosition.y - 8}
                                        stroke={GlobalColors.mountMarker}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={projectedMountPosition.x}
                                        y1={projectedMountPosition.y + 8}
                                        x2={projectedMountPosition.x}
                                        y2={projectedMountPosition.y + 20}
                                        stroke={GlobalColors.mountMarker}
                                        strokeWidth={2}
                                    />
                                </G>
                            )}

                            {/* Selected Object Marker */}
                            {selectedPos && (
                                <G>
                                    <Circle
                                        cx={selectedPos.x}
                                        cy={selectedPos.y}
                                        r={18}
                                        fill="none"
                                        stroke={GlobalColors.cardinalPrimary}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={selectedPos.x - 25}
                                        y1={selectedPos.y}
                                        x2={selectedPos.x - 12}
                                        y2={selectedPos.y}
                                        stroke={GlobalColors.cardinalPrimary}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={selectedPos.x + 12}
                                        y1={selectedPos.y}
                                        x2={selectedPos.x + 25}
                                        y2={selectedPos.y}
                                        stroke={GlobalColors.cardinalPrimary}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={selectedPos.x}
                                        y1={selectedPos.y - 25}
                                        x2={selectedPos.x}
                                        y2={selectedPos.y - 12}
                                        stroke={GlobalColors.cardinalPrimary}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={selectedPos.x}
                                        y1={selectedPos.y + 12}
                                        x2={selectedPos.x}
                                        y2={selectedPos.y + 25}
                                        stroke={GlobalColors.cardinalPrimary}
                                        strokeWidth={2}
                                    />
                                </G>
                            )}
                        </Svg>
                    </View>
                </View>

                {/* Footer */}
                <View style={[styles.footer, isMobilePortrait && styles.footerMobile]}>
                    {/* Details section - collapsible on mobile */}
                    {(!isMobilePortrait || footerExpanded) && (
                        <>
                            <View style={[styles.footerElement, isMobilePortrait && styles.footerElementMobile]}>
                                <View style={styles.footerRow}>
                                    <Text style={textStyles.sectionLabel}>Position</Text>
                                    <Text style={textStyles.meta}>
                                        {location.latitude.toFixed(2)}° · {location.longitude.toFixed(2)}° · {location.altitude.toFixed(0)} m
                                    </Text>
                                </View>
                                <View style={styles.footerRow}>
                                    <Text style={textStyles.sectionLabel}>Heure</Text>
                                    <Text style={textStyles.valueEmphasis}>{observationTime()}</Text>
                                </View>
                                <Slider
                                    containerStyle={styles.footerSlider}
                                    minimumValue={0}
                                    maximumValue={24}
                                    step={0.25}
                                    value={timeOffset}
                                    onValueChange={(val) => debouncedTime(val[0])}
                                    minimumTrackTintColor={GlobalColors.primary}
                                    maximumTrackTintColor={GlobalColors.sliderTrack}
                                    thumbTintColor={GlobalColors.accent}
                                />
                            </View>
                            <View style={[styles.footerElementMagnitude, isMobilePortrait && styles.footerElementMobile]}>
                                <Text style={textStyles.sectionLabel}>Étoiles · Magnitude limite · {starMagnitude.toFixed(1)}</Text>
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
                    {/* Toggles toolbar - always visible */}
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
                                onPress={toogleShowPlanets}
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
        gap: Spacing.md,
    },
    headerInfo: {
        flex: 1,
    },
    headerSubtitle: {
        marginTop: 2,
        color: GlobalColors.textMuted,
    },
    headerButton: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.sm,
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
    svgContainer: {
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
        minWidth: 250,
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
    footerElementMagnitude: {
        justifyContent: 'center',
        minWidth: 140,
        gap: Spacing.xs,
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
