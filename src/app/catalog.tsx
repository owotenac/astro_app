import CelestialObjectComponent from '@/components/celestialobjects-component'
import { useFilterStore } from '@/hooks/useFilterStore'
import { CelestialType } from '@/model/celestialtype'
import { filterCatalog } from '@/utils/filter'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import objectTypesJson from '../../assets/data/celestialtype.json'
import ngc from '../../assets/data/ngc.json'
import { GlobalColors, globalStyles } from '../global/theme'
import { CelestialObject } from '../model/celestialobject'
const objectTypes = objectTypesJson as Record<string, CelestialType>

//const catalog: CelestialObject[] = messier as CelestialObject[];
const catalog: CelestialObject[] = ngc as CelestialObject[];

export default function Catalog() {
    const currentFilter = useFilterStore(state => state.currentFilter);
    const [searchTxt, setSearchTxt] = useState("");
    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>(catalog);

    useEffect(() => {
        setFilteredCatalog(filterCatalog(currentFilter, searchTxt));
    }, [currentFilter]);

    const onSearch = () => {
        setFilteredCatalog(filterCatalog(currentFilter, searchTxt));
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={globalStyles.container}>
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
            </SafeAreaView>
        </SafeAreaProvider>
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