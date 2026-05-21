import { GlobalColors, globalStyles } from '@/global/theme';
import { CelestialObject } from '@/model/celestialobject';
import { CelestialType } from '@/model/celestialtype';
import { computeAzAlt, formatToDMS } from '@/utils/compute';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import objectTypes from '../../assets/data/celestialtype.json';
import const_mapping from '../../assets/data/const_mapping.json';

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

const ObjectDetails = () => {
    const params = useLocalSearchParams();
    const object = JSON.parse(params.object as string) as CelestialObject;
    let objectType = objectTypes[object.Type as keyof typeof objectTypes] as CelestialType;
    if (!objectType) {
        objectType = { label: object.Type, iconName: "help-circle-outline", color: GlobalColors.nightMode };
    }

    const title = object.Common_names ?? object.M ?? object.Name
    const subtitle = object.Common_names || object.M ? object.Name : null

    const constKey = object.Const as keyof typeof const_mapping;
    const constellationName = const_mapping[constKey]?.fr || object.Const;
    const [azAlt, setAzAlt] = useState({ azimuth: 0, altitude: 0 });


    useEffect(() => {

        const tick = () => {
            setAzAlt(computeAzAlt(object))
        }
        tick();

        const intervalId = setInterval(tick, 1000);
        return () => clearInterval(intervalId);
    }, []);

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
                <Text style={styles.sectionTitle}>Photométrie (Bandes spectrales)</Text>
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
                <Text style={styles.sectionTitle}>Désignations Alternatives</Text>
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

    return (
        <View style={globalStyles.container}>
            {/* En-tête fixe avec bouton retour */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Carte principale de l'objet */}
                <View style={styles.object}>
                    {/* Ligne supérieure: Titres et Badge de Type */}
                    <View style={styles.topRow}>
                        <View style={styles.textBlock}>
                            <Text style={styles.title} numberOfLines={1}>{title}</Text>
                            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                        </View>
                        <View style={[styles.badgeWrapper, { backgroundColor: objectType.color + '30' }]}>
                            <Text style={styles.badge}>
                                {objectType.label}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.indicatorsRow}>
                        <View style={[styles.magnitudeWrapper, { borderLeftWidth: 0 }]}>
                            <MaterialCommunityIcons name="weather-sunny" size={22} color={GlobalColors.white} />
                            {object.magnitude != null && (
                                <Text style={styles.magnitude}>{object.magnitude.toFixed(2)}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="ruler" size={22} color={GlobalColors.white} />
                            {object.Min_Ax != null && object.Maj_Ax != null && (
                                <Text style={styles.magnitude}>{object.Min_Ax.toFixed(2)} x {object.Maj_Ax.toFixed(2)}</Text>
                            )}
                            {object.Min_Ax == null && object.Maj_Ax != null && (
                                <Text style={styles.magnitude}>{object.Maj_Ax.toFixed(2)}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="dots-circle" size={22} color={GlobalColors.white} />
                            {object.Const != null && (
                                <Text style={styles.magnitude}>{constellationName}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="ev-plug-type2" size={22} color={GlobalColors.white} />
                            {object.Hubble != null ? (
                                <Text style={styles.magnitude}>{getHubbleDescription(object.Hubble)}</Text>
                            ) : (
                                <Text style={styles.magnitude}>--</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Section Informations Coordonnées et Physiques */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Informations Générales</Text>

                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Ascension droite :</Text>
                        <Text style={styles.rowValue}>{object.RA}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Déclinaison :</Text>
                        <Text style={styles.rowValue}>{object.Dec}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Coordonnées décimales :</Text>
                        <Text style={styles.rowValue}>
                            {object.ra_deg.toFixed(5)}° / {object.dec_deg.toFixed(5)}°
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Azimut / Altitude:</Text>
                        <Text style={styles.rowValue}>
                            {formatToDMS(azAlt.azimuth)} / {formatToDMS(azAlt.altitude)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Constellation (code) :</Text>
                        <Text style={styles.rowValue}>{object.Const}</Text>
                    </View>
                    {object.Hubble && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Classification de Hubble :</Text>
                            <Text style={styles.rowValue}>{object.Hubble}</Text>
                        </View>
                    )}
                    {object.M && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Désignation Messier :</Text>
                            <Text style={styles.rowValue}>{object.M}</Text>
                        </View>
                    )}
                    {object.NGC && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Numéro NGC :</Text>
                            <Text style={styles.rowValue}>{object.NGC}</Text>
                        </View>
                    )}
                    {object.IC && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Numéro IC :</Text>
                            <Text style={styles.rowValue}>{object.IC}</Text>
                        </View>
                    )}
                    {object.Cstar_Names && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Étoile centrale :</Text>
                            <Text style={styles.rowValue}>{object.Cstar_Names}</Text>
                        </View>
                    )}
                </View>

                {/* Section Photométrie */}
                {renderPhotometry()}

                {/* Section Identifiants Alternatifs */}
                {renderIdentifiers()}
            </ScrollView>
        </View>
    )
}

export default ObjectDetails

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: "astro_font_regular",
        fontSize: 24,
        fontWeight: 'bold',
        color: GlobalColors.foreground,
    },
    scrollContent: {
        gap: 12,
        paddingBottom: 24,
    },
    object: {
        flexDirection: 'column',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: 12,
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
        marginTop: 6,
    },
    sectionCard: {
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: GlobalColors.cardBackground,
        borderRadius: 12,
    },
    sectionTitle: {
        fontFamily: "astro_font_regular",
        fontSize: 20,
        fontWeight: '600',
        color: GlobalColors.foreground,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        paddingBottom: 6,
        marginBottom: 4,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    textBlock: {
        flex: 1,
        gap: 3,
    },
    title: {
        fontFamily: "astro_font_regular",
        fontSize: 28,
        fontWeight: '500',
        color: GlobalColors.foreground,
    },
    subtitle: {
        fontSize: 16,
        color: GlobalColors.foreground,
        opacity: 0.8,
    },
    badgeWrapper: {
        alignSelf: 'flex-start',
        borderRadius: 5,
        paddingVertical: 3,
        paddingHorizontal: 7,
        overflow: 'hidden',
    },
    badge: {
        fontSize: 11,
        fontWeight: '500',
        color: GlobalColors.white,
    },
    magnitude: {
        fontSize: 14,
        color: GlobalColors.textSecondary,
        marginTop: 2,
    },
    magnitudeWrapper: {
        alignItems: 'center',
        gap: 4,
        borderLeftWidth: 1,
        borderLeftColor: GlobalColors.border,
        paddingLeft: 4,
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        gap: 12,
    },
    rowLabel: {
        fontSize: 14,
        color: GlobalColors.textSecondary,
        flex: 1,
    },
    rowValue: {
        fontSize: 14,
        color: GlobalColors.white,
        fontWeight: '500',
        textAlign: 'right',
    },
    photometryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
        marginTop: 6,
    },
    photometryItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        width: '31%',
        minWidth: 90,
        gap: 6,
    },
    bandCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bandCircleText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    bandName: {
        fontSize: 9,
        color: GlobalColors.textSecondary,
        textAlign: 'center',
    },
    bandValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: GlobalColors.foreground,
    },
    identifiersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    identifierChip: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    identifierText: {
        fontSize: 11,
        color: '#e4e4f4',
        fontWeight: '500',
    },
})