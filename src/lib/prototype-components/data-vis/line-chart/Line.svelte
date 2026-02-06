<script lang="ts">
	import { colorsLookup, chartConfigurations } from '$lib/config';
	import { line } from 'd3-shape';

	export let area,
		x,
		y,
		xDomain,
		hoverId,
		customLookup,
		background,
		linesCount = 0,
		hover = false;

	$: pathFunction = line()
		.x((d) => {
			return x(d.xDomainNumb);
		})
		.y((d) => {
			return y(d.value);
		});

	$: color = hover
		? colorsLookup.selected
		: area
			? area.role === 'custom'
				? Object.keys(customLookup).length > colorsLookup.custom.length
					? colorsLookup.customExceedThreshold
					: colorsLookup.custom[area.areacd in customLookup ? customLookup[area.areacd] : 0]
				: colorsLookup[area.role]
			: { color: null, constrast: null };

	const onMouseEnterEvent = () => {
		hoverId = area.areacd;
	};

	const onMouseLeaveEvent = () => {
		hoverId = undefined;
	};
</script>

<g
	class="line-{area.areacd}"
	opacity={!background ? 1 : linesCount < 30 ? 0.5 : linesCount < 100 ? 0.35 : 0.2}
>
	{#if !background}
		<path
			class="primary-line"
			d={pathFunction(area.data)}
			fill="none"
			stroke={'white'}
			stroke-width={'4px'}
			pointer-events="none"
		></path>
	{/if}
	<path
		pointer-events="none"
		class="primary-line"
		d={pathFunction(area.data)}
		fill="none"
		stroke={color.color}
		stroke-width={!background
			? '3px'
			: linesCount < 30
				? '2px'
				: linesCount < 100
					? '1.75px'
					: '1.5px'}
	></path>

	{#if !background}
		<g class="markers-group">
			{#each area.data.length > 35 ? [area.data[0]] : area.data as point}
				<g transform="translate({x(point.xDomainNumb)},{y(point.value)})">
					{#if ['parent', 'country', 'uk'].includes(area.role)}
						<rect
							transform={['country', 'uk'].includes(area.role) ? 'rotate(45)' : null}
							x={-0.75 *
								chartConfigurations.lineChart.markerRadius[
									point.xDomainNumb === xDomain[0]
										? 'first'
										: point.xDomainNumb === xDomain[1]
											? 'last'
											: 'other'
								]}
							y={-0.75 *
								chartConfigurations.lineChart.markerRadius[
									point.xDomainNumb === xDomain[0]
										? 'first'
										: point.xDomainNumb === xDomain[1]
											? 'last'
											: 'other'
								]}
							width={1.5 *
								chartConfigurations.lineChart.markerRadius[
									point.xDomainNumb === xDomain[0]
										? 'first'
										: point.xDomainNumb === xDomain[1]
											? 'last'
											: 'other'
								]}
							height={1.5 *
								chartConfigurations.lineChart.markerRadius[
									point.xDomainNumb === xDomain[0]
										? 'first'
										: point.xDomainNumb === xDomain[1]
											? 'last'
											: 'other'
								]}
							fill={color.color}
							stroke="white"
							stroke-width={linesCount < 30 ? '1.5px' : '0.5px'}
							pointer-events="none"
						></rect>
					{:else}
						<circle
							r={chartConfigurations.lineChart.markerRadius[
								point.xDomainNumb === xDomain[0]
									? 'first'
									: point.xDomainNumb === xDomain[1]
										? 'last'
										: 'other'
							]}
							stroke="white"
							stroke-width={linesCount < 30 ? '1.5px' : '0.5px'}
							fill={color.color}
							pointer-events="none"
						></circle>
					{/if}
				</g>
			{/each}
		</g>
	{/if}

	{#if !hover}
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
	{/if}
</g>
