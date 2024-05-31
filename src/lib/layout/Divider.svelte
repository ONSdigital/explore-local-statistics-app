<script lang="ts">
	export let orientation = 'horizontal';
	export let margin = null;

	$: _margin =
		typeof margin === 'string'
			? margin
			: typeof margin === 'number'
				? `${margin}px`
				: Array.isArray(margin)
					? margin.map((m) => `${m}px`).join(' ')
					: null;
</script>

<div class="divider-{orientation}" style:margin={_margin}></div>

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
