<script>
	export let title,
		name,
		optionsArray,
		valueArray,
		idKey,
		labelKey,
		columns = 1;

	function handleCheckboxChange(event) {
		const { value, checked } = event.target;

		if (checked) {
			valueArray = [...valueArray, value];
		} else {
			valueArray = valueArray.filter((item) => item !== value);
		}
	}

	const slugify = (str) => str.toLowerCase().replaceAll(' ', '-');
</script>

<fieldset class="checkbox-container">
	{#if title}
		<legend class="checkbox-title ons-u-vh">{title}</legend>
	{/if}

	<div class="checkbox-labels-container checkbox-labels-container-{columns}-columns">
		{#each optionsArray as option, i}
			<div class="check-option">
				<input
					id="{slugify(title)}-{i}"
					type="checkbox"
					value={option[idKey]}
					{name}
					checked={valueArray.includes(option[idKey])}
					on:change={(e) => handleCheckboxChange(e)}
				/>
				<label for="{slugify(title)}-{i}">
					{option[labelKey]}
				</label>
			</div>
		{/each}
	</div>
</fieldset>

<style>
	.checkbox-container {
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		gap: 4px;
		width: 100%;
	}

	.checkbox-title {
		margin: 0px;
		padding: 0px;
	}

	.checkbox-labels-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}

	.check-option {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin: 0;
		min-width: 200px;
	}

	.checkbox-labels-container-1-columns .check-option {
		width: calc(100% - 10px);
	}

	.checkbox-labels-container-2-columns .check-option {
		width: calc(50% - 10px);
	}

	.checkbox-labels-container-3-columns .check-option {
		width: calc(33% - 10px);
	}

	input {
		padding: 0px;
		margin: 0px 10px 0px 0px;
	}
</style>
