//settings for the select an indicator charts
export const selectAnIndicatorChartSettings = {
	chartOptions: [
		{ id: 'line', label: 'Time series', multiYear: 'Yes' },
		{ id: 'bar', label: 'Bar chart', multiYear: 'No' },
		{ id: 'map', label: 'Map', multiYear: 'No' }
	],
	maximumAdditionalAreas: 10,
	lineChart: {
		height: 500,
		padding: { top: 10, right: 0, bottom: 30, left: 10 },
		defaultMadRange: 1,
		markerRadius: { first: 4.5, last: 5, other: 4.5 }
	}
};

//settings for the beeswarm charts
export const indicatorRowBeeswarmChartSettings = {
	height: 80,
	padding: { top: 45, right: 0, bottom: 5, left: 0 },
	spaceForOutliers: 40,
	defaultMadRange: 3,
	geographyLevelWhereComparisonTextIsProvided: ['upper', 'lower'],
	minimumAreasForComparisonTextToBeProvided: 10,
	primaryCircleRadius: 8,
	backgroundCircleRadius: { 20: 6.4, 50: 6, 100: 5.5, 200: 5, default: 5 }
};

//settings for the indicator-row beeswarm charts
export const indicatorRowLineChartSettings = {
	height: 80,
	padding: { top: 5, right: 0, bottom: 25, left: 10 },
	defaultMadRange: 1,
	markerRadius: { first: 3.5, last: 5, other: 3.25 }
};

// this object defines our pre-selections for comparison areas and groups
// for example, areas-rows-comparison refers to our comparison measure (e.g. a median value or an area) for the indicator rows section, if this is set for example to 'all-siblings' for our selected area's geography level then the initial comparison on page load will be 'Median value of all sibling areas'
export const preSelectedComparisonAreasAndGroups = {
	'areas-rows-comparison-chosen': {
		lower: 'all-siblings',
		upper: 'all-siblings',
		region: 'E92000001',
		country: 'K02000001',
		combined: 'all-siblings'
	},
	'related-rows-chosen': {
		lower: 'all-siblings',
		upper: 'all-siblings',
		region: 'all-siblings',
		country: 'all-siblings',
		combined: 'all-siblings'
	},
	'related-single-chosen': {
		lower: 'all-siblings',
		upper: 'all-siblings',
		region: 'all-siblings',
		country: 'all-siblings',
		combined: 'all-siblings'
	}
};

// this object determines which area groups will be selectable based on the geography level of the selected area
// for example, if the selected area is a LTLA - whether the user can select to view the median value of all LTLAs is based on whether changeAreasIncludeExcludeObject.lower.median['all-siblings'] is true or false, whether the user can selected all LTLAs as the comparison group of areas on the beeswarms is based on whether changeAreasIncludeExcludeObject.lower.related['all-siblings'] is true or false

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
	combined: {
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

// this determines the number of additional areas that can be shown on the indicator rows sticky key before they are replaced by the 'show Y more areas' note
export const maxAdditionalAreasOnKey = 1;
