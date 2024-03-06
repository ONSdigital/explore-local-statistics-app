import {
	abbreviatedNamesObject,
	addTheArray,
	areaPluralObject,
	chartConfigurations,
	colorsLookup,
	geogLevelToNameLookup
} from '$lib/config';

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
		// Use toFixed to limit the number of decimal places
		const formattedNumber = parseFloat(num.toFixed(getDecimalPlaces(divisor)));
		result.push(formattedNumber);
	}

	return result;
}

// Function to determine the number of decimal places in a number
function getDecimalPlaces(number) {
	const decimalPart = number.toString().split('.')[1];
	return decimalPart ? decimalPart.length : 0;
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

export function constructVisibleAreasArray(
	chosen,
	relatedAreasBoolean,
	parentAndRelatedAreasObject,
	areasObject
) {
	if (relatedAreasBoolean) {
		return chosen && chosen != 'none'
			? {
					group: chosen,
					label: parentAndRelatedAreasObject.groups[chosen].labels.related,
					role: 'related',
					areas: parentAndRelatedAreasObject.groups[chosen].areas,
					codes: parentAndRelatedAreasObject.groups[chosen].codes
				}
			: null;
	} else {
		return chosen
			? Array.isArray(chosen)
				? chosen.map((el) =>
						assignRole(el, relatedAreasBoolean, parentAndRelatedAreasObject, areasObject, 'custom')
					)
				: Object.keys(parentAndRelatedAreasObject.groups).includes(chosen)
					? {
							group: chosen,
							label: parentAndRelatedAreasObject.groups[chosen].labels.comparison,
							role: 'comparison'
						}
					: assignRole(
							chosen,
							relatedAreasBoolean,
							parentAndRelatedAreasObject,
							areasObject,
							'comparison'
						)
			: null;
	}
}

function assignRole(
	element,
	relatedAreasBoolean,
	parentAndRelatedAreasObject,
	areasObject,
	ifNotParent
) {
	if (element === 'none') {
		return null;
	} else {
		let role =
			parentAndRelatedAreasObject.parent && parentAndRelatedAreasObject.parent.areacd === element
				? 'parent'
				: parentAndRelatedAreasObject.country &&
					  parentAndRelatedAreasObject.country.areacd === element
					? 'country'
					: parentAndRelatedAreasObject.uk && parentAndRelatedAreasObject.uk.areacd === element
						? 'uk'
						: ifNotParent;
		return {
			...areasObject[element],
			role: role
		};
	}
}

export function updateCustomLookup(currentLookup, updatedArray) {
	let currentLookupFiltered = Object.fromEntries(
		Object.entries(currentLookup).filter(([key, el]) => el < colorsLookup.custom.length)
	);

	let updatedKeys = updatedArray.map((el) => el.areacd);

	let currentKeys = Object.keys(currentLookupFiltered);

	for (var i = 0; i < currentKeys.length; i++) {
		if (!updatedKeys.includes(currentKeys[i])) {
			delete currentLookupFiltered[currentKeys[i]];
		} else {
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

export function getGeogName(geogLevel, singular, detail = 'full') {
	let lookup = geogLevelToNameLookup[geogLevel][singular ? 'singular' : 'plural'];
	return typeof lookup === 'string' ? lookup : lookup[detail];
}

export function capitalizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function calculateLabelMidpoints(
	comparisonX,
	selectedAreaX,
	comparisonLabelWidth,
	selectedAreaLabelWidth,
	chartWidth,
	spaceForOutliers
) {
	if (
		(!comparisonLabelWidth && !selectedAreaLabelWidth) ||
		(comparisonLabelWidth === 0 && selectedAreaLabelWidth === 0)
	) {
		return { comparison: 0, selectedArea: 0 };
	}

	let boundedComparisonX = Math.min(
		Math.max(comparisonLabelWidth / 2 - spaceForOutliers / 2, comparisonX),
		chartWidth + spaceForOutliers / 2 - comparisonLabelWidth / 2
	);

	let boundedSelectedAreaX = Math.min(
		Math.max(selectedAreaLabelWidth / 2 - spaceForOutliers / 2, selectedAreaX),
		chartWidth + spaceForOutliers / 2 - selectedAreaLabelWidth / 2
	);

	if (!comparisonX) {
		return { comparison: 0, selectedArea: boundedSelectedAreaX };
	} else if (!selectedAreaX) {
		return { comparison: boundedComparisonX, selectedArea: 0 };
	} else if (
		(boundedComparisonX - comparisonLabelWidth / 2 <=
			boundedSelectedAreaX + selectedAreaLabelWidth / 2 &&
			boundedComparisonX + comparisonLabelWidth / 2 >=
				boundedSelectedAreaX - selectedAreaLabelWidth / 2) ||
		(boundedSelectedAreaX - selectedAreaLabelWidth / 2 <=
			boundedComparisonX + comparisonLabelWidth / 2 &&
			boundedSelectedAreaX + selectedAreaLabelWidth / 2 >=
				boundedComparisonX - comparisonLabelWidth / 2)
	) {
		if (
			selectedAreaX <= comparisonX &&
			boundedComparisonX - comparisonLabelWidth / 2 - selectedAreaLabelWidth < -spaceForOutliers / 2
		) {
			return {
				comparison: selectedAreaLabelWidth - spaceForOutliers / 2 + comparisonLabelWidth / 2,
				selectedArea: selectedAreaLabelWidth / 2 - spaceForOutliers / 2
			};
		} else if (
			selectedAreaX >= comparisonX &&
			boundedComparisonX + comparisonLabelWidth / 2 + selectedAreaLabelWidth >
				chartWidth + spaceForOutliers / 2
		) {
			return {
				comparison:
					chartWidth + spaceForOutliers / 2 - selectedAreaLabelWidth - comparisonLabelWidth / 2,
				selectedArea: chartWidth + spaceForOutliers / 2 - selectedAreaLabelWidth / 2
			};
		} else {
			if (boundedSelectedAreaX < boundedComparisonX) {
				return {
					comparison: boundedComparisonX,
					selectedArea: boundedComparisonX - comparisonLabelWidth / 2 - selectedAreaLabelWidth / 2
				};
			} else {
				return {
					comparison: boundedComparisonX,
					selectedArea: boundedComparisonX + comparisonLabelWidth / 2 + selectedAreaLabelWidth / 2
				};
			}
		}
	}

	return { comparison: boundedComparisonX, selectedArea: boundedSelectedAreaX };
}

export function calculateBackgroundCirclesRadius(value, breakpoints) {
	let result;
	for (const breakpoint in breakpoints) {
		if (value < breakpoint) {
			result = breakpoints[breakpoint];
			break;
		}
	}

	// If no breakpoint is found, use the default output (if provided)
	if (result === undefined && 'default' in breakpoints) {
		result = breakpoints['default'];
	}

	return result;
}
