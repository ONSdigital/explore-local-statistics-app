<script lang="ts">
	export let orientation, margin;
</script>

<div
	class="divider-{orientation}"
	style={margin
		? 'margin: ' + margin[0] + 'px ' + margin[1] + 'px ' + margin[2] + 'px ' + margin[3] + 'px;'
		: null}
></div>

<style>
	.divider-vertical {
		border-right-style: solid;
		border-right-color: #cbd5e1;
		border-right-width: 1px;
	}

	.divider-horizontal {
		margin: 20px 0px;
		border-top-style: solid;
		border-top-color: #cbd5e1;
		border-top-width: 1px;
	}
</style>
