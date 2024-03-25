<script>
	export let searchText;

	const onClickEvent = () => {
		searchText = '';
	};
</script>

<div class="input-container-focused-border">
	<div class="input-container">
		<input placeholder="Type to filter areas" bind:value={searchText} />

		{#if searchText === ''}
			<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 14 14" width="20"
				><path
					fill="currentcolor"
					d="M11.86 10.23 8.62 6.99a4.63 4.63 0 1 0-6.34 1.64 4.55 4.55 0 0 0 2.36.64 4.65 4.65 0 0 0 2.33-.65l3.24 3.23a.46.46 0 0 0 .65 0l1-1a.48.48 0 0 0 0-.62Zm-5-3.32a3.28 3.28 0 0 1-2.31.93 3.22 3.22 0 1 1 2.35-.93Z"
				></path></svg
			>
		{:else}
			<svg
				on:click={onClickEvent}
				cursor="pointer"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				viewBox="0 0 36 30"
				width="20"
				><path stroke="currentcolor" fill="none" stroke-width="3.5px" d="M 1 1 l22 22 M23 1 l-22 22"
				></path></svg
			>
		{/if}
	</div>
</div>

<style>
	.input-container-focused-border {
		width: 400px;
		max-width: 100%;
		border-radius: 6px;
		border: solid 3px transparent;
	}

	.input-container-focused-border:focus-within {
		border: solid 3px var(--ons-color-sun-yellow, #fbc900);
	}

	.input-container {
		border-radius: 3px;
		padding: 8px 5px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border: solid 1px #222;
		color: #222;
	}

	input {
		border: none;
		font-family: sans-serif;
		background: none;
		outline: none;
		flex: 1;
	}

	input::placeholder {
		color: #222;
	}
</style>
