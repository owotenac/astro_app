import { GlobalColors, globalStyles, PhotometryBands, Radius, Spacing, textStyles } from '@/global/theme';
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
        objectType = { label: object.Type, iconName: "help-circle-outline", color: GlobalColors.unknownType };
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
        if (targetDate) {
            setTargetAzAlt(computeAzAlt(object, targetDate));
        }
    }, [object, targetDate]);

    const renderPhotometry = () => {
        return (
            <View style={globalStyles.cardCompact}>
                <Text style={globalStyles.sectionHeader}>Photométrie</Text>
                <View style={styles.photometryGrid}>
                    {PhotometryBands.map((band) => {
                        const value = object[band.field];
                        return (
                        <View key={band.label} style={[globalStyles.photometryItem, styles.photometryItem]}>
                            <View style={[styles.bandCircle, { backgroundColor: band.color }]}>
                                <Text style={[textStyles.badgeSmall, styles.bandCircleText]}>{band.label}</Text>
                            </View>
                            <Text style={textStyles.micro} numberOfLines={1}>{band.name}</Text>
                            <Text style={textStyles.smallBold}>
                                {value !== null ? value.toFixed(2) : '--'}
                            </Text>
                        </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderIdentifiers = () => {
        if (!object.Identifiers) return null;
        const list = object.Identifiers.split(',').map(id => id.trim()).filter(id => id.length > 0);
        if (list.length === 0) return null;

        return (
            <View style={globalStyles.cardCompact}>
                <Text style={globalStyles.sectionHeader}>Désignations</Text>
                <View style={styles.identifiersContainer}>
                    {list.map((id, index) => (
                        <View key={index} style={globalStyles.chip}>
                            <Text style={textStyles.chip}>{id}</Text>
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
            <View style={globalStyles.cardCompact}>
                <Text style={globalStyles.sectionHeader}>Image</Text>
                <Image source={{ uri: url }} style={styles.image} />
            </View>
        );
    }
    return (
        <View style={globalStyles.sidebarPanel}>
            {/* En-tête avec bouton retour */}
            <View style={[globalStyles.panelHeader, styles.header]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.textPrimary} />
                </TouchableOpacity>
                <Text style={[textStyles.headingMedium, styles.headerTitle]} numberOfLines={1}>{title}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={globalStyles.cardCompact}>
                    <View style={[globalStyles.rowStart, styles.topRow]}>
                        <View style={styles.textBlock}>
                            <Text style={textStyles.headingLarge} numberOfLines={1}>{title}</Text>
                            {subtitle && <Text style={textStyles.subtitle} numberOfLines={1}>{subtitle}</Text>}
                        </View>
                        <View style={[globalStyles.badgeWrapper, { backgroundColor: objectType.color + '30' }]}>
                            <Text style={textStyles.badgeSmall}>{objectType.label}</Text>
                        </View>
                    </View>

                    <View style={styles.indicatorsRow}>
                        <View style={[styles.magnitudeWrapper, { borderLeftWidth: 0 }]}>
                            <MaterialCommunityIcons name="weather-sunny" size={20} color={GlobalColors.textPrimary} />
                            {object.magnitude != null && (
                                <Text style={[textStyles.meta, styles.magnitude]}>{object.magnitude.toFixed(2)}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="ruler" size={20} color={GlobalColors.textPrimary} />
                            {object.Min_Ax != null && object.Maj_Ax != null && (
                                <Text style={[textStyles.meta, styles.magnitude]}>{object.Min_Ax.toFixed(1)}×{object.Maj_Ax.toFixed(1)}</Text>
                            )}
                            {object.Min_Ax == null && object.Maj_Ax != null && (
                                <Text style={[textStyles.meta, styles.magnitude]}>{object.Maj_Ax.toFixed(1)}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="dots-circle" size={20} color={GlobalColors.textPrimary} />
                            {object.Const != null && (
                                <Text style={[textStyles.meta, styles.magnitude]}>{constellationName}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Section Coordonnées */}
                <View style={globalStyles.cardCompact}>
                    <Text style={globalStyles.sectionHeader}>Coordonnées</Text>

                    <View style={globalStyles.kvRow}>
                        <Text style={textStyles.rowLabel}>RA / Dec :</Text>
                        <Text style={textStyles.rowValue}>{object.RA} / {object.Dec}</Text>
                    </View>
                    <View style={globalStyles.kvRow}>
                        <Text style={textStyles.rowLabel}>Current Az / Alt :</Text>
                        <Text style={textStyles.rowValue}>
                            {formatToDMS(azAlt.azimuth)} / {formatToDMS(azAlt.altitude)}
                        </Text>
                    </View>
                    <View style={globalStyles.kvRow}>
                        <Text style={textStyles.rowLabel}>Targeted Az / Alt :</Text>
                        <Text style={textStyles.rowValue}>
                            {formatToDMS(targetAzAlt.azimuth)} / {formatToDMS(targetAzAlt.altitude)}
                        </Text>
                    </View>

                    {object.Hubble && (
                        <View style={globalStyles.kvRow}>
                            <Text style={textStyles.rowLabel}>Hubble :</Text>
                            <Text style={textStyles.rowValue}>{getHubbleDescription(object.Hubble)}</Text>
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
    header: {
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        flex: 1,
    },
    scrollContent: {
        gap: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    topRow: {
        justifyContent: 'space-between',
        width: '100%',
        gap: Spacing.sm,
    },
    indicatorsRow: {
        flexDirection: 'row',
        width: '100%',
        marginTop: Spacing.xs,
    },
    textBlock: {
        flex: 1,
        gap: Spacing.xs,
    },
    magnitude: {
        marginTop: Spacing.xs,
    },
    magnitudeWrapper: {
        alignItems: 'center',
        gap: Spacing.xs,
        borderLeftWidth: 1,
        borderLeftColor: GlobalColors.border,
        paddingLeft: Spacing.xs,
        flex: 1,
    },
    photometryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    photometryItem: {
        width: '31%',
        minWidth: 70,
    },
    bandCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bandCircleText: {
        fontWeight: 'bold',
    },
    identifiersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: Radius.sm,
        marginTop: Spacing.xs,
        resizeMode: "cover"
    },
});