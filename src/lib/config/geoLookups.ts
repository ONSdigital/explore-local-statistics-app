export const oldGeoCodesLookup = {
	E06000048: 'E06000057',
	E08000020: 'E08000037',
	E07000097: 'E07000242',
	E07000100: 'E07000240',
	E07000101: 'E07000243',
	E07000104: 'E07000241'
};

export const countryLookup = {
	E92000001: 'England',
	N92000002: 'Northern Ireland',
	S92000003: 'Scotland',
	W92000004: 'Wales'
};

export const countryLetterLookup = Object.fromEntries(
	Object.keys(countryLookup).map((key) => [key[0], key])
);

export const regionLookup = {
	E12000001: 'North East',
	E12000002: 'North West',
	E12000003: 'Yorkshire and The Humber',
	E12000004: 'East Midlands',
	E12000005: 'West Midlands',
	E12000006: 'East of England',
	E12000007: 'London',
	E12000008: 'South East',
	E12000009: 'South West',
	...countryLookup
};

export const regionReverseLookup = (() => {
	const lkp: { [key: string]: string } = {};
	for (const key of Object.keys(regionLookup)) lkp[regionLookup[key]] = key;
	return lkp;
})();
