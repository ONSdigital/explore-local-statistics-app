<script lang="ts">
	let { message = null } = $props();
</script>

<div class="loading-spinner-container">
	<div class="loading-spinner"></div>
	{#if message}<div class="ons-u-fs-s">{message}</div>{/if}
</div>

<style>
	.loading-spinner-container {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	/* CSS adapted from https://cssloaders.github.io */
	.loading-spinner {
		width: 40px;
		height: 25px;
		background:
			linear-gradient(
				var(--ons-color-branded-tint) calc(1 * 100% / 6),
				var(--ons-color-branded) 0 calc(3 * 100% / 6),
				var(--ons-color-branded-tint) 0
			),
			linear-gradient(
				var(--ons-color-branded-tint) calc(2 * 100% / 6),
				var(--ons-color-branded) 0 calc(4 * 100% / 6),
				var(--ons-color-branded-tint) 0
			),
			linear-gradient(
				var(--ons-color-branded-tint) calc(3 * 100% / 6),
				var(--ons-color-branded) 0 calc(5 * 100% / 6),
				var(--ons-color-branded-tint) 0
			);
		background-size: 10px 400%;
		background-repeat: no-repeat;
		animation: matrix 1.5s infinite linear;
	}
	@keyframes matrix {
		0% {
			background-position:
				0% 100%,
				50% 100%,
				100% 100%;
		}
		100% {
			background-position:
				0% 0%,
				50% 0%,
				100% 0%;
		}
	}
</style>
