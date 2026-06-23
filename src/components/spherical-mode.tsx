import typesMapping from '@/assets/data/celestialtype.json';
import { GlobalColors, globalStyles } from '@/global/theme';
import { useFilterStore } from '@/hooks/useFilterStore';
import { useLocation } from '@/hooks/useLocation';
import { CelestialObject } from '@/model/celestialobject';
import { computeAzAlt } from '@/utils/compute';
import { filterCatalog } from '@/utils/filter';
import {
    azimuthalEquidistantProject,
    computeLST,
    equatorialPolarProject,
    type ProjectedPoint,
} from '@/utils/projection';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// 
import { StarObject } from '@/model/stars';
import starJson from '../../assets/data/stars.json';

// ─── Constantes ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SKY_VIEW_SIZE = Math.min(SCREEN_WIDTH - 16, SCREEN_HEIGHT - 220);
const SKY_RADIUS = SKY_VIEW_SIZE / 2;

type GridMode = 'azimuthal' | 'equatorial';

// Points cardinaux (azimuts) - pour grille azimutale
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

// Heures RA (pour grille équatoriale)
const RA_HOURS = [0, 3, 6, 9, 12, 15, 18, 21]; // toutes les 3h

// Cercles d'altitude (grille azimutale)
const ALTITUDE_CIRCLES = [75, 60, 45, 30, 15, 0];

// Cercles de déclinaison (grille équatoriale)
const DEC_CIRCLES = [75, 60, 45, 30, 15, 0];

// ─── Types ────────────────────────────────────────────────────────────────────

interface RenderedObject {
    object: CelestialObject;
    color: string;
    x: number;
    y: number;
    scale: number;
    alt: number;
    az: number;
    ra: number;
    dec: number;
}

interface RenderedStar {
    star: StarObject;
    x: number;
    y: number;
    size: number;
    opacity: number;
}

const starCatalog: StarObject[] = starJson as StarObject[];

const magToSize = (mag: number): number => {
    // Magnitude -1 → 4px, magnitude 5 → 1px
    return Math.max(1, 4 - mag * 0.5);
};

const magToOpacity = (mag: number): number => {
    // Étoiles brillantes plus opaques
    return Math.max(0.3, Math.min(1, 1.2 - mag * 0.15));
};

// ─── Types props ──────────────────────────────────────────────────────────────

interface SphericalPlanetariumProps {
    onSelectObject?: (object: CelestialObject) => void;
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function SphericalPlanetariumScreen({ onSelectObject }: SphericalPlanetariumProps) {
    const currentFilter = useFilterStore(state => state.currentFilter);
    const location = useLocation();

    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>([]);
    const [visibleObjects, setVisibleObjects] = useState<RenderedObject[]>([]);
    const [visibleStars, setVisibleStars] = useState<RenderedStar[]>([]);
    const [timeOffset, setTimeOffset] = useState(0);
    const [gridMode, setGridMode] = useState<GridMode>('azimuthal');

    // ── Catalogue filtré ──────────────────────────────────────────────────────
    useEffect(() => {
        setFilteredCatalog(filterCatalog(currentFilter));
    }, [currentFilter]);

    // ── Date/heure cible ──────────────────────────────────────────────────────
    const targetDate = useMemo(() => {
        const d = new Date();
        d.setTime(d.getTime() + timeOffset * 3600 * 1000);
        return d;
    }, [timeOffset]);

    // ── Temps sidéral local (pour grille équatoriale) ─────────────────────────
    const lst = useMemo(() => {
        if (!location.ready) return 0;
        return computeLST(targetDate, location.longitude);
    }, [targetDate, location.ready, location.longitude]);

    // ── Moteur de projection ──────────────────────────────────────────────────
    useEffect(() => {
        if (!location.ready) return;

        const nextObjects: RenderedObject[] = [];

        for (const obj of filteredCatalog) {
            if (!obj.ra_deg || !obj.dec_deg) continue;

            const { azimuth, altitude } = computeAzAlt(obj, targetDate);

            let projected: ProjectedPoint;

            if (gridMode === 'azimuthal') {
                projected = azimuthalEquidistantProject(azimuth, altitude, SKY_RADIUS, -5);
            } else {
                projected = equatorialPolarProject(obj.ra_deg, obj.dec_deg, SKY_RADIUS, -10, lst);
            }

            if (!projected.visible) continue;

            const typeInfo = typesMapping[obj.Type as keyof typeof typesMapping]
                ?? { label: obj.Type, color: '#9E9E9E' };

            nextObjects.push({
                object: obj,
                color: typeInfo.color,
                x: projected.x + SKY_RADIUS,
                y: projected.y + SKY_RADIUS,
                scale: projected.scale,
                alt: altitude,
                az: azimuth,
                ra: obj.ra_deg,
                dec: obj.dec_deg,
            });
        }

        setVisibleObjects(nextObjects);
    }, [location.ready, filteredCatalog, targetDate, gridMode, lst]);

    // ── Projection des étoiles ────────────────────────────────────────────────
    useEffect(() => {
        if (!location.ready) return;

        const nextStars: RenderedStar[] = [];

        for (const star of starCatalog) {
            let projected: ProjectedPoint;

            if (gridMode === 'azimuthal') {
                // Pour le mode azimutal, on doit calculer az/alt
                const starAsObj = { ra_deg: star.ra, dec_deg: star.dec } as CelestialObject;
                const { azimuth, altitude } = computeAzAlt(starAsObj, targetDate);
                if (altitude < -5) continue;
                projected = azimuthalEquidistantProject(azimuth, altitude, SKY_RADIUS, -5);
            } else {
                projected = equatorialPolarProject(star.ra, star.dec, SKY_RADIUS, -10, lst);
            }

            if (!projected.visible) continue;

            if (star.v_mag > 2.5) 
                star.common_name = null; // N'affiche les noms que pour les étoiles brillantes

            nextStars.push({
                star,
                x: projected.x + SKY_RADIUS,
                y: projected.y + SKY_RADIUS,
                size: magToSize(star.v_mag),
                opacity: magToOpacity(star.v_mag),
            });
        }

        setVisibleStars(nextStars);
    }, [location.ready, targetDate, gridMode, lst]);

    // ── Grille azimutale ──────────────────────────────────────────────────────

    const projectedCardinals = useMemo(() => {
        return CARDINALS.map(c => {
            const projected = azimuthalEquidistantProject(c.az, 0, SKY_RADIUS);
            return { ...c, x: projected.x + SKY_RADIUS, y: projected.y + SKY_RADIUS };
        });
    }, []);

    const altitudeCircles = useMemo(() => {
        return ALTITUDE_CIRCLES.map(alt => {
            const zenithDist = 90 - alt;
            const r = (zenithDist / 90) * SKY_RADIUS;
            return { alt, radius: r };
        });
    }, []);

    // ── Grille équatoriale ────────────────────────────────────────────────────

    const projectedRAHours = useMemo(() => {
        return RA_HOURS.map(h => {
            const raDeg = h * 15; // 1h = 15°
            const projected = equatorialPolarProject(raDeg, 0, SKY_RADIUS, -10, lst);
            return { h, x: projected.x + SKY_RADIUS, y: projected.y + SKY_RADIUS };
        });
    }, [lst]);

    const decCircles = useMemo(() => {
        return DEC_CIRCLES.map(dec => {
            const polarDist = 90 - dec;
            const r = (polarDist / 90) * SKY_RADIUS;
            return { dec, radius: r };
        });
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const observationTime = (): string => {
        return `${targetDate.getHours()}h${targetDate.getMinutes().toString().padStart(2, '0')}`;
    };

    const lstDisplay = (): string => {
        const hours = Math.floor(lst / 15);
        const minutes = Math.floor((lst / 15 - hours) * 60);
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
    };

    const toggleGridMode = () => {
        setGridMode(prev => prev === 'azimuthal' ? 'equatorial' : 'azimuthal');
    };

    // 
    const starDetails = (star: StarObject) => {
        console.log('Star details:', star);

    };

    // ── Rendu ─────────────────────────────────────────────────────────────────

    return (
        <SafeAreaProvider>
            <SafeAreaView style={[globalStyles.container, { padding: 0, paddingTop: 0 }]}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>
                            {gridMode === 'azimuthal' ? 'Grille Azimutale' : 'Grille Équatoriale'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {gridMode === 'azimuthal'
                                ? 'Zénith au centre · Nord en haut'
                                : `Pôle Nord Céleste · LST ${lstDisplay()}`}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={toggleGridMode} style={styles.headerButton}>
                        <MaterialCommunityIcons
                            name={gridMode === 'azimuthal' ? 'compass' : 'star-circle'}
                            size={26}
                            color={GlobalColors.accent}
                        />
                    </TouchableOpacity>
                </View>

                {/* Vue du ciel */}
                <View style={styles.skyContainer}>
                    <View style={[styles.skyView, { width: SKY_VIEW_SIZE, height: SKY_VIEW_SIZE }]}>

                        {/* Fond */}
                        <View style={[styles.skyBackground, { borderRadius: SKY_RADIUS }]} />

                        {/* ═══ GRILLE AZIMUTALE ═══ */}
                        {gridMode === 'azimuthal' && (
                            <>
                                {/* Cercles d'altitude */}
                                {altitudeCircles.map(({ alt, radius }) => (
                                    <View
                                        key={alt}
                                        style={[styles.gridCircle, {
                                            width: radius * 2,
                                            height: radius * 2,
                                            left: SKY_RADIUS - radius,
                                            top: SKY_RADIUS - radius,
                                            borderRadius: radius,
                                        }]}
                                    >
                                        {alt > 0 && (
                                            <Text style={[styles.gridLabel, { top: -14 }]}>{alt}°</Text>
                                        )}
                                    </View>
                                ))}

                                {/* Lignes azimutales */}
                                {CARDINALS.filter(c => c.az % 90 === 0).map(c => {
                                    const rotation = c.az - 90;
                                    return (
                                        <View
                                            key={c.az}
                                            style={[styles.gridLine, {
                                                width: SKY_RADIUS,
                                                left: SKY_RADIUS,
                                                top: SKY_RADIUS - 0.5,
                                                transform: [{ rotate: `${rotation}deg` }],
                                                transformOrigin: 'left center',
                                            }]}
                                        />
                                    );
                                })}

                                {/* Points cardinaux */}
                                {projectedCardinals.map(c => (
                                    <Text
                                        key={c.az}
                                        style={[
                                            styles.gridMarker,
                                            c.az % 90 === 0 ? styles.gridMarkerMain : styles.gridMarkerSecondary,
                                            { left: c.x - 12, top: c.y - 10 }
                                        ]}
                                    >
                                        {c.label}
                                    </Text>
                                ))}

                                {/* Zénith */}
                                <View style={styles.centerMarker}>
                                    <View style={styles.centerDot} />
                                    <Text style={styles.centerLabel}>Z</Text>
                                </View>
                            </>
                        )}

                        {/* ═══ GRILLE ÉQUATORIALE ═══ */}
                        {gridMode === 'equatorial' && (
                            <>
                                {/* Cercles de déclinaison */}
                                {decCircles.map(({ dec, radius }) => (
                                    <View
                                        key={dec}
                                        style={[styles.gridCircle, styles.gridCircleEquatorial, {
                                            width: radius * 2,
                                            height: radius * 2,
                                            left: SKY_RADIUS - radius,
                                            top: SKY_RADIUS - radius,
                                            borderRadius: radius,
                                        }]}
                                    >
                                        {dec > 0 && (
                                            <Text style={[styles.gridLabel, styles.gridLabelEquatorial, { top: -14 }]}>
                                                {dec}°
                                            </Text>
                                        )}
                                    </View>
                                ))}

                                {/* Lignes RA (toutes les 3h) */}
                                {RA_HOURS.map(h => {
                                    const raDeg = h * 15;
                                    const hourAngle = raDeg - lst;
                                    const rotation = -hourAngle - 90;
                                    return (
                                        <View
                                            key={h}
                                            style={[styles.gridLine, styles.gridLineEquatorial, {
                                                width: SKY_RADIUS,
                                                left: SKY_RADIUS,
                                                top: SKY_RADIUS - 0.5,
                                                transform: [{ rotate: `${rotation}deg` }],
                                                transformOrigin: 'left center',
                                            }]}
                                        />
                                    );
                                })}

                                {/* Labels RA */}
                                {projectedRAHours.map(({ h, x, y }) => (
                                    <Text
                                        key={h}
                                        style={[
                                            styles.gridMarker,
                                            h % 6 === 0 ? styles.gridMarkerMainEq : styles.gridMarkerSecondaryEq,
                                            { left: x - 12, top: y - 10 }
                                        ]}
                                    >
                                        {h}h
                                    </Text>
                                ))}

                                {/* Pôle Nord Céleste */}
                                <View style={styles.centerMarker}>
                                    <View style={[styles.centerDot, styles.centerDotEquatorial]} />
                                    <Text style={[styles.centerLabel, styles.centerLabelEquatorial]}>PNC</Text>
                                </View>
                            </>
                        )}

                        {/* Étoiles (fond) */}
                        {visibleStars.map((s, i) => (
                            <TouchableOpacity onPress={() => starDetails(s.star)} key={`star-${i}`} disabled={s.star.common_name === null}>
                                {/* Point de l'étoile */}
                                <View
                                    style={[styles.starDot, {
                                        left: s.x - s.size / 2,
                                        top: s.y - s.size / 2,
                                        width: s.size,
                                        height: s.size,
                                        borderRadius: s.size / 2,
                                        opacity: s.opacity,
                                    }]}
                                />
                                {/* Nom de l'étoile */}
                                {s.star.common_name && (
                                    <Text
                                        style={[styles.starName, {
                                            left: s.x,
                                            top: s.y + s.size / 2 + 2,
                                        }]}
                                    >
                                        {s.star.common_name}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* Objets célestes */}
                        {visibleObjects.map((obj, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.objectMarker, {
                                    left: obj.x - 16,
                                    top: obj.y - 16,
                                    opacity: obj.alt < 0 ? 0.25 : 1,
                                }]}
                                onPress={() => {
                                    if (onSelectObject) {
                                        onSelectObject(obj.object);
                                    } 
                                }}
                            >
                                <View style={[styles.objectDot, { borderColor: obj.color }]}>
                                    <View style={[styles.objectDotInner, { backgroundColor: obj.color }]} />
                                </View>
                                <Text style={[styles.objectName, { color: obj.color }]}>
                                    {obj.object.Common_names || obj.object.M || obj.object.Name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
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
                    <View style={styles.legendRow}>
                        <Text style={styles.legendText}>
                            {visibleStars.length} étoiles · {visibleObjects.length} objets
                        </Text>
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
    skyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#020205',
    },
    skyView: {
        position: 'relative',
    },
    skyBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: '#080812',
        borderWidth: 2,
        borderColor: 'rgba(100, 120, 140, 0.5)',
    },

    // Grille commune
    gridCircle: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'rgba(100, 120, 140, 0.25)',
        borderStyle: 'dashed',
    },
    gridCircleEquatorial: {
        borderColor: 'rgba(100, 140, 200, 0.3)',
    },
    gridLabel: {
        position: 'absolute',
        alignSelf: 'center',
        color: 'rgba(150, 160, 170, 0.6)',
        fontSize: 10,
    },
    gridLabelEquatorial: {
        color: 'rgba(100, 150, 220, 0.7)',
    },
    gridLine: {
        position: 'absolute',
        height: 1,
        backgroundColor: 'rgba(100, 120, 140, 0.15)',
    },
    gridLineEquatorial: {
        backgroundColor: 'rgba(100, 140, 200, 0.2)',
    },
    gridMarker: {
        position: 'absolute',
        textAlign: 'center',
        width: 24,
        fontWeight: 'bold',
    },
    gridMarkerMain: {
        color: 'rgba(255, 200, 100, 0.9)',
        fontSize: 16,
    },
    gridMarkerSecondary: {
        color: 'rgba(200, 180, 140, 0.6)',
        fontSize: 11,
    },
    gridMarkerMainEq: {
        color: 'rgba(100, 180, 255, 0.9)',
        fontSize: 14,
    },
    gridMarkerSecondaryEq: {
        color: 'rgba(100, 150, 200, 0.6)',
        fontSize: 11,
    },

    // Centre
    centerMarker: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -14,
        marginTop: -12,
        alignItems: 'center',
    },
    centerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    centerDotEquatorial: {
        backgroundColor: 'rgba(100, 180, 255, 0.7)',
    },
    centerLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        marginTop: 2,
    },
    centerLabelEquatorial: {
        color: 'rgba(100, 180, 255, 0.7)',
    },

    // Étoiles
    starDot: {
        position: 'absolute',
        backgroundColor: '#ffffff',
    },
    starName: {
        position: 'absolute',
        color: 'rgba(220, 220, 255, 0.9)',
        fontSize: 10,
        fontWeight: '500',
        textShadowColor: 'rgba(0,0,0,0.95)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    // Objets
    objectMarker: {
        position: 'absolute',
        alignItems: 'center',
        gap: 3,
    },
    objectDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    objectDotInner: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    objectName: {
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 0.3,
        textShadowColor: 'rgba(0,0,0,0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },

    // Footer
    footer: {
        padding: 16,
        backgroundColor: 'rgba(11,12,16,0.95)',
        borderTopWidth: 1,
        borderColor: '#1f2833',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
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
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    legendText: {
        color: '#666',
        fontSize: 11,
    },
});