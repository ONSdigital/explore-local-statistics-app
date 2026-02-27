<script lang="ts">
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
	$inspect(data);

	let formatPeriod = $derived(makePeriodFormatter(data.indicator.periodFormat));

	let charts = $derived(getChartTypesForIndicator(data.indicator));

	function arrayJoin(arr, separators = [', ', ' and ']) {
		if (arr.length < 2) return arr.join(separators[0]);
		return arr.slice(0, -1).join(separators[0]) + separators[1] + arr.slice(-1);
	}

	const parseDate = (str) => {
		const intlString = str.split('/').reverse().join('-') + 'T12:00';
		const date = new Date(intlString);
		return date.toLocaleString('en-GB', {
			year: 'numeric',
			month: 'long',
			day: '2-digit'
		});
	};

	let pageState = $state({
		selectedAreas: data.initialArea ? [data.initialArea] : [],
		selectedGeoLevel: data.geoLevels.find((g) => g.id === data.indicator.geography.initialLevel),
		selectedPeriodRange: [data.periods[0], data.periods[data.periods.length - 1]],
		showConfidenceIntervals: false,
		formatPeriod: () => formatPeriod
	});

	$inspect(pageState.selectedAreas);
</script>

<Hero
	title={data.indicator.label}
	width="medium"
	meta={[
		{
			key: data.indicator.source.length === 1 ? 'Data source' : 'Data sources',
			value: arrayJoin(
				data.indicator.source.map(
					(s) =>
						`<a href="${s.href}" target="_blank">${s.name}<span class="ons-u-vh"> (opens in a new tab)</span></a>`
				)
			)
		},
		{
			key: 'Published on',
			value: parseDate(data.indicator.updated)
		}
	]}
	background="#eaeaea"
	titleBadge={{
		label: data.indicator.experimentalStatistic
			? 'Official statistics in development'
			: capitalise(data.indicator.topic),
		ariaLabel: `Topic: ${capitalise(data.indicator.topic)}`,
		color: '#003c57'
	}}
>
	<p class="ons-hero__text">
		{data.indicator.description}
	</p>
</Hero>

<NavSections cls="wider-nav-sections" marginTop>
	<div class="indicators-nav-sections">
		<div class="legend-sticky">
			<AreasLegend selectedAreas={pageState.selectedAreas} />
			<div class="legend-modals">
				<AreasModal mode="indicator" {data} bind:pageState />
				<OptionsModal {data} hasIntervals={data.indicator.confidenceIntervals} bind:pageState />
			</div>
		</div>
		{#each charts as chart}
			<NavSection title={chart.label}>
				<IndicatorChart
					chartType={chart.key}
					indicator={data.indicator.slug}
					metadata={data.indicator}
					timeRange={pageState.selectedPeriodRange}
					selected={pageState.selectedAreas.map((a) => a.areacd)}
					geoLevel={pageState.selectedGeoLevel}
					showIntervals={pageState.showConfidenceIntervals}
				/>
			</NavSection>
		{/each}
	</div>
	<NavSection title="Get the data">
		<p>
			You can download this dataset in an <a
				href={resolve(`/api/v1/data.xlsx?indicator=${data.indicator.slug}&time=all`)}
				download={`${data.indicator.slug}.xlsx`}
				aria-label="Download {data.indicator.label} data as an XLSX file"
				onclick={() => downloadEvent('xlsx', data.indicator)}>XLSX</a
			>,
			<a
				href={resolve(`/api/v1/data.csv?indicator=${data.indicator.slug}&time=all`)}
				download={`${data.indicator.slug}.csv`}
				aria-label="Download {data.indicator.label} data as a CSV file"
				onclick={() => downloadEvent('csv', data.indicator)}>CSV</a
			>,
			<a
				href={resolve(`/api/v1/data.csvw?indicator=${data.indicator.slug}&time=all`)}
				download={`${data.indicator.slug}.csv-metadata.json`}
				aria-label="Download {data.indicator.label} metadata as an CSVW file"
				onclick={() => downloadEvent('csvw', data.indicator)}>CSVW</a
			>
			or
			<a
				href={resolve(`/api/v1/data.json?indicator=${data.indicator.slug}&time=all`)}
				download={`${data.indicator.slug}.json`}
				aria-label="Download {data.indicator.label} data as a JSON-Stat file"
				onclick={() => downloadEvent('json', data.indicator)}>JSON-Stat</a
			>
			format, or download
			<a
				href={resolve(`/api/v1/data.xlsx?time=all`)}
				download="all-datasets.xlsx"
				aria-label="Download all datasets as an XLSX file"
				onclick={() => downloadEvent('xlsx')}>all available datasets (XLSX, ~10MB)</a
			>.
		</p>
		<p>
			The original source data for this indicator can be found on the following
			{data.indicator.source.length > 1 ? 'pages' : 'page'}:
			{#each data.indicator.source as s, i}
				<a href={s.href} target="_blank"
					>{s.name}<span class="ons-u-vh"> (opens in a new tab)</span></a
				><span class="inline-icon ons-u-ml-3xs"><Icon type="external" /></span>{i ===
				data.indicator.source.length - 1
					? '.'
					: i === data.indicator.source.length - 2
						? ' and '
						: ', '}
			{/each}
		</p>
		<p>
			Information on the strengths and limitations of the Explore Local Statistics service and
			methods used is available in the
			<a
				href="https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandwellbeing/methodologies/explorelocalstatisticsserviceqmi"
				>quality and methodology information (QMI) report</a
			>.
		</p>
	</NavSection>
	<NavSection title="Other indicators">
		<p>
			{data.indicator.label} is one of {data.summaryStats.univariateCount} local indicators on the
			<a href={resolve('/')}>Explore local statistics</a>
			service. See the
			<a href={resolve('/indicators')}>full list of local indicators</a>.
		</p>
	</NavSection>
</NavSections>
