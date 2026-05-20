import { GlobalColors } from '@/global/theme'
import { CelestialObject } from '@/model/celestialobject'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import objectTypes from '../../assets/data/celestialtype.json'
import { CelestialType } from '../model/celestialtype'

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
            <View style={[styles.icon, { backgroundColor: itemType.color + '30' }]}>
                <MaterialCommunityIcons
                    name={itemType.iconName as any}
                    size={18}
                    color={itemType.color}
                />
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
                <View style={[styles.badgeWrapper, { backgroundColor: itemType.color + '30' }]}>
                    <Text style={styles.badge}>
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
        backgroundColor: "#1e2040",
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
