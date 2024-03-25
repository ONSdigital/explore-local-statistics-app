<script lang="ts">
	//@ts-nocheck
	import { afterNavigate } from '$app/navigation';
	import { Embed, Container } from '@onsvisual/svelte-components';
	import MainChartEmbed from '$lib/prototype-components/area-page/main-chart/MainChartEmbed.svelte';
	import { filterGeoGroups } from '$lib/util/geo/filterGeoGroups.js';

	export let data;

	let options;

	function reshapeData(colData) {
		const cols = Object.keys(colData);
		const rowData = [];
		for (let i = 0; i < colData[cols[0]].length; i++) {
			const row: { [key: string]: string | number } = {};
			for (const col of cols) {
				row[col] = colData[col][i];
			}
			rowData.push(row);
		}
		return rowData;
	}

	afterNavigate(() => {
		const opts = {};
		const combinedDataObject = {};
		combinedDataObject[data.indicator.code] = data.chartData;
		opts.chartData = { combinedDataObject };

		opts.selectedArea =
			data.areas.length > 0 ? { ...data.metadata.areasObject[data.areas[0]], role: 'main' } : {};
		const otherAreas = data.areas.slice(1);

		let clusters, cluster;
		if (data.areas[0] && data.related === 'similar-siblings') {
			const clustersArr = reshapeData(data.metadata.clustersLookup.data);
			clusters = {};
			clustersArr.forEach((d) => (clusters[d.areacd] = d.demographic));
			cluster = clusters[data.areas[0]];
		}

		const geoGroups = filterGeoGroups(data.indicator.inferredGeos);
		const geoGroup = geoGroups.find((t) => t.key === data?.geo) || null;
		const geoCodes =
			geoGroup && (!data.related || data.related === 'all-siblings')
				? [...new Set(data.chartData.map((d) => d.areacd))].filter((cd) =>
						geoGroup.codes.includes(cd.slice(0, 3))
					)
				: geoGroup && data.related === 'same-parent-siblings'
					? [...new Set(data.chartData.map((d) => d.areacd))].filter(
							(cd) =>
								data.metadata.areasObject[cd].parentcd ===
								data.metadata.areasObject[data.areas[0]].parentcd
						)
					: geoGroup && data.related === 'similar-siblings'
						? [...new Set(data.chartData.map((d) => d.areacd))].filter(
								(cd) => clusters[cd] === cluster
							)
						: [];
		const relatedVisible = geoGroup
			? {
					codes: geoCodes,
					areas: geoCodes.map((cd) => data.metadata.areasObject[cd]),
					group: geoGroup.key,
					label: data?.relatedLabel,
					role: 'related'
				}
			: { codes: [], areas: [] };
		opts.selectionsObject = {
			'indicator-additional-chosen': [],
			'indicator-additional-visible': [],
			'indicator-related-chosen': data.geo,
			'indicator-related-visible': relatedVisible,
			'areas-single-additional-chosen': otherAreas,
			'areas-single-additional-visible': otherAreas.map((cd) => ({
				...data.metadata.areasObject[cd],
				role: 'custom'
			})),
			'related-single-chosen': data.geo,
			'related-single-visible': relatedVisible
		};
		opts.customLookup = (() => {
			const lkp = {};
			otherAreas.forEach((d, i) => (lkp[d] = i));
			return lkp;
		})();
		opts.geoGroup = geoGroup;

		opts.timePeriodsArray = data.metadata.periodsLookupArray.filter(
			(t) =>
				t.periodGroup === data.indicator.periodGroup &&
				t.xDomainNumb >= data.indicator.minXDomainNumb &&
				t.xDomainNumb <= data.indicator.maxXDomainNumb
		);
		opts.chosenTimePeriodsArray = opts.timePeriodsArray.filter(
			(t) => t.xDomainNumb >= data.years[0] && t.xDomainNumb <= data.years[1]
		);
		opts.tableColumns = [
			{ key: 'areacd', label: 'Area code', sortable: true },
			{ key: 'areanm', label: 'Area name', sortable: true },
			...opts.chosenTimePeriodsArray.map((t) => ({
				key: t.xDomainNumb,
				label: t.label,
				sortable: true,
				numeric: true,
				dp: +data.indicator.metadata.decimalPlaces
			}))
		];

		options = opts;
	});
</script>

<Embed>
	<Container width="medium">
		{#if options}
			<MainChartEmbed
				chartType={data.chart}
				metadata={data.metadata}
				indicator={data.indicator}
				showConfidenceIntervals={data.intervals}
				chosenXDomainNumbStart={data.years[0]}
				chosenXDomainNumbEnd={data.years[1]}
				{...options}
			/>
		{/if}
	</Container>
</Embed>

<style>
	:global(.ons-field) {
		margin: 0 4px 8px 0 !important;
	}
	.content-dropdowns :global(.ons-field) {
		display: inline-block;
	}
	:global(select.ons-input--select) {
		max-width: 300px !important;
	}
	:global(select#year) {
		width: 90px !important;
	}
	h3.content-subhead {
		font-size: 18px;
		margin-bottom: 8px;
	}
	h3.content-subhead > span {
		font-size: 16px;
		font-weight: normal;
	}
</style>
