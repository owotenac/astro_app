import objectTypesJson from '@/assets/data/celestialtype.json'
import { GlobalColors, globalStyles, Radius, Spacing, textStyles } from '@/global/theme'
import { useFilterStore } from '@/hooks/useFilterStore'
import { useSettingsStore } from '@/hooks/useSettings'
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
    const updateFilter = useSettingsStore(state => state.updateFilter);
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
        updateFilter(filter)
        onClose();
    }, [magRange, altRange, selectedTypes])

    return (
        <View style={globalStyles.sidebarPanel}>

            {/* Header */}
            <View style={globalStyles.panelHeader}>
                <TouchableOpacity onPress={applyFilter}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={GlobalColors.textPrimary} />
                </TouchableOpacity>
                <Text style={textStyles.panelTitle}>Filtres</Text>
            </View>

            {/* Magnitude */}
            <Text style={[textStyles.sectionLabel, globalStyles.sectionLabelMargin]}>Magnitude</Text>
            <View style={[globalStyles.panel, styles.panelSpacing]}>
                <View style={[globalStyles.rowBetween, styles.magLabels]}>
                    <Text style={[textStyles.valueEmphasis, styles.magValue]}>{magRange[0].toFixed(1)}</Text>
                    <Text style={textStyles.hint}>Plus brillant → Plus faible</Text>
                    <Text style={[textStyles.valueEmphasis, styles.magValue]}>{magRange[1].toFixed(1)}</Text>
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
            <Text style={[textStyles.sectionLabel, globalStyles.sectionLabelMargin]}>Visibilité</Text>
            <View style={[globalStyles.panel, styles.panelSpacing]}>
                <View style={[globalStyles.rowBetween, styles.magLabels]}>
                    <Text style={[textStyles.valueEmphasis, styles.magValue]}>{altRange[0].toFixed(1)}°</Text>
                    <Text style={textStyles.hint}>Altitude Minimale</Text>
                    <Text style={[textStyles.valueEmphasis, styles.magValue]}>{altRange[1].toFixed(1)}°</Text>
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
            <View style={[globalStyles.rowBetween, styles.sectionRow]}>
                <Text style={textStyles.sectionLabel}>Type d'objet</Text>
                {selectedTypes.length > 0 && (
                    <Text style={textStyles.sectionCount}>{selectedTypes.length} sélectionné(s)</Text>
                )}
            </View>

            <View style={[globalStyles.panel, styles.typeList]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {Object.entries(objectTypes).map(([key, type], index, arr) => {
                        const isSelected = selectedTypes.includes(key)
                        const isLast = index === arr.length - 1
                        return (
                            <TouchableOpacity
                                key={key}
                                style={[globalStyles.listRow, !isLast && styles.typeRowBorder]}
                                onPress={() => toggleType(key)}
                                activeOpacity={0.7}
                            >
                                <View style={[globalStyles.typeIcon, { backgroundColor: type.color + '30' }]}>
                                    <MaterialCommunityIcons
                                        name={type.iconName as any}
                                        size={18}
                                        color={type.color}
                                    />
                                </View>
                                <Text style={[textStyles.listLabel, styles.typeLabel]}>{type.label}</Text>
                                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                                    {isSelected && (
                                        <MaterialCommunityIcons name="check" size={12} color={GlobalColors.textPrimary} />
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
    sectionRow: {
        marginTop: Spacing.sm,
    },
    panelSpacing: {
        marginBottom: Spacing.xl,
    },
    magLabels: {
        marginBottom: Spacing.xs,
    },
    magValue: {
        fontVariant: ['tabular-nums'],
        minWidth: 32,
    },
    slider: {
        width: '100%',
    },
    typeList: {
        flex: 1,
        padding: 0,
    },
    typeRowBorder: {
        borderBottomWidth: 0.5,
        borderBottomColor: GlobalColors.separator,
    },
    typeLabel: {
        flex: 1,
    },
    checkbox: {
        width: Spacing.xl,
        height: Spacing.xl,
        borderRadius: Radius.md,
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