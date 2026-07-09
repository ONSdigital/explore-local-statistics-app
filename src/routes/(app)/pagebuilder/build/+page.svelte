<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { resolve } from '$app/paths';
	import {
		Hero,
		NavSections,
		Grid,
		NavSection,
		List,
		Li,
		Icon
	} from '@onsvisual/svelte-components';
	import { capitalise } from '@onsvisual/robo-utils';
	import { makePeriodFormatter, downloadEvent } from '$lib/utils';
	import { getChartTypesForIndicator } from '$lib/components/charts/chartHelpers';
	import AreasLegend from '$lib/components/modals/AreasLegend.svelte';
	import AreasModal from '$lib/components/modals/AreasModal.svelte';
	import OptionsModal from '$lib/components/modals/OptionsModal.svelte';
	import IndicatorChart from '$lib/components/charts/IndicatorChart.svelte';

	let { data } = $props();
	import { pageBuilderData } from '$lib/stores/buildstore.js';
	import { page } from '$app/state';
	// let primaryGeographies = pageBuilderData.primaryGeographies;
	// let comparisonGeographies = pageBuilderData.comparisonGeographies;
	// let selectedIndicators = pageBuilderData.selectedIndicators;
	let primaryGeographies = [
		{ areacd: 'E06000001', areanm: 'Hartlepool' },
		{ areacd: 'E06000002', areanm: 'Middlesborough' },
		{ areacd: 'E06000003', areanm: 'Redcar and Cleveland' }
	];
	let comparisonGeographies = [
		{ areacd: 'E92000001', areanm: 'England' },
		{ areacd: 'E92000004', areanm: 'East Midlands' }
	];
	let selectedIndicators = ['median-age', 'net-additions-housing-stock', 'claimant-count'];
	$inspect(data);
</script>

<Hero
	background="#eaeaea"
	title="Bespoke page"
	width="medium"
	lede="Custom built page for:"
	meta={[
		{
			key: 'Primary areas',
			value: primaryGeographies.map((d) => d.areanm).join(', ')
		},
		{
			key: 'Comparison areas',
			value: comparisonGeographies.map((d) => d.areanm).join(', ')
		},
		{
			key: 'Indicators',
			value: selectedIndicators
		}
	]}
></Hero>

<NavSections cls="wider-nav-sections" marginTop>
	<!-- {#each charts as chart}
			<NavSection title={chart.label}>
				<IndicatorChart
					chartType={chart.key}
					indicator={data.indicator.slug}
					metadata={data.indicator}
					timeRange={pageState.selectedPeriodRange}
					selected={pageState.selectedAreas}
					geoLevel={pageState.selectedGeoLevel}
					showIntervals={pageState.showConfidenceIntervals}
				/>
			</NavSection>
		{/each} -->
	<Grid>
		<!-- <NewComponentHereLikeSMbarchartOrHeatmap
			metadata={data.indicator}
			selected={primaryGeographies.areacd}
			showIntervals={pageState.showConfidenceIntervals}
		/> -->
	</Grid>
</NavSections>
