import { geoLevelsLookup } from '$lib/config/geoLevels';
import getChildAreas from './getChildAreas';
import getParentAreas from './getParentAreas';
import getSiblingAreas from './getSiblingAreas';
import getSimilarAreas from './getSimilarAreas';
import { isValidAreaCode } from '$lib/util/validationHelpers';
import readData from '$lib/data';

const geoMetadata = await readData('geo-metadata');

export default function getRelatedAreas(params = {}) {
	const cdUpper = (params?.code || '').toUpperCase();
	if (!isValidAreaCode(cdUpper))
		return { error: 404, message: `Area not found. "${params?.code}" is not a valid GSS code.` };

	const area = geoMetadata[cdUpper];
	if (!area) return { error: 404, message: `Related areas not found for "${params?.code}".` };

	const geoLevel = geoLevelsLookup[cdUpper.slice(0, 3)].key;
	const parentLevel = ['ctry', 'rgn'].includes(geoLevel) ? 'ctry' : 'rgn';

	const parents = getParentAreas({ code: cdUpper, includeNames: params.includeNames });
	const children = getChildAreas({ code: cdUpper, includeNames: params.includeNames });
	const siblings = getSiblingAreas({
		code: cdUpper,
		includeNames: params.includeNames,
		parentLevel
	});
	const similar = getSimilarAreas({ code: cdUpper, includeNames: params.includeNames });

	for (const obj of [parents, children, siblings, similar]) {
		if (obj?.error) return obj;
	}
	return { parents, children, siblings, similar };
}
