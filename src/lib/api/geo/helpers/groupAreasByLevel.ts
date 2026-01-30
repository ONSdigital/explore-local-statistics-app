import { geoLevelsAllLookup, geoLevelsNavLookup } from '$lib/config/geoLevels';
import sortAreasByLevel from './sortAreasByLevel';
import sortAreasByName from './sortAreasByName';

function mergeLevels(levels) {
	const filterKeys = ['cauth', 'utla', 'ltla'].filter((key) => key in levels);
	if (filterKeys.length < 2) return levels;

	const filteredLevels = {};
	for (const key of Object.keys(levels)) {
		if (filterKeys.indexOf(key) > 0) filteredLevels[filterKeys[0]].areas.push(...levels[key].areas);
		else filteredLevels[key] = levels[key];
	}
	return filteredLevels;
}

export default function groupAreasByLevel(areas, mode = 'default') {
	if (areas.length === 0) return [];

	const lookup = mode === 'nav' ? geoLevelsNavLookup : geoLevelsAllLookup;
	const levels = {};

	for (const area of sortAreasByLevel(areas)) {
		const cd = area.areacd.slice(0, 3);
		const level = lookup[cd];

		if (level) {
			if (!levels[level.key])
				levels[level.key] = {
					key: level.key,
					label: level.label,
					areas: []
				};
			levels[level.key].areas.push(area);
		}
	}

	return Object.values(mode === 'nav' ? mergeLevels(levels) : levels).map((l) => ({
		...l,
		areas: sortAreasByName(l.areas)
	}));
}
