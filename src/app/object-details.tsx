import { GlobalColors, globalStyles } from '@/global/theme'
import { CelestialObject } from '@/model/celestialobject'
import { CelestialType } from '@/model/celestialtype'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import objectTypes from '../../assets/data/celestialtype.json'
import const_mapping from '../../assets/data/const_mapping.json'

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

    return (
        <View style={globalStyles.container}>
            <View style={styles.object}>

                <View style={styles.content}>
                    <View style={styles.textBlock}>
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'center' }}>
                            <View style={styles.magnitudeWrapper}>
                                <MaterialCommunityIcons name="weather-sunny" size={22} color="white" />
                                {object.magnitude != null && (
                                    <Text style={styles.magnitude}>{object.magnitude.toFixed(2)}</Text>
                                )}
                            </View>
                            <View style={styles.magnitudeWrapper}>
                                <MaterialCommunityIcons name="ruler" size={22} color="white" />
                                {object.Min_Ax != null && object.Maj_Ax != null && (
                                    <Text style={styles.magnitude}>{object.Min_Ax.toFixed(2)} x {object.Maj_Ax.toFixed(2)}</Text>
                                )}
                            </View>
                            <View style={styles.magnitudeWrapper}>
                                <MaterialCommunityIcons name="dots-circle" size={22} color="white" />
                                {object.Const != null && (
                                    <Text style={styles.magnitude}>{constellationName}</Text>
                                )}
                            </View>
                        </View>

                    </View>
                    <View style={[styles.badgeWrapper, { backgroundColor: objectType.color + '30' }]}>
                        <Text style={styles.badge}>
                            {objectType.label}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.contentInfo}>
                <Text style={styles.title} numberOfLines={1}>Informations</Text>

                <View style={styles.row}>
                    <Text style={styles.subtitle}>Ascension droite:</Text>
                    <Text style={styles.subtitle}>{object.RA}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.subtitle}>Declinaison:</Text>
                    <Text style={styles.subtitle}>{object.Dec}</Text>
                </View>
            </View>
        </View>
    )
}

export default ObjectDetails

const styles = StyleSheet.create({
    object: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 11,
        backgroundColor: "#132233ff",
        margin: 1,
        borderRadius: 10
    },
    contentInfo: {
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 11,
        backgroundColor: "#132233ff",
        margin: 1,
        borderRadius: 10
    },
    icon: {
        width: 50,
        height: 50,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginRight: 10,
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
        //borderWidth: 0.5,
        //borderColor: "#000000"
    },
    badge: {
        fontSize: 11,
        fontWeight: '500',
        color: '#fff',

    },
    magnitude: {
        fontSize: 15,
        color: '#aaa'
    },
    magnitudeWrapper: {
        alignItems: 'center',
        gap: 4,
        borderLeftWidth: 1,
        borderLeftColor: GlobalColors.border,
        paddingLeft: 4,
        width: 100
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
    }

})