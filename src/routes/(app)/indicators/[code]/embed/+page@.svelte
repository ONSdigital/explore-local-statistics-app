<script lang="ts">
	import { Embed, Container } from '@onsvisual/svelte-components';
	import IndicatorChart from '$lib/components/charts/IndicatorChart.svelte';

	let { data } = $props();

	$inspect({ data });
</script>

<Embed>
	<Container width="medium">
		<IndicatorChart
			mode="embed"
			indicator={data.indicator.slug}
			metadata={data.indicator}
			chartType={data.chartType}
			geoLevel={data.geoLevel}
			selected={data.selected}
			timeRange={data.timeRange}
		/>
	</Container>
</Embed>
