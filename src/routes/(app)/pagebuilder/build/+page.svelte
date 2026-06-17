<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { resolve } from '$app/paths';
	import { Hero, NavSections, NavSection, List, Li, Icon } from '@onsvisual/svelte-components';
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
	let comparisonGeographies = ['E92000001', 'E92000004'];
	let selectedIndicators = [
		'population-by-age-and-sex',
		'net-additions-housing-stock',
		'claimant-count'
	];
</script>

<Hero background="#eaeaea" title="Bespoke page" width="medium">
	<p class="ons-hero__text">
		Custom built page for {primaryGeographies.areanm}, compared to {comparisonGeographies}, for the
		following indicators: {selectedIndicators}.
	</p>
</Hero>

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
</NavSections>
