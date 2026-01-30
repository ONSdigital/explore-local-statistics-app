import { areaMetadataBase } from '../config';
import { isValidAreaCode } from '$lib/util/validationHelpers';
import groupAreasByLevel from './helpers/groupAreasByLevel';

export default async function getAreaByCode(code) {
	code = code?.toUpperCase();
	if (!isValidAreaCode(code))
		return { error: 404, message: `Area not found. "${code}" is not a valid GSS code.` };

	try {
		const url = `${areaMetadataBase}/${code.slice(0, 3)}/${code}.json`;
		const json = await (await fetch(url)).json();
		json.properties.children = groupAreasByLevel(json.properties.children, 'nav');
		return json;
	} catch {
		return { error: 404, message: `Area not found. Could not retreive metadata for "${code}".` };
	}
}
