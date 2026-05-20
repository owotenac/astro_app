import objectTypesJson from '@/assets/data/celestialtype.json'
import { globalStyles } from '@/global/theme'
import { useFilterStore } from '@/hooks/useFilterStore'
import { CelestialType } from '@/model/celestialtype'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Slider } from '@miblanchard/react-native-slider'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const objectTypes = objectTypesJson as Record<string, CelestialType>

const MAG_MIN = 0
const MAG_MAX = 15


const Filter = () => {
    const { currentFilter, setFilter } = useFilterStore();
    const [selectedTypes, setSelectedTypes] = useState<string[]>(currentFilter.types)
    const [magRange, setMagRange] = useState<[number, number]>([currentFilter.magMin, currentFilter.magMax])

    const toggleType = useCallback((type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }, [])

    const applyFilter = useCallback(() => {
        setFilter({ magMin: magRange[0], magMax: magRange[1], types: selectedTypes })
        router.back();
    }, [magRange, selectedTypes])

    return (
        <View style={globalStyles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={applyFilter}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={globalStyles.font_title}>Filtres</Text>
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
                    minimumTrackTintColor="#534ab7"
                    maximumTrackTintColor="#1e2040"
                    thumbTintColor="#afa9ec"
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
                                        <MaterialCommunityIcons name="check" size={12} color="white" />
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

export default Filter

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
        color: '#bbbbbbff',
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
        color: '#afa9ec',
        marginBottom: 10,
    },

    // Magnitude slider
    magContainer: {
        backgroundColor: '#1e2040',
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
        color: '#e4e4f4',
        fontVariant: ['tabular-nums'],
        minWidth: 32,
    },
    magHint: {
        fontSize: 10,
        color: '#bbbbbbff',
    },
    slider: {
        width: '100%',
    },

    // Type list
    typeList: {
        flex: 1,
        backgroundColor: '#1e2040',
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
        borderBottomColor: '#13152a',
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
        color: '#e4e4f4',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#3a3c5e',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    checkboxOn: {
        backgroundColor: '#534ab7',
        borderColor: '#534ab7',
    },
})