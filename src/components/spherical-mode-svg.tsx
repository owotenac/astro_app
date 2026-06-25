/**
 * Planétarium sphérique en SVG
 *
 * Utilise react-native-svg pour le rendu.
 */

import typesMapping from '@/assets/data/celestialtype.json';
import { GlobalColors, globalStyles } from '@/global/theme';
import { useFilterStore } from '@/hooks/useFilterStore';
import { useLocation } from '@/hooks/useLocation';
import { useMountStore } from '@/hooks/useMountStore';
import { useObservationStore } from '@/hooks/useObservationStore';
import { CelestialObject } from '@/model/celestialobject';
import { ConstellationObject } from '@/model/constellations';
import { StarObject } from '@/model/stars';
import { computeAzAlt } from '@/utils/compute';
import { filterCatalog } from '@/utils/filter';
import { azimuthalEquidistantProject } from '@/utils/projection';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
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

interface RenderedObject {
    object: CelestialObject;
    color: string;
    x: number;
    y: number;
    alt: number;
    az: number;
}

interface RenderedStar {
    x: number;
    y: number;
    size: number;
    opacity: number;
    name: string | null;
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

const starCatalog: StarObject[] = starJson as StarObject[];
const constellationCatalog: ConstellationObject[] = constellationJson as ConstellationObject[];

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

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SvgSphericalPlanetarium() {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const skyViewSize = Math.max(100, Math.min(screenWidth - 16, screenHeight - 220));
    const skyRadius = skyViewSize / 2;
    const skyCenter = skyRadius;

    const currentFilter = useFilterStore(state => state.currentFilter);
    const location = useLocation();
    const setTargetDate = useObservationStore(state => state.setTargetDate);
    const mountPosition = useMountStore(state => state.mountPosition);
    const slewMode = useMountStore(state => state.slewMode);
    const setTargetPosition = useMountStore(state => state.setTargetPosition);
    const selectedObject = useMountStore(state => state.selectedObject);
    const setSelectedObject = useMountStore(state => state.setSelectedObject);

    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>([]);
    const [visibleObjects, setVisibleObjects] = useState<RenderedObject[]>([]);
    const [visibleStars, setVisibleStars] = useState<RenderedStar[]>([]);
    const [visibleConstellations, setVisibleConstellations] = useState<RenderedConstellation[]>([]);
    const [timeOffset, setTimeOffset] = useState(0);

    const [showStars, setShowStars] = useState(true);
    const [showObjects, setShowObjects] = useState(true);
    const [showNames, setShowNames] = useState(true);
    const [showConstellations, setShowConstellations] = useState(true);
    const [mirrorView, setMirrorView] = useState(true);

    const [starMagnitude, setStarMagnitude] = useState(2.5);

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
        const intervalId = setInterval(tick, 1000);
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
        if (!location.ready) return;

        const nextObjects: RenderedObject[] = [];

        for (const obj of filteredCatalog) {
            if (!obj.ra_deg || !obj.dec_deg) continue;

            const { azimuth, altitude } = computeAzAlt(obj, targetDate);
            const projected = azimuthalEquidistantProject(azimuth, altitude, skyRadius, -5, mirrorView);

            if (!projected.visible) continue;

            const typeInfo = typesMapping[obj.Type as keyof typeof typesMapping]
                ?? { label: obj.Type, color: '#9E9E9E' };

            nextObjects.push({
                object: obj,
                color: typeInfo.color,
                x: projected.x + skyCenter,
                y: projected.y + skyCenter,
                alt: altitude,
                az: azimuth,
            });
        }

        setVisibleObjects(nextObjects);
    }, [location.ready, filteredCatalog, targetDate, mirrorView]);

    // ── Projection des étoiles ────────────────────────────────────────────────
    useEffect(() => {
        if (!location.ready) return;

        const nextStars: RenderedStar[] = [];

        for (const star of starCatalog) {
            const starAsObj = { ra_deg: star.ra, dec_deg: star.dec } as CelestialObject;
            const { azimuth, altitude } = computeAzAlt(starAsObj, targetDate);
            if (altitude < -5) continue;
            if (star.v_mag > starMagnitude) continue;

            const projected = azimuthalEquidistantProject(azimuth, altitude, skyRadius, -5, mirrorView);
            if (!projected.visible) continue;

            nextStars.push({
                x: projected.x + skyCenter,
                y: projected.y + skyCenter,
                size: svg_magToSize(star.v_mag),
                opacity: svg_magToOpacity(star.v_mag),
                name: star.v_mag <= 2.5 ? star.common_name : null,
            });
        }

        setVisibleStars(nextStars);
    }, [location.ready, targetDate, starMagnitude, mirrorView]);

    // ── Projection des constellations ────────────────────────────────────────
    useEffect(() => {
        if (!location.ready) return;

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
    }, [location.ready, targetDate, mirrorView]);

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

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleObjectPress = useCallback((obj: RenderedObject) => {
        if (slewMode) {
            const name = obj.object.Common_names || obj.object.M || obj.object.Name;
            setTargetPosition({ az: obj.az, alt: obj.alt, name });
        } else {
            setSelectedObject(obj.object);
        }
    }, [slewMode, setTargetPosition, setSelectedObject]);

    const observationTime = (): string => {
        return `${targetDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })} - ${targetDate.getHours()}h${targetDate.getMinutes().toString().padStart(2, '0')}m${targetDate.getSeconds().toString().padStart(2, '0')}s`;
    };

    const toggleShowStars = () => {
        setShowStars(!showStars);
    };

    const toggleShowObjects = () => {
        setShowObjects(!showObjects);
    };

    const toggleShowNames = () => {
        setShowNames(!showNames);
    };

    const toggleShowConstellations = () => {
        setShowConstellations(!showConstellations);
    };

    const toggleMirrorView = () => {
        setMirrorView(!mirrorView);
    };

    // ── Rendu ─────────────────────────────────────────────────────────────────

    return (
        <SafeAreaProvider>
            <SafeAreaView style={[globalStyles.container, { padding: 0, paddingTop: 0 }]}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Grille Azimutale</Text>
                        <Text style={styles.headerSubtitle}>Zénith au centre · {mirrorView ? 'Est à gauche' : 'Est à droite'}</Text>
                    </View>
                    {zoom > 1 && (
                        <TouchableOpacity
                            onPress={() => { setZoom(1); setPanX(0); setPanY(0); }}
                            style={styles.headerButton}
                        >
                            <Text style={styles.zoomIndicator}>{zoom.toFixed(1)}x</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Slew Mode Banner */}
                {slewMode && (
                    <View style={styles.slewModeBanner}>
                        <MaterialCommunityIcons name="target" size={18} color={GlobalColors.background} />
                        <Text style={styles.slewModeBannerText}>Mode pointage actif — touchez un objet</Text>
                    </View>
                )}

                {/* Vue du ciel SVG */}
                <View style={styles.skyContainer}>
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
                                fill="#080812"
                                stroke="rgba(100, 120, 140, 0.5)"
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
                                        stroke="rgba(100, 120, 140, 0.25)"
                                        strokeWidth={1}
                                        strokeDasharray="4,4"
                                    />
                                    {alt > 0 && (
                                        <SvgText
                                            x={skyCenter}
                                            y={skyCenter - radius - 2}
                                            fontSize={10}
                                            fill="rgba(150, 160, 170, 0.6)"
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
                                    stroke="rgba(100, 120, 140, 0.25)"
                                    strokeWidth={1}
                                />
                            ))}

                            {cardinalData.map(c => (
                                <SvgText
                                    key={`label-${c.az}`}
                                    x={c.labelX}
                                    y={c.labelY + 4}
                                    fontSize={c.az % 90 === 0 ? 16 : 12}
                                    fontWeight="bold"
                                    fontFamily='astro_font_regular'
                                    fill={c.az % 90 === 0 ? 'rgba(255, 200, 100, 0.9)' : 'rgba(200, 180, 140, 0.6)'}
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
                                fill="rgba(255, 255, 255, 0.5)"
                            />
                            <SvgText
                                x={skyCenter}
                                y={skyCenter + 14}
                                fontSize={10}
                                fill="rgba(255, 255, 255, 0.5)"
                                textAnchor="middle"
                            >
                                Z
                            </SvgText>

                            {/* Lignes des constellations */}
                            {showConstellations && (
                                <G>
                                    {visibleConstellations.map(constellation => (
                                        <G key={`const-${constellation.id}`}>
                                            {constellation.segments.map((seg, i) => (
                                                <Line
                                                    key={`${constellation.id}-seg-${i}`}
                                                    x1={seg.x1}
                                                    y1={seg.y1}
                                                    x2={seg.x2}
                                                    y2={seg.y2}
                                                    stroke="rgba(100, 149, 237, 0.4)"
                                                    strokeWidth={1}
                                                />
                                            ))}
                                        </G>
                                    ))}
                                </G>
                            )}

                            {/* Étoiles */}
                            {showStars && (
                                <G>
                                    {visibleStars.map((star, i) => (
                                        <G key={`star-${i}`}>
                                            <Circle
                                                cx={star.x}
                                                cy={star.y}
                                                r={star.size / 2}
                                                fill={`rgba(255, 255, 255, ${star.opacity})`}
                                            />
                                            {star.name && showNames && (
                                                <SvgText
                                                    x={star.x}
                                                    y={star.y - 12}
                                                    fontSize={10}
                                                    fontWeight="bold"
                                                    fontFamily='astro_font_regular'
                                                    fill="rgba(255, 255, 255, 0.9)"
                                                    textAnchor="middle"
                                                >
                                                    {star.name}
                                                </SvgText>
                                            )}
                                        </G>
                                    ))}
                                </G>
                            )}

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
                                                fill="rgba(0,0,0,0.4)"
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
                                                    fontSize={9}
                                                    fontWeight="600"
                                                    fontFamily='astro_font_regular'
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

                            {/* Mount Position Marker */}
                            {projectedMountPosition && (
                                <G>
                                    <Circle
                                        cx={projectedMountPosition.x}
                                        cy={projectedMountPosition.y}
                                        r={14}
                                        fill="none"
                                        stroke="#ff6b6b"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={projectedMountPosition.x - 20}
                                        y1={projectedMountPosition.y}
                                        x2={projectedMountPosition.x - 8}
                                        y2={projectedMountPosition.y}
                                        stroke="#ff6b6b"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={projectedMountPosition.x + 8}
                                        y1={projectedMountPosition.y}
                                        x2={projectedMountPosition.x + 20}
                                        y2={projectedMountPosition.y}
                                        stroke="#ff6b6b"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={projectedMountPosition.x}
                                        y1={projectedMountPosition.y - 20}
                                        x2={projectedMountPosition.x}
                                        y2={projectedMountPosition.y - 8}
                                        stroke="#ff6b6b"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={projectedMountPosition.x}
                                        y1={projectedMountPosition.y + 8}
                                        x2={projectedMountPosition.x}
                                        y2={projectedMountPosition.y + 20}
                                        stroke="#ff6b6b"
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
                                        stroke={GlobalColors.accent}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={selectedPos.x - 25}
                                        y1={selectedPos.y}
                                        x2={selectedPos.x - 12}
                                        y2={selectedPos.y}
                                        stroke={GlobalColors.accent}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={selectedPos.x + 12}
                                        y1={selectedPos.y}
                                        x2={selectedPos.x + 25}
                                        y2={selectedPos.y}
                                        stroke={GlobalColors.accent}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={selectedPos.x}
                                        y1={selectedPos.y - 25}
                                        x2={selectedPos.x}
                                        y2={selectedPos.y - 12}
                                        stroke={GlobalColors.accent}
                                        strokeWidth={2}
                                    />
                                    <Line
                                        x1={selectedPos.x}
                                        y1={selectedPos.y + 12}
                                        x2={selectedPos.x}
                                        y2={selectedPos.y + 25}
                                        stroke={GlobalColors.accent}
                                        strokeWidth={2}
                                    />
                                </G>
                            )}
                        </Svg>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerElement}>
                        <View style={styles.footerRow}>
                            <Text style={styles.footerLabel}>Location:</Text>
                            <Text style={styles.footerLabel}>{location.latitude.toFixed(2)}° - {location.longitude.toFixed(2)}° - {location.altitude.toFixed(0)} m</Text>
                        </View>
                        <View style={styles.footerRow}>
                            <Text style={styles.footerLabel}>Heure d'observation</Text>
                            <Text style={styles.footerValue}>{observationTime()}</Text>
                        </View>
                        <Slider
                            minimumValue={0}
                            maximumValue={24}
                            step={0.25}
                            value={timeOffset}
                            onValueChange={(val) => setTimeOffset(val[0])}
                            minimumTrackTintColor={GlobalColors.accent}
                            maximumTrackTintColor="#1f2833"
                            thumbTintColor={GlobalColors.accent}
                        />
                    </View>
                    <View style={styles.footerElement}>
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                            <TouchableOpacity onPress={toggleShowStars}>
                                <MaterialCommunityIcons name="star" size={40} color={showStars ? GlobalColors.accent : "#494949ff"} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleShowConstellations}>
                                <MaterialCommunityIcons name="vector-polyline" size={40} color={showConstellations ? GlobalColors.accent : "#494949ff"} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleShowObjects}>
                                <MaterialCommunityIcons name="brightness-4" size={40} color={showObjects ? GlobalColors.accent : "#494949ff"} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleShowNames}>
                                <MaterialCommunityIcons name="alphabetical" size={40} color={showNames ? GlobalColors.accent : "#494949ff"} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleMirrorView}>
                                <MaterialCommunityIcons name="flip-horizontal" size={40} color={GlobalColors.accent} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.footerElement}>
                        <View style={{ minWidth: 100 }}>
                            <Text style={styles.footerLabel}>Star Magnitude: {starMagnitude.toFixed(1)}</Text>
                            <Slider
                                minimumValue={0}
                                maximumValue={7}
                                step={0.1}
                                value={starMagnitude}
                                onValueChange={(val) => setStarMagnitude(val[0])}
                                minimumTrackTintColor={GlobalColors.accent}
                                maximumTrackTintColor="#1f2833"
                                thumbTintColor={GlobalColors.accent}
                            />
                        </View>
                        <View>

                        </View>
                    </View>

                </View>

            </SafeAreaView>
        </SafeAreaProvider>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        backgroundColor: 'rgba(11, 12, 16, 0.95)',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: '#1f2833',
        gap: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        color: GlobalColors.foreground,
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    headerButton: {
        padding: 4,
    },
    zoomIndicator: {
        color: GlobalColors.accent,
        fontSize: 14,
        fontWeight: 'bold',
    },
    slewModeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: GlobalColors.accent,
    },
    slewModeBannerText: {
        color: GlobalColors.background,
        fontSize: 14,
        fontWeight: '600',
    },
    skyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#020205',
    },
    svgContainer: {
        overflow: 'hidden',
    },
    footer: {
        padding: 16,
        backgroundColor: 'rgba(11,12,16,0.95)',
        borderTopWidth: 1,
        borderColor: '#1f2833',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 30,
    },
    footerElement: {
        borderRightWidth: 1,
        borderColor: '#1f2833',
        paddingRight: 20,
        height: "100%",
        justifyContent: 'center'
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 10,
    },
    footerLabel: {
        color: '#c5c6c7',
        fontSize: 12,
    },
    footerValue: {
        color: GlobalColors.accent,
        fontSize: 13,
        fontWeight: 'bold',
    },
});
