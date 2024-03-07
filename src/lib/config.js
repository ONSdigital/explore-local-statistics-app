export const countries = [
	{ name: 'England', code: 'E92000001' },
	{ name: 'Northern Ireland', code: 'N92000002' },
	{ name: 'Scotland', code: 'S92000003' },
	{ name: 'Wales', code: 'W92000004' }
];

export const regions = [
	{ name: 'North East', code: 'E12000001' },
	{ name: 'North West', code: 'E12000002' },
	{ name: 'Yorkshire and The Humber', code: 'E12000003' },
	{ name: 'East Midlands', code: 'E12000004' },
	{ name: 'West Midlands', code: 'E12000005' },
	{ name: 'East of England', code: 'E12000006' },
	{ name: 'London', code: 'E12000007' },
	{ name: 'South East', code: 'E12000008' },
	{ name: 'South West', code: 'E12000009' }
];

export let mainChartOptionsArray = [
	{ id: 0, label: 'Time series', multiYear: 'Yes' },
	{ id: 1, label: 'Bar chart', multiYear: 'No' },
	{ id: 2, label: 'Beeswarm', multiYear: 'No' },
	{ id: 3, label: 'Map', multiYear: 'No' },
	{ id: 4, label: 'Table', multiYear: 'Either' }
];

export let addTheArray = [
	'North East',
	'North West',
	'South West',
	'South East',
	'West Midlands',
	'East Midlands',
	'East of England',
	'UK',
	'United Kingdom'
];

export let areaPluralObject = {
	bespoke: {
		N92000002: 'countries',
		S92000003: 'countries',
		W92000004: 'countries'
	},
	lower: 'local authorities',
	upper: 'local authorities',
	region: 'regions',
	country: 'countries'
};

export let abbreviatedNamesObject = {
	'United Kingdom': 'UK'
};

export const colorsLookup = {
	main: { color: '#003C57', contrast: 'white' },
	parent: { color: '#F66068', contrast: 'white' },
	country: { color: '#118C7B', contrast: 'white' },
	uk: { color: '#00A3A6', contrast: 'white' },
	custom: [
		{ color: '#206095', contrast: 'white' },
		{ color: '#a8bd3a', contrast: '#222' },
		{ color: '#871a5b', contrast: 'white' },
		{ color: '#27a0cc', contrast: '#222' }
	],
	customExceedThreshold: { color: 'grey', contrast: 'white' },
	selected: { color: '#F39431', contrast: 'white' },
	comparison: { color: '#746CB1', contrast: 'white' },
	related: { color: '#b0b0b0', contrast: '#222' }
};

export const madRangeLookup = {
	default: { 'line-chart': 1, 'beeswarm-row': 3, 'line-chart-row': 1 },
	'4g-coverage': { 'line-chart': 'minMax', 'beeswarm-row': 'minMax' }
};

export const chartConfigurations = {
	lineChart: { markerRadius: { first: 4, last: 5, other: 3.5 } },
	lineChartRow: { markerRadius: { first: 3.5, last: 5, other: 3.25 } },
	beeswarmRow: {
		backgroundRadius: { 20: 6.4, 50: 6, 100: 5.5, 200: 5, default: 5 },
		primaryRadius: 8
	}
};

export const geogLevelToNameLookup = {
	lower: {
		singular: { short: 'LTLA', full: 'lower tier local authority', simplified: 'local authority' },
		plural: {
			short: 'LTLAs',
			full: 'lower tier local authorities',
			simplified: 'local authorities'
		}
	},
	upper: {
		singular: { short: 'UTLA', full: 'upper tier local authority', simplified: 'local authority' },
		plural: {
			short: 'UTLAs',
			full: 'upper tier local authorities',
			simplified: 'local authorities'
		}
	},
	region: { singular: 'region', plural: 'regions' },
	country: { singular: 'country', plural: 'countries' }
};

export const changeAreasIncludeExcludeObject = {
	lower: {
		median: {
			'all-siblings': true,
			'same-parent-siblings': true,
			'similar-siblings': true,
			'region-children': false,
			'upper-tier-local-authority-children': false,
			'lower-tier-local-authority-children': false
		},
		related: {
			'all-siblings': true,
			'same-parent-siblings': true,
			'similar-siblings': true,
			'region-children': false,
			'upper-tier-local-authority-children': false,
			'lower-tier-local-authority-children': false
		}
	},
	upper: {
		median: {
			'all-siblings': true,
			'same-parent-siblings': true,
			'similar-siblings': false,
			'region-children': false,
			'upper-tier-local-authority-children': false,
			'lower-tier-local-authority-children': false
		},
		related: {
			'all-siblings': true,
			'same-parent-siblings': true,
			'similar-siblings': false,
			'region-children': false,
			'upper-tier-local-authority-children': false,
			'lower-tier-local-authority-children': false
		}
	},
	region: {
		median: {
			'all-siblings': false,
			'same-parent-siblings': false,
			'similar-siblings': false,
			'region-children': false,
			'upper-tier-local-authority-children': false,
			'lower-tier-local-authority-children': false
		},
		related: {
			'all-siblings': true,
			'same-parent-siblings': false,
			'similar-siblings': false,
			'region-children': false,
			'upper-tier-local-authority-children': true,
			'lower-tier-local-authority-children': true
		}
	},
	country: {
		median: {
			'all-siblings': false,
			'same-parent-siblings': false,
			'similar-siblings': false,
			'region-children': false,
			'upper-tier-local-authority-children': false,
			'lower-tier-local-authority-children': false
		},
		related: {
			'all-siblings': true,
			'same-parent-siblings': false,
			'similar-siblings': false,
			'region-children': true,
			'upper-tier-local-authority-children': true,
			'lower-tier-local-authority-children': true
		}
	}
};
