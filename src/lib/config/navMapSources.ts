const notInTypes = (cds) => cds.map((cd) => ['!', ['in', cd, ['get', 'areacd']]]);

export default [
	{ id: 'uk', type: 'geojson' },
	{ id: 'ctry', type: 'geojson' },
	{ id: 'rgn', type: 'geojson' },
	{
		id: 'la',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2025/authorities-all/{z}/{x}/{y}.pbf',
		layer: 'boundaries',
		minzoom: 4,
		layers: [
			{
				key: 'cauth',
				filter: ['all', ...notInTypes(['E07', 'E08']), ['!', ['==', ['get', 'cauth'], 'true']]]
			},
			{
				key: 'utla',
				filter: ['all', ...notInTypes(['E07', 'E47'])]
			},
			{
				key: 'ltla',
				filter: ['all', ...notInTypes(['E10', 'E47'])]
			}
		]
	},
	{
		id: 'wpc',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2024/wpc/v1/boundaries/{z}/{x}/{y}.pbf',
		layer: 'boundaries',
		minzoom: 4
	},
	{
		id: 'sener',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2022/sen/v1/boundaries/{z}/{x}/{y}.pbf',
		layer: 'region'
	},
	{
		id: 'senc',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2022/sen/v1/boundaries/{z}/{x}/{y}.pbf',
		layer: 'constituency'
	},
	{
		id: 'wd',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2025/wd/{z}/{x}/{y}.pbf',
		layer: 'boundaries',
		minzoom: 6
	},
	{
		id: 'par',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2022/par/v1/boundaries/{z}/{x}/{y}.pbf',
		layer: 'par',
		minzoom: 6
	},
	{
		id: 'msoa',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2021/msoa/v2/boundaries/{z}/{x}/{y}.pbf',
		layer: 'msoa',
		minzoom: 6
	},
	{
		id: 'lsoa',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2021/lsoa/v2/boundaries/{z}/{x}/{y}.pbf',
		layer: 'lsoa',
		minzoom: 7
	},
	{
		id: 'oa',
		type: 'vector',
		url: 'https://cdn.ons.gov.uk/maptiles/administrative/2021/oa/v2/boundaries/{z}/{x}/{y}.pbf',
		layer: 'oa',
		minzoom: 8
	}
];
