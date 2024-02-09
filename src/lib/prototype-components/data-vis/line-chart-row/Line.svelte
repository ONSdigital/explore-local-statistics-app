<script lang="ts">
	import { colorsLookup, chartConfigurations } from '$lib/config';
	import { line } from 'd3-shape';

	export let area, x, y, xDomain, hoverId;

	$: pathFunction = line()
		.x((d) => {
			return x(d.xDomainNumb);
		})
		.y((d) => {
			return y(d.value);
		});

	$: backgroundColor = colorsLookup[hoverId === area.areacd ? 'selected' : area.role].color;
	$: textColor = colorsLookup[hoverId === area.areacd ? 'selected' : area.role].contrast;

	const onMouseEnterEvent = () => {
		hoverId = area.areacd;
	};

	const onMouseLeaveEvent = () => {
		hoverId = undefined;
	};
</script>

<g
	class="line-{area.areacd}"
	opacity={hoverId
		? hoverId === area.areacd
			? 1
			: 0.1
		: ['similar', 'sameRegion'].includes(area.role)
			? 1
			: 1}
>
	<path
		class="primary-line"
		d={pathFunction(area.data)}
		fill="none"
		stroke={backgroundColor}
		stroke-width={!['similar', 'sameRegion'].includes(area.role) || hoverId === area.areacd
			? '2px'
			: '1.5px'}
	></path>

	{#if !['similar', 'sameRegion'].includes(area.role) || hoverId === area.areacd}
		<g class="markers-group">
			{#each area.data as point}
				<g transform="translate({x(point.xDomainNumb)},{y(point.value)})">
					{#if ['parent', 'country', 'uk'].includes(area.role)}
						<rect
							transform={['country', 'uk'].includes(area.role) ? 'rotate(45)' : null}
							x={-chartConfigurations.lineChartRow.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
							y={-chartConfigurations.lineChartRow.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
							width={2 *
								chartConfigurations.lineChartRow.markerRadius[
									point.xDomainNumb === xDomain[0]
										? 'first'
										: point.xDomainNumb === xDomain[1]
											? 'last'
											: 'other'
								]}
							height={2 *
								chartConfigurations.lineChartRow.markerRadius[
									point.xDomainNumb === xDomain[0]
										? 'first'
										: point.xDomainNumb === xDomain[1]
											? 'last'
											: 'other'
								]}
							fill={backgroundColor}
							stroke="white"
							stroke-width="1px"
						></rect>
					{:else}
						<circle
							r={chartConfigurations.lineChartRow.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
							stroke="white"
							stroke-width="0.5px"
							fill={backgroundColor}
						></circle>
					{/if}
				</g>
			{/each}
		</g>
	{/if}

	<path
		class="overlay-line"
		on:mouseenter={onMouseEnterEvent}
		on:mouseleave={onMouseLeaveEvent}
		d={pathFunction(area.data)}
		fill="none"
		stroke={'black'}
		stroke-width={'20px'}
		opacity={0}
	></path>
</g>
