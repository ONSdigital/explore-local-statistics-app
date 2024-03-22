<script lang="ts">
	//@ts-nocheck
	import { afterNavigate } from '$app/navigation';
	import { Embed, Container } from '@onsvisual/svelte-components';
	import MainChartEmbed from '$lib/prototype-components/area-page/main-chart/MainChartEmbed.svelte';
	import { filterGeoGroups } from '$lib/util/geo/filterGeoGroups.js';

	export let data;

	let options;

	afterNavigate(() => {
		const opts = {};
		const combinedDataObject = {};
		combinedDataObject[data.indicator.code] = data.chartData;
		opts.chartData = { combinedDataObject };

		opts.selectedArea =
			data.areas.length > 0 ? { ...data.metadata.areasObject[data.areas[0]], role: 'main' } : {};
		const otherAreas = data.areas.slice(1);

		const geoGroups = filterGeoGroups(data.indicator.inferredGeos);
		const geoGroup = data.geo
			? geoGroups.find((t) => t.key === data.geo)
			: geoGroups[geoGroups.length - 1];
		const geoCodes = geoGroup
			? [...new Set(data.chartData.map((d) => d.areacd))].filter((d) =>
					geoGroup.codes.includes(d.slice(0, 3))
				)
			: [];
		const relatedVisible = geoGroup
			? {
					codes: geoCodes,
					areas: geoCodes.map((cd) => data.metadata.areasObject[cd]),
					group: geoGroup.key,
					label: geoGroup.label,
					role: 'related'
				}
			: null;
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

		options = opts;
		console.log(options);
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
