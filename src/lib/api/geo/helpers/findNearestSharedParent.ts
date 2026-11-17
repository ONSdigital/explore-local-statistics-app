import { resolve } from '$app/paths';

export async function findNearestSharedParent(areaCodes) {
	if (!areaCodes || areaCodes.length === 0) return null;

	const uniqueCodes = [...new Set(areaCodes)];

	async function getParents(code) {
		const res = await fetch(resolve(`/api/v1/geo/related/${code}/parents?includeNames=true`));
		if (!res.ok) return [];
		return (await res.json()) || [];
	}

	const chains = await Promise.all(uniqueCodes.map(getParents));
	const sets = chains.map((chain) => new Set(chain.map((p) => p.areacd)));

	for (const candidate of chains[0]) {
		if (sets.every((s) => s.has(candidate.areacd))) return candidate;
	}

	return { areacd: 'K02000001', areanm: 'United Kingdom' };
}
