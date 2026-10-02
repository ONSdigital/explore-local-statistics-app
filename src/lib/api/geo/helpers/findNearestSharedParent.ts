import { resolve } from '$app/paths';

export async function findNearestSharedParent(areaCodes) {
	if (!areaCodes || areaCodes.length === 0) return null;
	const parentCache = new Map();

	async function getChain(code) {
		if (parentCache.has(code)) return parentCache.get(code);
		const res = await fetch(resolve(`/api/v1/geo/related/${code}/parents?includeNames=true`));
		const parents = (await res.json()) || [];
		const chain = [{ areacd: code, areanm: null }, ...parents];
		parentCache.set(code, chain);
		return chain;
	}

	const chains = await Promise.all(areaCodes.map((c) => getChain(c)));
	const sets = chains.map((chain) => new Set(chain.map((p) => p.areacd)));

	for (const candidate of chains[0]) {
		const cd = candidate.areacd;
		if (sets.every((s) => s.has(cd))) {
			for (const ch of chains) {
				const found = ch.find((x) => x.areacd === cd);
				if (found && found.areanm) return found;
			}
			return candidate;
		}
	}
	return { areacd: 'K02000001', areanm: 'United Kingdom' };
}
