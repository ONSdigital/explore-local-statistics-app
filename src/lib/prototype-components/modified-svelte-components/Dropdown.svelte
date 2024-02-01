<script>
	export let chosenId,
		name = '',
		optionsArray;
</script>

<div class="ons-field">
	<select id={name} {name} class="ons-input ons-input--select" bind:value={chosenId}>
		{#each optionsArray as option, i}
			<option value={option}>{option.label}</option>
		{/each}
	</select>
</div>

<style>
	select {
		padding: 10px 30px 10px 10px;
		width: 100%;
		font-size: 18px;
		line-height: 22px;
		text-wrap: wrap;
	}

	select {
	}
</style>
