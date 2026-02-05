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

export function isValidMonth(str: string): boolean {
	return !!`${str}`.match(/^\d{4}-\d{2}$/);
}

export function isValidDay(str: string): boolean {
	return !!`${str}`.match(/^\d{4}-\d{2}-\d{2}$/);
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
