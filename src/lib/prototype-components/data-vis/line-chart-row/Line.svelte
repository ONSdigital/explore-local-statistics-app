<script lang="ts">
	import { colorsLookup, chartConfigurations } from '$lib/config';
	import { line } from 'd3-shape';

	export let area, x, y, xDomain, customLookup, linesCount;

	$: pathFunction = line()
		.x((d) => {
			return x(d.xDomainNumb);
		})
		.y((d) => {
			return y(d.value);
		});

	$: color = area
		? area.role === 'custom'
			? Object.keys(customLookup).length > colorsLookup.custom.length
				? colorsLookup.customExceedThreshold
				: colorsLookup.custom[area.areacd in customLookup ? customLookup[area.areacd] : 0]
			: colorsLookup[area.role]
		: { color: null, constrast: null };

	$: markerSizeLast =
		(area.role === 'main' || linesCount === 1 ? 1 : 0.8) *
		chartConfigurations.lineChartRow.markerRadius.last;
	$: markerSizeFirst =
		(area.role === 'main' || linesCount === 1 ? 1 : 0.8) *
		chartConfigurations.lineChartRow.markerRadius.first;
	$: markerSizeOther =
		(xDomain[1] - xDomain[0] > 20 ? 0 : xDomain[1] - xDomain[0] > 12 ? 0.8 : 1) *
		(area.role === 'main' || linesCount === 1 ? 1 : 0.8) *
		chartConfigurations.lineChartRow.markerRadius.other;

	$: markerStrokeWidthFactor =
		area.role === 'main' || linesCount === 1 ? 1 : linesCount === 2 ? 0.3 : 0.15;

	$: opacity = area.role === 'main' || linesCount === 1 ? 1 : linesCount === 2 ? 0.75 : 0.5;
</script>

<g class="line-group" {opacity}>
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
		stroke={color.color}
		stroke-width={['main', 'selected'].includes(area.role) ? '2px' : '1.5px'}
	></path>

	<g class="markers-group">
		{#each area.data as point}
			<g transform="translate({x(point.xDomainNumb)},{y(point.value)})">
				{#if ['parent', 'country', 'uk', 'comparison'].includes(area.role)}
					<rect
						transform={['country', 'uk', 'comparison'].includes(area.role) ? 'rotate(45)' : null}
						x={point.xDomainNumb === xDomain[0]
							? -markerSizeFirst * 0.75
							: point.xDomainNumb === xDomain[1]
								? -markerSizeLast * 0.75
								: -markerSizeOther * 0.75}
						y={point.xDomainNumb === xDomain[0]
							? -markerSizeFirst * 0.75
							: point.xDomainNumb === xDomain[1]
								? -markerSizeLast * 0.75
								: -markerSizeOther * 0.75}
						width={point.xDomainNumb === xDomain[0]
							? markerSizeFirst * 1.5
							: point.xDomainNumb === xDomain[1]
								? markerSizeLast * 1.5
								: markerSizeOther * 1.5}
						height={point.xDomainNumb === xDomain[0]
							? markerSizeFirst * 1.5
							: point.xDomainNumb === xDomain[1]
								? markerSizeLast * 1.5
								: markerSizeOther * 1.5}
						fill={color.color}
						stroke="white"
						stroke-width="{(point.xDomainNumb === xDomain[0]
							? markerSizeFirst / 4
							: point.xDomainNumb === xDomain[1]
								? markerSizeLast / 4
								: markerSizeOther / 4) * markerStrokeWidthFactor}px"
					></rect>
				{:else}
					<circle
						r={point.xDomainNumb === xDomain[0]
							? markerSizeFirst
							: point.xDomainNumb === xDomain[1]
								? markerSizeLast
								: markerSizeOther}
						stroke="white"
						stroke-width="{(point.xDomainNumb === xDomain[0]
							? markerSizeFirst / 4
							: point.xDomainNumb === xDomain[1]
								? markerSizeLast / 4
								: markerSizeOther / 4) * markerStrokeWidthFactor}px"
						fill={color.color}
					></circle>
				{/if}
			</g>
		{/each}
	</g>
</g>
