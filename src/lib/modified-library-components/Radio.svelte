<script>
	export let name,
		optionsArray,
		valueId,
		title,
		labelKey,
		idKey,
		columns = 1;
</script>

<fieldset class="radio-container">
	{#if title}
		<legend class="radio-title ons-u-vh">{title}</legend>
	{/if}

	<div class="radio-container radio-labels-container-{columns}-columns">
		{#each optionsArray as option, i}
			<label>
				<input type="radio" value={idKey ? option[idKey] : option} {name} bind:group={valueId} />

				<div class="option-label">
					<span>{labelKey ? option[labelKey] : option}</span>
				</div>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.radio-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 4px;
		width: 100%;
	}

	label {
		display: flex;
		flex-direction: row;
		gap: 8px;
		min-width: 250px;
	}

	.option-label {
		width: 100%;
	}

	span {
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
