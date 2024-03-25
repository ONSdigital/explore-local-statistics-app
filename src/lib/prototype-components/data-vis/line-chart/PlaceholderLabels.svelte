<script>
	import PlaceholderLabel from '$lib/prototype-components/data-vis/line-chart/PlaceholderLabel.svelte';

	export let lines,
		fontSize = '16',
		labelSpace,
		labelArray;
</script>

{#each lines as line, i}
	<PlaceholderLabel {line} {fontSize} {labelSpace} bind:label={labelArray[i]}></PlaceholderLabel>
{/each}
