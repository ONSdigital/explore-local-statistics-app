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
	{ id: 2, label: 'Distribution', multiYear: 'No' },
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
	'United Kingdom'
];

export let areaPluralObject = {
	lower: 'areas',
	upper: 'areas',
	region: 'regions',
	country: 'countries',
	other: null
};

export const colorsLookup = {
	main: { color: '#003C57', contrast: 'white' },
	parent: { color: '#746CB1', contrast: 'white' },
	country: { color: '#118C7B', contrast: 'white' },
	uk: { color: '#00A3A6', contrast: 'white' },
	sameRegion: { color: '#d4d4d4', contrast: '#222' },
	similar: { color: '#b0b0b0', contrast: '#222' },
	custom1: { color: '#206095', contrast: 'white' },
	custom2: { color: '#a8bd3a', contrast: '#222' },
	custom3: { color: '#871a5b', contrast: 'white' },
	custom4: { color: '#27a0cc', contrast: '#222' },
	selected: { color: '#F39431', contrast: 'white' },
	median: { color: '#F66068', contrast: 'white' }
};

export const madRangeLookup = {
	default: 1,
	'4g-coverage': 'minMax',
	'gross-median-weekly-pay': 'minMax'
};

export const chartConfigurations = {
	lineChart: { markerRadius: { first: 4, last: 5, other: 3.5 } }
};
