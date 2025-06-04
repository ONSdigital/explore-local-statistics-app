export function makeNeighboursArray(metadata, selectedArea) {
    const lookup = metadata.neighbourLookup[selectedArea.areacd];

    // If no neighbours found, return an empty array
    if (!lookup || !Array.isArray(lookup.demographic)) {
        return [];
    }

    const myNeighbours = lookup.demographic.slice(0, 5);

    // Create a map from areacd to object for fast lookup
    const areaMap = new Map(metadata.areasArray.map(area => [area.areacd, area]));

    const filteredAreas = myNeighbours
        .map(code => areaMap.get(code))
        .filter(area => area !== undefined);

    return filteredAreas
}