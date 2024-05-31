import { colorsLookup } from '$lib/config';

export function updateCustomLookup(currentLookup, updatedArray) {
	let currentLookupFiltered = Object.fromEntries(
		Object.entries(currentLookup).filter(([key, el]) => el < colorsLookup.custom.length)
	);

	let updatedKeys = updatedArray.map((el) => el.areacd);

	let currentKeys = Object.keys(currentLookupFiltered);

	for (var i = 0; i < currentKeys.length; i++) {
		if (!updatedKeys.includes(currentKeys[i])) {
			delete currentLookupFiltered[currentKeys[i]];
		}
	}

	let newKeys = updatedKeys.filter((el) => !currentKeys.includes(el));

	let takenIndexes = currentKeys.map((el) => currentLookupFiltered[el]);

	for (var i = 0; i < newKeys.length; i++) {
		for (var j = 0; true; j++) {
			if (!takenIndexes.includes(j)) {
				currentLookupFiltered[newKeys[i]] = j;
				takenIndexes = [...takenIndexes, j];
				break;
			}
		}
	}

	return currentLookupFiltered;
}
