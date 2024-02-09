<script>
	export let name, optionsArray, valueId, title, labelKey, idKey;
</script>

<div class="radio-container">
	{#if title}
		<p class="radio-title">{title}</p>
	{/if}

	{#each optionsArray as option, i}
		<label>
			<input type="radio" value={idKey ? option[idKey] : option} {name} bind:group={valueId} />

			<div class="optionLabel">
				<p>{labelKey ? option[labelKey] : option}</p>
			</div>
		</label>
	{/each}
</div>

<style>
	.radio-container {
		display: flex;
		flex-direction: column;
		flex-wrap: nowrap;
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

	.optionLabel {
	}
</style>
