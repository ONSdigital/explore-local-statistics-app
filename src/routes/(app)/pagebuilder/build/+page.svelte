<script lang="ts">
	import MarkdownIt from 'markdown-it';
	import { resolve } from '$app/paths';
	import {
		Hero,
		Container,
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
	$inspect(data);
</script>

<Hero background="#eaeaea" title="Area comparison page" width="medium"></Hero>

<Container>
	<p>this is where my area comparison page would go, if i had one</p>
</Container>
