<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData;
</script>

<h1 class="text-4xl">This is {data.place.areanm} {data.place.areacd} ({data.place.groupnm})</h1>

<div class="">{JSON.stringify(data)}</div>