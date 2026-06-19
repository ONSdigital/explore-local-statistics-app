<script lang="ts">
	import { page } from '$app/state';
	import '@onsvisual/svelte-components/css/main.css';
	import '../app.css';
</script>

<svelte:head>
	{#if page?.data?.noIndex}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<slot />
