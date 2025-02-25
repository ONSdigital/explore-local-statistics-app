<script>
	export let items = [];
</script>

<div class="legend">
	{#each items as { colour, label, type }}
		<div class="legend--item">
			<div
				class={type == 'circle' ? 'legend--icon--circle' : 'legend--icon--refline'}
				style="background-color: {colour};"
			></div>
			<div class="legend--text">
				<p>{label}</p>
			</div>
		</div>
	{/each}
</div>

<style>
	/* legend div */
	.legend {
		display: flex;
		flex-wrap: wrap;
		padding-top: 10px;
	}

	.legend--item {
		display: flex;
		padding-right: 40px;
		padding-bottom: 12px;
	}

	.legend--icon--circle {
		height: 12px;
		width: 12px;
		border-radius: 50%;
		align-self: center;
		flex-shrink: 0;
		forced-color-adjust: none;
	}

	/* a legend circle with a border for scatterplots */
	.legend--icon--circle2 {
		height: 12px;
		width: 12px;
		border-radius: 50%;
		align-self: center;
		flex-shrink: 0;
		border: 2px solid;
		forced-color-adjust: none;
	}

	.legend--icon--refline {
		height: 3px;
		width: 20px;
		align-self: center;
		flex-shrink: 0;
		forced-color-adjust: none;
	}

	.legend--text {
		color: #707070;
		line-height: 14px;
		font-size: 14px;
		padding-left: 12px;
		margin: 0;
	}

	.legend--text p {
		margin: 0 auto;
	}

	@media (max-width: 400px) {
		#legend {
			flex-flow: column;
		}

		.legend--item {
			padding-bottom: 8px;
		}
	}
</style>
