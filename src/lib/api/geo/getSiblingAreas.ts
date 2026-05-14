import { geoLevels, geoLevelsLookup } from '$lib/config/geoLevels';
import getChildAreas from './getChildAreas';
import { isValidAreaCode } from '$lib/util/validationHelpers';
import { codeToArea } from './helpers/areaCodesNames';
import readData from '$lib/data';

const geoMetadata = await readData('geo-metadata');

export default function getSiblingAreas(params = {}) {
	const cdUpper = (params?.code || '').toUpperCase();
	if (!isValidAreaCode(cdUpper))
		return { error: 404, message: `Area not found. "${params?.code}" is not a valid GSS code.` };

	const area = geoMetadata[cdUpper];
	if (!area) return { error: 404, message: `Siblings not found for "${params.code}".` };

	const geoLevel = geoLevelsLookup[cdUpper.slice(0, 3)].key;
	if (params.parentLevel && !geoLevels[params.parentLevel])
		return {
			error: 404,
			message: `Parent level "${params.parentLevel}" not found.`
		};
	const parentCode = params.parentLevel
		? area.parents.find((p) => geoLevels[params.parentLevel].codes.includes(p.slice(0, 3)))
		: area.parents[0];

	return parentCode
		? {
				parent: params.includeNames ? codeToArea(parentCode) : parentCode,
				siblings: getChildAreas({ code: parentCode, geoLevel, includeNames: params.includeNames })
			}
		: {};
}
