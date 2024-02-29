<script>
	export let name,
		optionsArray,
		valueId,
		title,
		labelKey,
		idKey,
		columns = 1;
</script>

<div class="radio-container">
	{#if title}
		<p class="radio-title">{title}</p>
	{/if}

	<div class="radio-container radio-labels-container-{columns}-columns">
		{#each optionsArray as option, i}
			<label>
				<input type="radio" value={idKey ? option[idKey] : option} {name} bind:group={valueId} />

				<div class="optionLabel">
					<p>{labelKey ? option[labelKey] : option}</p>
				</div>
			</label>
		{/each}
	</div>
</div>

<style>
	.radio-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 10px;
	}

	label {
		display: flex;
		flex-direction: row;
		gap: 8px;
	}

	p {
		padding: 0px;
		margin: 0px;
		font-size: 18px;
		line-height: 20px;
	}

	.radio-labels-container-1-columns label {
		width: calc(100% - 10px);
	}

	.radio-labels-container-2-columns label {
		width: calc(50% - 10px);
	}
</style>
