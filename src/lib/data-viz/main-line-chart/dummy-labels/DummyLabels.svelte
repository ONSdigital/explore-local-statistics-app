<script>
	import DummyLabel from './DummyLabel.svelte';

	export let lines,
		fontSize = '16',
		labelSpace,
		labelArray;
</script>

{#each lines as line, i}
	<DummyLabel {line} {fontSize} {labelSpace} bind:label={labelArray[i]}></DummyLabel>
{/each}
