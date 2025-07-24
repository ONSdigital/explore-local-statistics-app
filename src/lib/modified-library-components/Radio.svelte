<script>
	export let name,
		optionsArray,
		valueId,
		title,
		labelKey,
		idKey,
		columns = 1;

	const slugify = (str) => str.toLowerCase().replaceAll(' ', '-');
</script>

<fieldset class="radio-container">
	{#if title}
		<legend class="radio-title ons-u-vh">{title}</legend>
	{/if}

	<div class="radio-container radio-labels-container-{columns}-columns">
		{#each optionsArray as option, i}
			<div class="radio-option">
				<input
					id="{slugify(title)}-{i}"
					type="radio"
					value={idKey ? option[idKey] : option}
					{name}
					bind:group={valueId}
				/>
				<label for="{slugify(title)}-{i}">
					{labelKey ? option[labelKey] : option}
				</label>
			</div>
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

	.radio-option {
		display: flex;
		flex-direction: row;
		gap: 8px;
		min-width: 250px;
	}

	.radio-labels-container-1-columns .radio-option {
		width: calc(100% - 10px);
	}

	.radio-labels-container-2-columns .radio-option {
		width: calc(50% - 10px);
	}
</style>
