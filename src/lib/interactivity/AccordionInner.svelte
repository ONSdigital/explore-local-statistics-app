<script>
	import { Details } from '@onsvisual/svelte-components';

	export let title;
</script>

{#if title}
	<Details {title}><slot /></Details>
{:else}
	<slot />
{/if}
