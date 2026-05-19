import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { CelestialObject } from '@/model/celestialobject'
import objectTypes from '../../assets/data/celestialtype.json'
import { CelestialType } from '../model/celestialtype'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { GlobalColors } from '@/global/theme'

import const_mapping from '../../assets/data/const_mapping.json'

const CelestialObjectComponent = ({ item }: { item: CelestialObject }) => {
    let itemType = objectTypes[item.Type as keyof typeof objectTypes] as CelestialType;
    if (!itemType) {
        itemType = { label: item.Type, iconName: "help-circle-outline", color: GlobalColors.nightMode };
    }

    const title = item.Common_names ?? item.M ?? item.Name
    const subtitle = item.Common_names || item.M ? item.Name : null

    const constKey = item.Const as keyof typeof const_mapping;
    const constellationName = const_mapping[constKey]?.fr || item.Const;

    return (
        <View style={styles.item}>
            <View style={[styles.icon, { backgroundColor: itemType.color }]}>
                <MaterialCommunityIcons name={itemType.iconName as any} size={22} color="white" />
            </View>
            <View style={styles.content}>
                <View style={styles.textBlock}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="weather-sunny" size={12} color="white" />
                            {item.magnitude != null && (
                                <Text style={styles.magnitude}>{item.magnitude.toFixed(2)}</Text>
                            )}
                        </View>
                        <View style={styles.magnitudeWrapper}>
                            <MaterialCommunityIcons name="dots-circle" size={12} color="white" />
                            {item.Const != null && (
                                <Text style={styles.magnitude}>{constellationName}</Text>
                            )}
                        </View>
                    </View>

                </View>
                <View style={styles.badgeWrapper}>
                    <Text style={[styles.badge, { backgroundColor: itemType.color }]}>
                        {itemType.label}
                    </Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 11,
        //borderBottomWidth: 0.5,
        //borderBottomColor: GlobalColors.border,
        backgroundColor: "#020c3bff",
        margin: 5,
        borderRadius: 10
    },
    icon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
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
        fontSize: 15,
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
    },
    badge: {
        fontSize: 10,
        fontWeight: '500',
        color: '#fff',
        borderRadius: 3,
        paddingVertical: 2,
        paddingHorizontal: 7,
        overflow: 'hidden',
    },
    magnitude: {
        fontSize: 12,
        color: '#aaa'
    },
    magnitudeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
})
export default CelestialObjectComponent
