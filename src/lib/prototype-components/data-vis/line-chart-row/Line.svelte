<script lang="ts">
	import { colorsLookup, chartConfigurations } from '$lib/config';
	import { line } from 'd3-shape';

	export let area, x, y, xDomain;

	$: pathFunction = line()
		.x((d) => {
			return x(d.xDomainNumb);
		})
		.y((d) => {
			return y(d.value);
		});

	$: markerScaleFactors = ['main', 'selected'].includes(area.role)
		? area.data.length < 5
			? [1, 1]
			: area.data.length < 10
				? [0.9, 0.8]
				: area.data.length < 15
					? [0.8, 0.5]
					: area.data.length < 20
						? [0.7, 0.2]
						: [0.5, 0.1]
		: area.data.length < 5
			? [0.75, 0.75]
			: area.data.length < 10
				? [0.7, 0.65]
				: area.data.length < 15
					? [0.6, 0.5]
					: area.data.length < 20
						? [0.55, 0.2]
						: [0.4, 0.1];
</script>

<g class="line-group" opacity={['main', 'selected'].includes(area.role) ? 1 : 0.5}>
	<path
		class="primary-line"
		d={pathFunction(area.data)}
		fill="none"
		stroke={'white'}
		stroke-width="4px"
	></path>
	<path
		class="primary-line"
		d={pathFunction(area.data)}
		fill="none"
		stroke={colorsLookup[area.role].color}
		stroke-width={['main', 'selected'].includes(area.role) ? '2px' : '1.5px'}
	></path>

	<g class="markers-group">
		{#each area.data as point}
			<g transform="translate({x(point.xDomainNumb)},{y(point.value)})">
				{#if ['parent', 'country', 'uk', 'median'].includes(area.role)}
					<rect
						transform={['country', 'uk', 'median'].includes(area.role) ? 'rotate(45)' : null}
						x={-markerScaleFactors[0] *
							chartConfigurations.lineChartRow.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
						y={-markerScaleFactors[0] *
							chartConfigurations.lineChartRow.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
						width={2 *
							markerScaleFactors[0] *
							chartConfigurations.lineChartRow.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
						height={2 *
							markerScaleFactors[0] *
							chartConfigurations.lineChartRow.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
						fill={colorsLookup[area.role].color}
						stroke="white"
						stroke-width="{markerScaleFactors[1] * 1.5}px"
					></rect>
				{:else}
					<circle
						r={markerScaleFactors[0] *
							chartConfigurations.lineChartRow.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
						stroke="white"
						stroke-width="{markerScaleFactors[1] * 1.5}px"
						fill={colorsLookup[area.role].color}
					></circle>
				{/if}
			</g>
		{/each}
	</g>
</g>
