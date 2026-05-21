import CelestialObjectComponent from '@/components/celestialobjects-component'
import { useFilterStore } from '@/hooks/useFilterStore'
import { CelestialType } from '@/model/celestialtype'
import { computeAzAlt } from '@/utils/compute'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import objectTypesJson from '../../assets/data/celestialtype.json'
import ngc from '../../assets/data/ngc.json'
import { GlobalColors, globalStyles } from '../global/theme'
import { CelestialObject } from '../model/celestialobject'
const objectTypes = objectTypesJson as Record<string, CelestialType>

//const catalog: CelestialObject[] = messier as CelestialObject[];
const catalog: CelestialObject[] = ngc as CelestialObject[];

export default function Catalog() {
    const { currentFilter } = useFilterStore();
    const [searchTxt, setSearchTxt] = useState("");
    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>(catalog);

    const filter = () => {
        let filterCatalogTemp = catalog;

        //filter on types
        if (currentFilter.types.length > 0) {
            filterCatalogTemp = filterCatalogTemp.filter(item => currentFilter.types.includes(item.Type));
        }
        //filter on magnitude
        filterCatalogTemp = filterCatalogTemp.filter(item => item.magnitude >= currentFilter.magMin && item.magnitude <= currentFilter.magMax);
        //filter on altitude
        filterCatalogTemp = filterCatalogTemp.filter(item => {
            const azAlt = computeAzAlt(item);
            return azAlt.altitude >= currentFilter.altMin && azAlt.altitude <= currentFilter.altMax;
        });
        //filter on name
        setFilteredCatalog(filterCatalogTemp.filter(item => (item.Name + item.Common_names + item.M).toLowerCase().includes(searchTxt.toLowerCase())));
    }

    useEffect(() => {
        filter();
    }, [currentFilter]);

    const onSearch = () => {
        filter();
    }

    return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={globalStyles.font_title}>Catalogue</Text>
            </View>
            <View style={styles.search_view}>
                <TextInput
                    style={styles.search_bar}
                    onChangeText={setSearchTxt}
                    value={searchTxt}
                    placeholder='Rechercher'
                    placeholderTextColor={GlobalColors.placeholder}
                    clearButtonMode='always'
                    autoCorrect={false}
                    onSubmitEditing={onSearch}
                />
                <TouchableOpacity onPress={() => router.push("/filter")}>
                    <MaterialCommunityIcons name="tune-variant" size={22} color={GlobalColors.accent} />
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionCount}>{filteredCatalog.length} / {catalog.length} objets</Text>

            <FlatList
                showsVerticalScrollIndicator={false}
                data={filteredCatalog}
                renderItem={({ item }) => <CelestialObjectComponent object={item} />}
                keyExtractor={item => item.Name}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        padding: 5,
        gap: 10
    },
    search_view: {
        padding: 5,
        height: 60,
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        gap: 15,
        marginBottom: 10
    },
    search_bar: {
        color: GlobalColors.white,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: GlobalColors.searchBorder,
        backgroundColor: GlobalColors.searchBackground,
        padding: 15,
        //fontFamily: "f-regular",
        flex: 1

    },
    filter_bar: {
        padding: 5,
        flexDirection: 'row',
        width: '100%',
        flexWrap: 'wrap',
        height: 'auto',
        gap: 5
    },
    badge: {
        fontSize: 13,
        fontWeight: '500',
        color: GlobalColors.white,
        borderRadius: 6,
        paddingVertical: 2,
        paddingHorizontal: 7,
        overflow: 'hidden',
        marginRight: 5,
    },
    sectionCount: {
        fontSize: 11,
        color: GlobalColors.accent,
        marginBottom: 10,
    },
})