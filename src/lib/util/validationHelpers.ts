import { Temporal } from 'temporal-polyfill';
import { geoLevels } from '$lib/config/geoLevels';
import { dataFormats, geoFormats, chartTypes } from '$lib/api/config';

export function isValidAreaCode(code: string): boolean {
	return !!code.match(/^[EKNSW]\d{8}$/);
}

export function isValidAreaTypeCode(code: string): boolean {
	return !!code.match(/^[EKNSW]\d{2}$/);
}

export function isValidGeoLevel(code: string): boolean {
	return code in geoLevels;
}

export function isValidPostcode(code: string): boolean {
	return !!code.match(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/);
}

export function isValidPartialPostcode(code: string): boolean {
	return !!(code.match(/^[A-Z0-9\s]*$/) && code.match(/^[A-Z]{1,2}\d{0,2}/));
}

export function isValidLngLat(lng: number, lat: number): boolean {
	return Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
}

export function isValidYear(str: string): boolean {
	return !!`${str}`.match(/^\d{4}$/);
}

// Shape check first (cheap, and gives a clean false for non-matching input rather than a thrown
// error), then a real calendar-validity check via Temporal - a string can match the YYYY-MM or
// YYYY-MM-DD shape while naming a month/day that doesn't exist (eg. "2020-13", "2020-02-30").
// Downstream date parsing (`dataFilters.ts`'s `toPlainDate`) assumes anything that passes these
// checks is a real, parseable date and doesn't itself guard against `Temporal.PlainDate.from`
// throwing - so these need to reject calendar-invalid input, not just wrong-shaped input.
export function isValidMonth(str: string): boolean {
	if (!`${str}`.match(/^\d{4}-\d{2}$/)) return false;
	try {
		Temporal.PlainYearMonth.from(str);
		return true;
	} catch {
		return false;
	}
}

export function isValidDay(str: string): boolean {
	if (!`${str}`.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
	try {
		Temporal.PlainDate.from(str);
		return true;
	} catch {
		return false;
	}
}

export function isValidDate(str: string): boolean {
	return (
		isValidDay(str) || isValidMonth(str) || isValidYear(str) || ['earliest', 'latest'].includes(str)
	);
}

export function isValidDataFormat(str: string): boolean {
	return dataFormats.includes(str);
}

export function isValidGeoFormat(str: string): boolean {
	return geoFormats.includes(str);
}

export function isValidChartType(str: string): boolean {
	return chartTypes.includes(str);
}
