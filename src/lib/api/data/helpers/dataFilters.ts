import { Temporal } from 'temporal-polyfill';
import { geoLevels } from '$lib/config/geoLevels';
import getChildAreas from '$lib/api/geo/getChildAreas';
import hasObservation from './hasObservation';
import { isValidMonth, isValidYear, isValidAreaCode } from '$lib/util/validationHelpers';
import readData from '$lib/data';

const areasClusters = await readData('areas-clusters');

export function makeFilter(param) {
	const set = new Set([param].flat());
	return (d) => set.has(d[0]);
}

export function makeGeoFilter(geo, geoExtent, geoCluster) {
	const codes = new Set();
	const types = new Set();
	for (const g of [geo].flat()) {
		if (geoLevels[g] && geoCluster === 'all') {
			if (isValidAreaCode(geoExtent)) {
				const children = getChildAreas({ code: geoExtent, geoLevel: g, includeNames: false });
				for (const child of children) codes.add(child);
			} else {
				for (const code of geoLevels[g].codes) types.add(code);
			}
		} else if (isValidAreaCode(g) && !types.has(g.slice(0, 3))) codes.add(g);
	}
	if (geoCluster) {
		const [grouping, cluster] = geoCluster.split('_');
		const cds = areasClusters.clusters?.[grouping]?.[cluster];
		if (Array.isArray(cds)) {
			for (const cd of cds) codes.add(cd);
		}
	}
	return codes.size > 0 && types.size > 0
		? (d) => codes.has(d[0]) || types.has(d[0].slice(0, 3))
		: types.size > 0
			? (d) => types.has(d[0].slice(0, 3))
			: codes.size > 0
				? (d) => codes.has(d[0])
				: () => false;
}

function toPlainDate(str, upperBound = false) {
	if (isValidYear(str)) return Temporal.PlainDate.from(`${str}-${upperBound ? '12-31' : '01-01'}`);
	if (isValidMonth(str))
		return Temporal.PlainDate.from(`${str}-01`).add({ months: 1 }).subtract({ days: 1 });
	return Temporal.PlainDate.from(str.slice(0, 10));
}

function periodToDateRange(period) {
	const parts = period.split('/');
	const start = Temporal.PlainDate.from(parts[0]);
	if (!parts[1]) return [start];

	const offset = Temporal.Duration.from(parts[1]);
	return [start, start.add(offset).subtract({ days: 1 })];
}

// Get a single time period
export function getTime(values, params = {}) {
	if (params.time === 'latest') return [values[values.length - 1]];
	if (params.time === 'earliest') return [values[0]];

	const periods = values.map((v) => ({ value: v, period: periodToDateRange(v[0]) }));
	const nearest = params.nearest || 'none';
	const periodIsRange = periods[0].period.length > 1; // Time periods have a duration component
	const dateIsExact = params.time.length === 10; // Requested date is to nearest day
	const date =
		periodIsRange || dateIsExact
			? toPlainDate(params.time, true)
			: [toPlainDate(params.time, false), toPlainDate(params.time, true)];

	let match;
	if (periodIsRange)
		match = periods.findLast(
			(p) =>
				Temporal.PlainDate.compare(date, p.period[0]) !== -1 &&
				Temporal.PlainDate.compare(date, p.period[1]) !== 1
		);
	else if (dateIsExact)
		match = periods.findLast((p) => Temporal.PlainDate.compare(date, p.period[0]) === 0);
	else
		match = periods.findLast(
			(p) =>
				Temporal.PlainDate.compare(p.period[0], date[0]) !== -1 &&
				Temporal.PlainDate.compare(p.period[0], date[1]) !== 1
		);
	if (match) return [match.value];

	if (
		Temporal.PlainDate.compare(date?.[1] || date, periods.slice(-1)[0].period.slice(-1)[0]) === 1 &&
		['latest', 'any'].includes(nearest)
	)
		return [periods[periods.length - 1].value];
	if (
		Temporal.PlainDate.compare(date?.[0] || date, periods[0].period[0]) === -1 &&
		['earliest', 'any'].includes(nearest)
	)
		return [periods[0].value];
	return [];
}

// Get a range of time periods
export function getTimeRange(values, params = {}) {
	const periods = values.map((v) => ({ value: v, period: periodToDateRange(v[0]) }));
	const range = [
		toPlainDate(params.time[0] === 'earliest' ? values[0][0] : params.time[0]),
		toPlainDate(params.time[1] === 'latest' ? values[values.length - 1][0] : params.time[1], true)
	];

	let firstIndex = periods.findIndex(
		(p) => Temporal.PlainDate.compare(p.period[0], range[0]) !== -1
	);
	let lastIndex = periods.findLastIndex(
		(p) => Temporal.PlainDate.compare(p.period[p.period.length - 1], range[1]) !== 1
	);
	if ((firstIndex === lastIndex) === -1) return [];
	if (firstIndex === -1) firstIndex = 0;
	if (lastIndex === -1) lastIndex = periods.length - 1;

	return periods.slice(firstIndex, lastIndex + 1).map((p) => p.value);
}

// Filter time dimension based on time parameters
export function filterTime(values, params = {}) {
	if (params.time === 'all' || values.length === 0) return values;

	const range = [params.time].flat();
	if (range.length === 1) return getTime(values, params);

	return getTimeRange(values, params);
}

export function filterTimeForGeo(ds, values, geo) {
	if (geo in geoLevels) return values;
	return values.filter((val) =>
		hasObservation(ds, { areacd: geo, period: val[0], measure: 'value' })
	);
}
