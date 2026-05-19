import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { GlobalColors, globalStyles, Theme } from '../global/theme'
import { CelestialObject } from '../model/celestialobject'
import messier from '../../assets/data/messier.json'
import ngc from '../../assets/data/ngc.json'
import CelestialObjectComponent from '@/components/celestialobjects-component'
import { CelestialType } from '@/model/celestialtype'

import objectTypesJson from '../../assets/data/celestialtype.json'
const objectTypes = objectTypesJson as Record<string, CelestialType>

//const catalog: CelestialObject[] = messier as CelestialObject[];
const catalog: CelestialObject[] = ngc as CelestialObject[];

export default function Catalog() {
    const [searchTxt, setSearchTxt] = useState("");
    const [filteredCatalog, setFilteredCatalog] = useState<CelestialObject[]>(catalog);
    const onSearch = () => {
        setFilteredCatalog(catalog.filter(item => (item.Name + item.Common_names + item.M).toLowerCase().includes(searchTxt.toLowerCase())));
    }


    return (
        <View style={globalStyles.container}>
            <View style={[styles.header]}>
                <Text style={Theme.fonts.title}>Catalogue</Text>
                <Text style={styles.count}>{filteredCatalog.length} / {catalog.length} objets</Text>
            </View>
            <View style={styles.search_view}>
                <TextInput
                    style={styles.search_bar}
                    onChangeText={setSearchTxt}
                    value={searchTxt}
                    placeholder='Rechercher'
                    placeholderTextColor={'#7b7b7cff'}
                    clearButtonMode='always'
                    autoCorrect={false}
                    onSubmitEditing={onSearch}
                />
            </View>
            {/* <View style={styles.filter_bar}>
                {Object.keys(objectTypes).map((key) => (
                    <TouchableOpacity key={key}>
                        <Text style={[styles.badge, { backgroundColor: objectTypes[key].color }]}>{objectTypes[key].label}</Text>
                    </TouchableOpacity>
                ))}
            </View> */}
            <FlatList
                showsVerticalScrollIndicator={false}
                data={filteredCatalog}
                renderItem={({ item }) => <CelestialObjectComponent item={item} />}
                keyExtractor={item => item.Name}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        padding: 10
    },
    search_view: {
        padding: 5,
        height: 60,
        flexDirection: 'row',
        width: '100%',
    },
    search_bar: {
        color: 'white',
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "#33334d",
        backgroundColor: "#222232",
        padding: 15,
        //fontFamily: "f-regular",
        flex: 1

    },
    count: {
        fontSize: 15,
        fontWeight: '500',
        color: GlobalColors.foreground,
        opacity: 0.5,
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
        color: '#fff',
        borderRadius: 6,
        paddingVertical: 2,
        paddingHorizontal: 7,
        overflow: 'hidden',
        marginRight: 5,
    },
})