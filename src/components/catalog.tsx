import CelestialObjectComponent from '@/components/celestialobjects-component'
import { useCatalog } from '@/hooks/useCatalog'
import { useFilterStore } from '@/hooks/useFilterStore'
import { useMountStore } from '@/hooks/useMountStore'
import { useObservationStore } from '@/hooks/useObservationStore'
import { filterCatalog } from '@/utils/filter'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native'
import { GlobalColors, globalStyles, Spacing, textStyles } from '../global/theme'
import { useResponsive } from '../hooks/useResponsive'
import { CelestialObject } from '../model/celestialobject'

export default function Catalog() {
    const { isMobilePortrait } = useResponsive()
    const { catalog, loading } = useCatalog();
    const setSelectedObject = useMountStore(state => state.setSelectedObject);
    const currentFilter = useFilterStore(state => state.currentFilter);
    const targetDate = useObservationStore(state => state.targetDate);
    const [searchTxt, setSearchTxt] = useState("");
    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>([]);

    useEffect(() => {
        if (!loading) {
            setFilteredCatalog(filterCatalog(catalog, currentFilter, searchTxt, targetDate));
        }
    }, [catalog, loading, currentFilter, searchTxt, targetDate]);

    const onSearch = () => {
        setFilteredCatalog(filterCatalog(catalog, currentFilter, searchTxt, targetDate));
    }

    if (loading) {
        return (
            <View style={[globalStyles.sidebarPanel, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={GlobalColors.primary} />
                <Text style={textStyles.meta}>Chargement du catalogue...</Text>
            </View>
        );
    }

    return (
        <View style={globalStyles.sidebarPanel}>
            {!isMobilePortrait && (
                <View style={globalStyles.panelHeader}>
                    <Text style={textStyles.panelTitle}>Catalogue</Text>
                </View>
            )}
            <View style={globalStyles.searchRow}>
                <TextInput
                    style={globalStyles.searchBar}
                    onChangeText={setSearchTxt}
                    value={searchTxt}
                    placeholder='Rechercher'
                    placeholderTextColor={GlobalColors.placeholder}
                    clearButtonMode='always'
                    autoCorrect={false}
                    onSubmitEditing={onSearch}
                />
            </View>
            <Text style={[textStyles.sectionCount, styles.countLine]}>
                {filteredCatalog.length} / {catalog.length} objets
            </Text>

            <FlatList
                style={styles.list}
                showsVerticalScrollIndicator={false}
                data={filteredCatalog}
                renderItem={({ item }) => (
                    <CelestialObjectComponent
                        object={item}
                        onPress={() => setSelectedObject(item)}
                    />
                )}
                keyExtractor={item => item.Name}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    countLine: {
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },
    list: {
        flex: 1,
        marginHorizontal: -Spacing.xs,
    },
})
