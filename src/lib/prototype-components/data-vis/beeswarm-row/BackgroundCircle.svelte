<script lang="ts">
	export let circle, y, backgroundRadius, indicator, hoverId, hoverIndicatorId;

	function mouseEnterEvent() {
		hoverId = circle.datum.areacd;
		hoverIndicatorId = indicator.code;
	}

	function mouseLeaveEvent() {
		hoverId = null;
		hoverIndicatorId = null;
	}
</script>

<g class="background-circle-group" on:mouseenter={mouseEnterEvent} on:mouseleave={mouseLeaveEvent}>
	<circle
		cx={circle.x}
		cy={y(circle.y)}
		r={backgroundRadius + 1.5}
		fill-opacity={0.75}
		stroke="none"
		fill={'white'}
	></circle>

	<circle
		cx={circle.x}
		cy={y(circle.y)}
		r={backgroundRadius}
		fill-opacity={0.35}
		stroke-opacity={0.35}
		stroke="black"
		fill={'#888a8f'}
		stroke-width="1px"
	></circle>
</g>
