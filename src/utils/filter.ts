import { CurrentFilter } from "@/hooks/useFilterStore";
import { CelestialObject } from "@/model/celestialobject";
import catalogJson from '../../assets/data/ngc.json';
import { computeAzAlt } from "./compute";

const catalog: CelestialObject[] = catalogJson as CelestialObject[];

export const filterCatalog = (currentFilter: CurrentFilter, searchTxt: string = '', observationDate: Date = new Date()): CelestialObject[] => {
    let filterCatalogTemp = catalog;

    //filter on types
    if (currentFilter.types.length > 0) {
        filterCatalogTemp = filterCatalogTemp.filter(item => currentFilter.types.includes(item.Type));
    }
    //filter on magnitude
    filterCatalogTemp = filterCatalogTemp.filter(item => item.magnitude >= currentFilter.magMin && item.magnitude <= currentFilter.magMax);
    //filter on altitude
    filterCatalogTemp = filterCatalogTemp.filter(item => {
        const azAlt = computeAzAlt(item, observationDate);
        return azAlt.altitude >= currentFilter.altMin && azAlt.altitude <= currentFilter.altMax;
    });
    //filter on name
    if (searchTxt.length > 0) {
        filterCatalogTemp = filterCatalogTemp.filter(item => item.Name.toLowerCase().includes(searchTxt.toLowerCase()) || item.Common_names?.toLowerCase().includes(searchTxt.toLowerCase()) || item.M?.toLowerCase().includes(searchTxt.toLowerCase()));
    }

    return filterCatalogTemp;
}