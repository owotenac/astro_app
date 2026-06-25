import { GlobalColors, globalStyles } from '@/global/theme';
import { useObservationStore } from '@/hooks/useObservationStore';
import { CelestialObject } from '@/model/celestialobject';
import { CelestialType } from '@/model/celestialtype';
import { computeAzAlt, formatToDMS } from '@/utils/compute';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import objectTypes from '../../assets/data/celestialtype.json';
import const_mapping from '../../assets/data/const_mapping.json';
import dso_images from '../../assets/data/dso_images.json';


// IMAGES
type DSOImages = {
    [key: string]: string;
}
const dsoImage: DSOImages = dso_images as DSOImages;

interface ObjectDetailsProps {
    object: CelestialObject;
    onClose: () => void;
}

const getHubbleDescription = (code: string | null) => {
    if (!code) return null;
    const c = code.trim().toUpperCase();
    if (c.startsWith('E')) return `Galaxie Elliptique`;
    if (c === 'S0' || c === 'SB0') return `Galaxie Lenticulaire`;
    if (c.startsWith('SB')) return `Galaxie Spirale Barrée`;
    if (c.startsWith('S')) return `Galaxie Spirale`;
    if (c.startsWith('IR') || c.startsWith('I')) return `Galaxie Irrégulière`;
    return `${code}`;
}

const ObjectDetailsComponent: React.FC<ObjectDetailsProps> = ({ object, onClose }) => {
    let objectType = objectTypes[object.Type as keyof typeof objectTypes] as CelestialType;
    if (!objectType) {
        objectType = { label: object.Type, iconName: "help-circle-outline", color: GlobalColors.nightMode };
    }

    const title = object.Common_names ?? object.M ?? object.Name
    const subtitle = object.Common_names || object.M ? object.Name : null

    const constKey = object.Const as keyof typeof const_mapping;
    const constellationName = const_mapping[constKey]?.fr || object.Const;
    const [azAlt, setAzAlt] = useState({ azimuth: 0, altitude: 0 });
    const [targetAzAlt, setTargetAzAlt] = useState({ azimuth: 0, altitude: 0 });
    const targetDate = useObservationStore(state => state.targetDate);

    // Update current Az/Alt in real-time
    useEffect(() => {
        const tick = () => {
            setAzAlt(computeAzAlt(object));
        }
        tick();
        const intervalId = setInterval(tick, 1000);
        return () => clearInterval(intervalId);
    }, [object]);

    // Update targeted Az/Alt when targetDate changes
    useEffect(() => {
        setTargetAzAlt(computeAzAlt(object, targetDate));
    }, [object, targetDate]);

    const renderPhotometry = () => {
        const bands = [
            { label: 'B', name: 'Bleu (B)', value: object.B_Mag, color: '#3b82f6' },
            { label: 'V', name: 'Visible (V)', value: object.V_Mag, color: '#10b981' },
            { label: 'J', name: 'Infra J (1.25µm)', value: object.J_Mag, color: '#f97316' },
            { label: 'H', name: 'Infra H (1.65µm)', value: object.H_Mag, color: '#ef4444' },
            { label: 'K', name: 'Infra K (2.2µm)', value: object.K_Mag, color: '#ec4899' },
        ];

        return (
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Photométrie</Text>
                <View style={styles.photometryGrid}>
                    {bands.map((band) => (
                        <View key={band.label} style={styles.photometryItem}>
                            <View style={[styles.bandCircle, { backgroundColor: band.color }]}>
                                <Text style={styles.bandCircleText}>{band.label}</Text>
                            </View>
                            <Text style={styles.bandName} numberOfLines={1}>{band.name}</Text>
                            <Text style={styles.bandValue}>
                                {band.value !== null ? band.value.toFixed(2) : '--'}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderIdentifiers = () => {
        if (!object.Identifiers) return null;
        const list = object.Identifiers.split(',').map(id => id.trim()).filter(id => id.length > 0);
        if (list.length === 0) return null;

        return (
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Désignations</Text>
                <View style={styles.identifiersContainer}>
                    {list.map((id, index) => (
                        <View key={index} style={styles.identifierChip}>
                            <Text style={styles.identifierText}>{id}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderImage = () => {
        // Chercher d'abord par M (Messier), puis par Name
        const urlImg = (object.M && dsoImage[object.M]) || dsoImage[object.Name as string];
        if (!urlImg) return null;
        const url = `https://raw.githubusercontent.com/Stellarium/stellarium/master/nebulae/default/${urlImg}`;
        return (
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Image</Text>
                <Image source={{ uri: url }} style={styles.image} />
            </View>
        );
    }
    return (
        <View style={globalStyles.container}>
            {/* En-tête avec bouton retour */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Carte principale de l'objet */}
                <View style={styles.object}>
                    {/* Ligne supérieure: Titres et Badge de Type */}
                    <View style={styles.topRow}>
                        <View style={styles.textBlock}>
                            <Text style={styles.title} numberOfLines={1}>{title}</Text>
                            {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
                        </View>
                        <View style={[styles.badgeWrapper, { backgroundColor: objectType.color + '30' }]}>
                            <Text style={styles.badge}>{objectType.label}</Text>
                        </View>
                    </View>

                    <View style={styles.indicatorsRow}>
                        <View style={[styles.magnitudeWrapper, { borderLeftWidth: 0 }]}>
                            <MaterialCommunityIcons name="weather-sunny" size={20} color={GlobalColors.white} />
                            {object.magnitude != null && (
                                <Text style={styles.magnitude}>{object.magnitude.toFixed(2)}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="ruler" size={20} color={GlobalColors.white} />
                            {object.Min_Ax != null && object.Maj_Ax != null && (
                                <Text style={styles.magnitude}>{object.Min_Ax.toFixed(1)}×{object.Maj_Ax.toFixed(1)}</Text>
                            )}
                            {object.Min_Ax == null && object.Maj_Ax != null && (
                                <Text style={styles.magnitude}>{object.Maj_Ax.toFixed(1)}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="dots-circle" size={20} color={GlobalColors.white} />
                            {object.Const != null && (
                                <Text style={styles.magnitude}>{constellationName}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Section Coordonnées */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Coordonnées</Text>

                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>RA / Dec :</Text>
                        <Text style={styles.rowValue}>{object.RA} / {object.Dec}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Current Az / Alt :</Text>
                        <Text style={styles.rowValue}>
                            {formatToDMS(azAlt.azimuth)} / {formatToDMS(azAlt.altitude)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Targeted Az / Alt :</Text>
                        <Text style={styles.rowValue}>
                            {formatToDMS(targetAzAlt.azimuth)} / {formatToDMS(targetAzAlt.altitude)}
                        </Text>
                    </View>

                    {object.Hubble && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Hubble :</Text>
                            <Text style={styles.rowValue}>{getHubbleDescription(object.Hubble)}</Text>
                        </View>
                    )}
                </View>

                {/* Section Photométrie */}
                {renderPhotometry()}

                {/* Section Identifiants */}
                {renderIdentifiers()}

                {/* Section Images */}
                {renderImage()}

            </ScrollView>
        </View>
    )
}

export default ObjectDetailsComponent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 10,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontFamily: "astro_font_regular",
        fontSize: 20,
        fontWeight: 'bold',
        color: GlobalColors.foreground,
    },
    scrollContent: {
        gap: 10,
        paddingBottom: 20,
    },
    object: {
        flexDirection: 'column',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: 10,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
        gap: 8,
    },
    indicatorsRow: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 4,
    },
    sectionCard: {
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: 10,
    },
    sectionTitle: {
        fontFamily: "astro_font_regular",
        fontSize: 16,
        fontWeight: '600',
        color: GlobalColors.foreground,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        paddingBottom: 4,
        marginBottom: 2,
    },
    textBlock: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontFamily: "astro_font_regular",
        fontSize: 22,
        fontWeight: '500',
        color: GlobalColors.foreground,
    },
    subtitle: {
        fontSize: 13,
        color: GlobalColors.foreground,
        opacity: 0.8,
    },
    badgeWrapper: {
        alignSelf: 'flex-start',
        borderRadius: 5,
        paddingVertical: 2,
        paddingHorizontal: 6,
        overflow: 'hidden',
    },
    badge: {
        fontSize: 10,
        fontWeight: '500',
        color: GlobalColors.white,
    },
    magnitude: {
        fontSize: 12,
        color: GlobalColors.textSecondary,
        marginTop: 2,
    },
    magnitudeWrapper: {
        alignItems: 'center',
        gap: 3,
        borderLeftWidth: 1,
        borderLeftColor: GlobalColors.border,
        paddingLeft: 4,
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        gap: 8,
    },
    rowLabel: {
        fontSize: 12,
        color: GlobalColors.textSecondary,
        flex: 1,
    },
    rowValue: {
        fontSize: 12,
        color: GlobalColors.white,
        fontWeight: '500',
        textAlign: 'right',
    },
    photometryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'space-between',
        marginTop: 4,
    },
    photometryItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 6,
        padding: 6,
        alignItems: 'center',
        width: '31%',
        minWidth: 70,
        gap: 4,
    },
    bandCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bandCircleText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    bandName: {
        fontSize: 8,
        color: GlobalColors.textSecondary,
        textAlign: 'center',
    },
    bandValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: GlobalColors.foreground,
    },
    identifiersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    identifierChip: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    identifierText: {
        fontSize: 10,
        color: '#e4e4f4',
        fontWeight: '500',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 4,
        resizeMode: "cover"
    },
});