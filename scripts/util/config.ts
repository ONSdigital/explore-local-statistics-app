export const DATA_DIR = './scripts/raw-data';

export const skipDatasets = ['population-under-devolution-deal-in-england'];

const cols = {
	AREACD: {
		name: 'areacd',
		titles: 'Area code',
		datatype: 'string',
		type: 'dimension',
		role: 'geo'
	},
	AREANM: {
		titles: 'Area name',
		datatype: 'string'
	},
	Geography: {
		titles: 'Geography type',
		datatype: 'string'
	},
	'Variable Name': {
		titles: 'Variable name',
		datatype: 'string'
	},
	Indicator: {
		name: 'indicator',
		titles: 'Indicator',
		datatype: 'string',
		type: 'indicator'
	},
	Period: {
		name: 'period',
		titles: 'Time period',
		datatype: 'date',
		type: 'dimension',
		role: 'time'
	},
	Observation: {
		name: 'value',
		titles: 'Observation value',
		datatype: 'number',
		type: 'measure'
	},
	Measure: {
		name: 'measure',
		titles: 'Measure',
		datatype: 'string',
		type: 'metadata'
	},
	Unit: {
		name: 'unit',
		titles: 'Unit',
		datatype: 'string',
		type: 'metadata'
	},
	'Lower Confidence Interval (95%)': {
		name: 'lci_95',
		titles: 'Lower confidence interval (95%)',
		datatype: 'number',
		type: 'measure'
	},
	'Upper Confidence Interval (95%)': {
		name: 'uci_95',
		titles: 'Upper confidence interval (95%)',
		datatype: 'number',
		type: 'measure'
	},
	'Observation Status': {
		name: 'status',
		titles: 'Observation status',
		datatype: 'string',
		type: 'status'
	},
	Polarity: {
		name: 'polarity',
		titles: 'Polarity',
		datatype: 'number',
		type: 'metadata'
	},
	Notes: {
		titles: 'Notes',
		datatype: 'string'
	},
	Mission: {
		titles: 'Mission',
		datatype: 'string'
	},
	Category: {
		titles: 'Category',
		datatype: 'string'
	},
	Numerator: {
		titles: 'Numerator',
		datatype: 'number'
	},
	Denominator: {
		titles: 'Denominator',
		datatype: 'number'
	},
	'Age band': {
		name: 'age',
		titles: 'Age band',
		datatype: 'string',
		type: 'dimension'
	},
	Sex: {
		name: 'sex',
		titles: 'Sex',
		datatype: 'string',
		type: 'dimension'
	}
};

const duplicateCols = {
	Count: 'Numerator',
	indicator: 'Indicator',
	areacd: 'AREACD',
	areanm: 'AREANM',
	geography: 'Geography',
	observation: 'Observation',
	unit: 'Unit',
	measure: 'Measure',
	period: 'Period',
	lower_confidence_interval_95: 'Lower Confidence Interval (95%)',
	upper_confidence_interval_95: 'Upper Confidence Interval (95%)',
	Observation_status: 'Observation Status',
	observation_status: 'Observation Status',
	status: 'Observation Status',
	Lower_confidence_interval_95: 'Lower Confidence Interval (95%)',
	Upper_confidence_interval_95: 'Upper Confidence Interval (95%)',
	lci_95: 'Lower Confidence Interval (95%)',
	uci_95: 'Upper Confidence Interval (95%)',
	numerator: 'Numerator',
	denominator: 'Denominator',
	notes: 'Notes',
	Total: 'Denominator',
	Value: 'Observation',
	value: 'Observation',
	age_band: 'Age band',
	sex: 'Sex',
	'mode-of-travel': 'Indicator'
};

export const colLookup = (() => {
	const lookup = { ...cols };
	for (const col of Object.entries(duplicateCols)) lookup[col[0]] = lookup[col[1]];
	return lookup;
})();
