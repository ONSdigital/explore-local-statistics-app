/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { feature } from 'topojson-client';

export function makeGeoJSON(topojson, layer) {
	return feature(topojson, layer);
}
