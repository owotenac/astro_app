import objectTypesJson from '@/assets/data/celestialtype.json'
import { GlobalColors, globalStyles } from '@/global/theme'
import { useFilterStore } from '@/hooks/useFilterStore'
import { useSettings } from '@/hooks/useSettings'
import { CelestialType } from '@/model/celestialtype'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Slider } from '@miblanchard/react-native-slider'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const objectTypes = objectTypesJson as Record<string, CelestialType>

const MAG_MIN = 0
const MAG_MAX = 15

const ALT_MIN = 0
const ALT_MAX = 90

type Props = {
    onClose: () => void
}

export default function Filter({ onClose }: Props) {
    const { currentFilter, setFilter } = useFilterStore();
    const { applySettings } = useSettings();
    const [selectedTypes, setSelectedTypes] = useState<string[]>(currentFilter.types)
    const [magRange, setMagRange] = useState<[number, number]>([currentFilter.magMin, currentFilter.magMax])
    const [altRange, setAltRange] = useState<[number, number]>([currentFilter.altMin, currentFilter.altMax])

    const toggleType = useCallback((type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }, [])

    const applyFilter = useCallback(() => {
        const filter = { magMin: magRange[0], magMax: magRange[1], altMin: altRange[0], altMax: altRange[1], types: selectedTypes }
        setFilter(filter)
        applySettings(filter)
        onClose();
    }, [magRange, altRange, selectedTypes])

    return (
        <View style={globalStyles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={applyFilter}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.white} />
                </TouchableOpacity>
                <Text style={globalStyles.font_subtitle}>Filtres</Text>
            </View>

            {/* Magnitude */}
            <Text style={styles.sectionLabel}>Magnitude</Text>
            <View style={styles.magContainer}>
                <View style={styles.magLabels}>
                    <Text style={styles.magValue}>{magRange[0].toFixed(1)}</Text>
                    <Text style={styles.magHint}>Plus brillant → Plus faible</Text>
                    <Text style={styles.magValue}>{magRange[1].toFixed(1)}</Text>
                </View>
                <Slider
                    value={magRange}
                    onValueChange={(val) => {
                        if (Array.isArray(val)) {
                            setMagRange([val[0], val[1]])
                        }
                    }}
                    minimumValue={MAG_MIN}
                    maximumValue={MAG_MAX}
                    step={0.5}
                    containerStyle={styles.slider}
                    minimumTrackTintColor={GlobalColors.primary}
                    maximumTrackTintColor={GlobalColors.containerBackground}
                    thumbTintColor={GlobalColors.accent}
                />
            </View>

            {/* Visibility */}
            <Text style={styles.sectionLabel}>Visibilité</Text>
            <View style={styles.magContainer}>
                <View style={styles.magLabels}>
                    <Text style={styles.magValue}>{altRange[0].toFixed(1)}°</Text>
                    <Text style={styles.magHint}>Altitude Minimale</Text>
                    <Text style={styles.magValue}>{altRange[1].toFixed(1)}°</Text>
                </View>
                <Slider
                    value={altRange}
                    onValueChange={(val) => {
                        if (Array.isArray(val)) {
                            setAltRange([val[0], val[1]])
                        }
                    }}
                    minimumValue={ALT_MIN}
                    maximumValue={ALT_MAX}
                    step={2}
                    containerStyle={styles.slider}
                    minimumTrackTintColor={GlobalColors.primary}
                    maximumTrackTintColor={GlobalColors.containerBackground}
                    thumbTintColor={GlobalColors.accent}
                />
            </View>

            {/* Types */}
            <View style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>Type d'objet</Text>
                {selectedTypes.length > 0 && (
                    <Text style={styles.sectionCount}>{selectedTypes.length} sélectionné(s)</Text>
                )}
            </View>

            <View style={styles.typeList}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {Object.entries(objectTypes).map(([key, type], index, arr) => {
                        const isSelected = selectedTypes.includes(key)
                        const isLast = index === arr.length - 1
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[styles.typeRow, !isLast && styles.typeRowBorder]}
                                onPress={() => toggleType(key)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.typeIcon, { backgroundColor: type.color + '30' }]}>
                                    <MaterialCommunityIcons
                                        name={type.iconName as any}
                                        size={18}
                                        color={type.color}
                                    />
                                </View>
                                <Text style={styles.typeLabel}>{type.label}</Text>
                                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                                    {isSelected && (
                                        <MaterialCommunityIcons name="check" size={12} color={GlobalColors.white} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        gap: 10
    },
    // Section labels
    sectionLabel: {
        fontSize: 11,
        color: GlobalColors.mutedText,
        letterSpacing: 0.08,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginTop: 4,
    },
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    sectionCount: {
        fontSize: 11,
        color: GlobalColors.accent,
        marginBottom: 10,
    },

    // Magnitude slider
    magContainer: {
        backgroundColor: GlobalColors.containerBackground,
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    magLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    magValue: {
        fontSize: 16,
        fontWeight: '500',
        color: GlobalColors.textLight,
        fontVariant: ['tabular-nums'],
        minWidth: 32,
    },
    magHint: {
        fontSize: 10,
        color: GlobalColors.mutedText,
    },
    slider: {
        width: '100%',
    },

    // Type list
    typeList: {
        flex: 1,
        backgroundColor: GlobalColors.containerBackground,
        borderRadius: 12,
    },
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
    },
    typeRowBorder: {
        borderBottomWidth: 0.5,
        borderBottomColor: GlobalColors.separator,
    },
    typeIcon: {
        width: 34,
        height: 34,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    typeLabel: {
        flex: 1,
        fontSize: 13,
        color: GlobalColors.textLight,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: GlobalColors.checkboxBorder,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    checkboxOn: {
        backgroundColor: GlobalColors.primary,
        borderColor: GlobalColors.primary,
    },
})