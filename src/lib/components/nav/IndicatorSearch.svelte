<script>
	import { Select, Button } from '@onsvisual/svelte-components';

	let { indicators, label = 'Select an indicator', cls = '', onSelect = () => null } = $props();
	let selectedIndicator = $state();
</script>

<form
	class="search-form {cls}"
	onsubmit={(e) => {
		e.preventDefault();
		onSelect(selectedIndicator);
	}}
>
	<div class="search-input">
		<Select
			{label}
			options={indicators}
			bind:value={selectedIndicator}
			groupKey="subTopic"
			clearable={false}
		/>
	</div>
	<Button type="submit" disabled={!selectedIndicator} small>Select</Button>
</form>

<style>
	.search-form {
		display: flex;
		flex-direction: row;
		align-items: end;
		width: 100%;
		max-width: 550px;
		gap: 0.5rem;
	}
	.search-input {
		flex-grow: 1;
	}
	.search-form :global(.ons-btn__inner) {
		height: 40px;
	}
	.search-form :global(.ons-btn) {
		margin: 0;
	}
</style>
