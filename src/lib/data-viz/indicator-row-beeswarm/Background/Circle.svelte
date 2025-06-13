<script lang="ts">
	import { colorsLookup } from '$lib/config.js';

	export let circle,
		y,
		radius,
		indicator = null,
		hoverAreaId = null,
		hoverIndicatorId = null,
		hover;

	function mouseEnterEvent() {
		hoverAreaId = circle.datum.areacd;
		hoverIndicatorId = indicator.code;
	}

	function mouseLeaveEvent() {
		hoverAreaId = null;
		hoverIndicatorId = null;
	}
</script>

{#if hover}
	<g class="hover-circle-group">
		<circle
			cx={circle.x}
			cy={y(circle.y)}
			r={radius}
			fill={colorsLookup.selected.color}
			stroke={'white'}
			stroke-width="1.5px"
			pointer-events="none"
		></circle>
	</g>
{:else}
	<g
		class="background-circle-group"
		on:mouseenter={mouseEnterEvent}
		on:mouseleave={mouseLeaveEvent}
	>
		<circle
			cx={circle.x}
			cy={y(circle.y)}
			r={radius + 1.5}
			fill-opacity={0.75}
			stroke="none"
			fill={'white'}
		></circle>

		<circle
			cx={circle.x}
			cy={y(circle.y)}
			r={radius}
			fill-opacity={0.35}
			stroke-opacity={0.35}
			stroke="black"
			fill={'#888a8f'}
			stroke-width="1px"
		></circle>
	</g>
{/if}
