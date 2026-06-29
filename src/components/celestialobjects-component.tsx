import { GlobalColors, globalStyles, Spacing, textStyles } from '@/global/theme'
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
        objectType = { label: object.Type, iconName: "help-circle-outline", color: GlobalColors.unknownType };
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
        <TouchableOpacity style={globalStyles.listItem} onPress={() => handlePress()}>
            <View style={[globalStyles.typeIcon, { marginRight: Spacing.md, backgroundColor: objectType.color + '30' }]}>
                <MaterialCommunityIcons
                    name={objectType.iconName as any}
                    size={18}
                    color={objectType.color}
                />
            </View>
            <View style={styles.content}>
                <View style={styles.textBlock}>
                    <Text style={textStyles.objectTitle} numberOfLines={1}>{title}</Text>
                    <Text style={textStyles.objectSubtitle} numberOfLines={1}>{subtitle}</Text>
                    <View style={[globalStyles.row, { gap: Spacing.md }]}>
                        <View style={globalStyles.inlineRow}>
                            <MaterialCommunityIcons name="weather-sunny" size={12} color={GlobalColors.textPrimary} />
                            {object.magnitude != null && (
                                <Text style={textStyles.meta}>{object.magnitude.toFixed(2)}</Text>
                            )}
                        </View>
                        <View style={globalStyles.inlineRow}>
                            <MaterialCommunityIcons name="dots-circle" size={12} color={GlobalColors.textPrimary} />
                            {object.Const != null && (
                                <Text style={textStyles.meta}>{constellationName}</Text>
                            )}
                        </View>
                    </View>

                </View>
                <View style={[globalStyles.badgeWrapper, { backgroundColor: objectType.color + '30' }]}>
                    <Text style={textStyles.badge}>
                        {objectType.label}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    textBlock: {
        flex: 1,
        gap: Spacing.xs,
    },
})
export default CelestialObjectComponent
