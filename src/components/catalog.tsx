import CelestialObjectComponent from '@/components/celestialobjects-component'
import { useFilterStore } from '@/hooks/useFilterStore'
import { useMountStore } from '@/hooks/useMountStore'
import { useObservationStore } from '@/hooks/useObservationStore'
import { filterCatalog } from '@/utils/filter'
import { useEffect, useState } from 'react'
import { FlatList, Text, TextInput, View } from 'react-native'
import ngc from '../../assets/data/ngc.json'
import { GlobalColors, globalStyles, textStyles } from '../global/theme'
import { CelestialObject } from '../model/celestialobject'

const catalog: CelestialObject[] = ngc as CelestialObject[];

export default function Catalog() {
    const setSelectedObject = useMountStore(state => state.setSelectedObject);
    const currentFilter = useFilterStore(state => state.currentFilter);
    const targetDate = useObservationStore(state => state.targetDate);
    const [searchTxt, setSearchTxt] = useState("");
    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>(catalog);

    useEffect(() => {
        setFilteredCatalog(filterCatalog(currentFilter, searchTxt, targetDate));
    }, [currentFilter, searchTxt, targetDate]);

    const onSearch = () => {
        setFilteredCatalog(filterCatalog(currentFilter, searchTxt, targetDate));
    }

    return (
        <View style={globalStyles.container}>
            <View style={globalStyles.panelHeader}>
                <Text style={textStyles.panelTitle}>Catalogue</Text>
            </View>
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
            <Text style={textStyles.sectionCount}>{filteredCatalog.length} / {catalog.length} objets</Text>

            <FlatList
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