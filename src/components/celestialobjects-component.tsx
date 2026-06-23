import { GlobalColors } from '@/global/theme'
import { CelestialObject } from '@/model/celestialobject'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import objectTypes from '../../assets/data/celestialtype.json'
import const_mapping from '../../assets/data/const_mapping.json'
import { CelestialType } from '../model/celestialtype'

interface CelestialObjectComponentProps {
    object: CelestialObject;
    onPress?: () => void;
}

const CelestialObjectComponent = ({ object, onPress }: CelestialObjectComponentProps) => {
    let objectType = objectTypes[object.Type as keyof typeof objectTypes] as CelestialType;
    if (!objectType) {
        objectType = { label: object.Type, iconName: "help-circle-outline", color: GlobalColors.nightMode };
    }

    const title = object.Common_names ?? object.M ?? object.Name
    const subtitle = object.Common_names || object.M ? object.Name : null

    const constKey = object.Const as keyof typeof const_mapping;
    const constellationName = const_mapping[constKey]?.fr || object.Const;

    const handlePress = () => {
        if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity style={styles.object} onPress={() => handlePress()}>
            <View style={[styles.icon, { backgroundColor: objectType.color + '30' }]}>
                <MaterialCommunityIcons
                    name={objectType.iconName as any}
                    size={18}
                    color={objectType.color}
                />
            </View>
            <View style={styles.content}>
                <View style={styles.textBlock}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="weather-sunny" size={12} color={GlobalColors.white} />
                            {object.magnitude != null && (
                                <Text style={styles.magnitude}>{object.magnitude.toFixed(2)}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="dots-circle" size={12} color={GlobalColors.white} />
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
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    object: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 11,
        //borderBottomWidth: 0.5,
        //borderBottomColor: GlobalColors.border,
        backgroundColor: GlobalColors.cardBackground,
        margin: 1,
        borderRadius: 10
    },
    icon: {
        width: 34,
        height: 34,
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
        fontSize: 18,
        fontWeight: '500',
        color: GlobalColors.foreground,
    },
    subtitle: {
        fontSize: 12,
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
        color: GlobalColors.white,

    },
    magnitude: {
        fontSize: 12,
        color: GlobalColors.textSecondary
    },
    magnitudeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
})
export default CelestialObjectComponent
