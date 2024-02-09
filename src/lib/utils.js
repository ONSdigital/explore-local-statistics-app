import { abbreviatedNamesObject, addTheArray, areaPluralObject } from '$lib/config';

export function haveCommonElements(arr1, arr2) {
	for (const element of arr1) {
		if (arr2.includes(element)) {
			return true; // Stop as soon as a common element is found
		}
	}
	return false; // No common elements found
}

export function addTheToName(name) {
	return (addTheArray.includes(name) ? 'the ' : '') + name;
}

export function formatName(name) {
	return addTheToName(name in abbreviatedNamesObject ? abbreviatedNamesObject[name] : name);
}

export function constructSameRegionAreasLabel(geogLevel, parentName) {
	let areaPlural =
		areaPluralObject[geogLevel] === 'local authorities' ? 'areas' : areaPluralObject[geogLevel];

	return ['other', 'country'].includes(geogLevel)
		? undefined
		: 'Other ' + areaPlural + ' in ' + addTheToName(parentName);
}

export function roundNumber(number, decimalPlaces) {
	let roundingFactor = Math.pow(10, decimalPlaces);

	return (Math.round(number * roundingFactor) / roundingFactor).toFixed(decimalPlaces);
}

export function addThousandsSeparator(number) {
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function generateDivisibleNumbersWithinRange(range, divisor) {
	const result = [];

	for (let num = Math.ceil(range[0] / divisor) * divisor; num <= range[1]; num += divisor) {
		result.push(num);
	}

	return result;
}

export function generateNumbersIncrementFromMaxValue(range, increment) {
	const result = [];

	for (let i = range[1]; i >= range[0]; i -= increment) {
		result.push(parseInt(i));
	}

	return result;
}

export function splitTextIntoRows(text, numRows) {
	const words = text.split(' ');
	const wordsPerRow = Math.ceil(words.length / numRows);
	const rows = [];

	for (let i = 0; i < numRows; i++) {
		const start = i * wordsPerRow;
		const end = start + wordsPerRow;
		rows.push(words.slice(start, end).join(' '));
	}

	return rows;
}

export function generateComparisonAreaGroups(
	selectedAreaCode,
	selectedAreaName,
	geogLevel,
	parentName
) {
	let sameParentAreaPlural =
		selectedAreaCode in areaPluralObject.bespoke
			? areaPluralObject.bespoke[selectedAreaCode]
			: areaPluralObject[geogLevel];

	if (['lower', 'upper'].includes(geogLevel)) {
		return [
			{
				id: 0,
				name: 'all-siblings',
				label1: 'Median average of all local authorities',
				label2: 'all other local authorities'
				//sameGeogLevelAreasCodes
			},
			{
				id: 1,
				name: 'same-parent-siblings',
				label1: 'Median average of areas in ' + formatName(parentName),
				label2: 'all other areas in ' + formatName(parentName)
				//sameRegionAreasCodes
			},
			{
				id: 2,
				name: 'similar-siblings',
				label1: 'Median average of demographically similar areas',
				label2: 'demographically similar areas'
				//similarAreasCodes
			}
		];
	} else if (geogLevel === 'region') {
		if (parentName === 'England') {
			return [
				{
					id: 0,
					name: 'all-siblings',
					label1: 'Median average of all UK regions',
					label2: 'all other UK regions'
					//sameGeogLevelAreasCodes
				},
				{
					id: 3,
					name: 'local-authority-children',
					label2: 'all local authorities in ' + formatName(selectedAreaName)
					//localAuthorityChildrenAreasCodes
				}
			];
		} else {
			return [
				{
					id: 0,
					name: 'all-siblings',
					label1: 'Median average of all UK regions',
					label2: 'all other UK regions'
					//sameGeogLevelAreasCodes
				},
				{
					id: 1,
					name: 'same-parent-siblings',
					label2: 'other UK countries'
					//sameRegionAreasCodes
				},
				{
					id: 3,
					name: 'local-authority-children',
					label2: 'all local authorities in ' + formatName(selectedAreaName)
					//localAuthorityChildrenAreasCodes
				}
			];
		}
	} else if (geogLevel === 'country') {
		return [
			{
				id: 1,
				name: 'same-parent-siblings',
				label2: 'other UK countries'
				//sameRegionAreasCodes
			},
			{
				id: 3,
				name: 'local-authority-children',
				label2: 'all local authorities in ' + formatName(selectedAreaName)
				//localAuthorityChildrenAreasCodes
			},
			{
				id: 4,
				name: 'region-children',
				label2: 'all regions in ' + formatName(selectedAreaName)
				//regionChildrenAreas
			}
		];
	}
}
