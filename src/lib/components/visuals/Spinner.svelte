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
	.loading-spinner {
		border: 6px solid var(--ons-color-branded-tint);
		border-radius: 50%;
		border-top-color: var(--ons-color-branded);
		width: 40px;
		height: 40px;
		-webkit-animation: spin 2s linear infinite;
		animation: spin 2s linear infinite;
	}
	@-webkit-keyframes spin {
		0% {
			-webkit-transform: rotate(0deg);
		}
		100% {
			-webkit-transform: rotate(360deg);
		}
	}
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
