import { geoLevels } from '$lib/config/geoLevels';
import { isValidAreaCode } from '$lib/util/validationHelpers';
import { addAreaNames } from './helpers/areaCodesNames';
import readData from '$lib/data';

const geoMetadata = await readData('geo-metadata');
const geoArray = Object.values(geoMetadata);

export default function getChildAreas(params = {}) {
	const cdUpper = (params?.code || '').toUpperCase();
	if (!isValidAreaCode(cdUpper))
		return { error: 404, message: `Area not found. "${params?.code}" is not a valid GSS code.` };

	const area = geoMetadata[cdUpper];
	if (!area) return { error: 404, message: `Children not found for "${params.code}".` };

	const geoLevel = geoLevels[params.geoLevel];
	if (!geoLevel) return params.includeNames ? addAreaNames(area.children) : area.children;

	const children = geoArray
		.filter((g) => geoLevel.codes.includes(g.areacd.slice(0, 3)) && g.parents?.includes?.(cdUpper))
		.map((g) => g.areacd);

	return params.includeNames ? addAreaNames(children) : children;
}
