export function makeNeighboursArray(metadata, selectedArea) {

    const myNeighbours = metadata.neighbourLookup[selectedArea.areacd].demographic

    // Create a map from areacd to object for fast lookup
    const areaMap = new Map(metadata.areasArray.map(area => [area.areacd, area]));

    const filteredAreas = myNeighbours
        .map(code => areaMap.get(code))
        .filter(area => area !== undefined);

    return filteredAreas
}