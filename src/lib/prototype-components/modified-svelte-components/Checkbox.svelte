<script>
	export let title,
		name,
		optionsArray,
		valueArray,
		idKey,
		labelKey,
		columns = 1;
</script>

<div class="checkbox-container">
	{#if title}
		<p class="checkbox-title">{title}</p>
	{/if}

	<div class="checkbox-labels-container checkbox-labels-container-{columns}-columns">
		{#each optionsArray as option, i}
			<label>
				<input type="checkbox" value={option[idKey]} {name} bind:group={valueArray} />

				{option[labelKey]}
			</label>
		{/each}
	</div>
</div>

<style>
	.checkbox-title {
		margin: 0px;
		padding: 0px;
	}

	.checkbox-container {
		display: flex;
		flex-direction: column;
	}

	.checkbox-labels-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}

	.checkbox-labels-container-1-columns label {
		width: calc(100% - 10px);
	}

	.checkbox-labels-container-2-columns label {
		width: calc(50% - 10px);
	}

	.checkbox-labels-container-3-columns label {
		width: calc(33% - 10px);
	}

	label {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin: 0px 0px 0px 10px;
	}

	input {
		padding: 0px;
		margin: 0px 10px 0px 0px;
	}
</style>
