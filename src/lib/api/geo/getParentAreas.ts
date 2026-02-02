import { isValidAreaCode } from '$lib/util/validationHelpers';
import { addAreaNames } from './helpers/areaCodesNames';
import readData from '$lib/data';

const geoMetadata = await readData('geo-metadata');

export default function getParentAreas(params = {}) {
	const cdUpper = (params?.code || '').toUpperCase();
	if (!isValidAreaCode(cdUpper))
		return { error: 404, message: `Area not found. "${params?.code}" is not a valid GSS code.` };

	const area = geoMetadata[cdUpper];
	if (!area) return { error: 404, message: `Parents not found for "${code}".` };

	return params.includeNames ? addAreaNames(area.parents) : area.parents;
}
