<script>
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { countries, regions } from '$lib/config';
	import { Container, Grid, Twisty, Select } from '@onsvisual/svelte-components';

	export let open = false,
		areas;

	const parents = [...regions, ...countries.slice(1)];

	function doSelect(e) {
		goto(`${base}/areas/${e.detail.areacd}`);
	}
</script>

<Container marginBottom>
	<div class="select-container">
		<Select
			options={areas}
			mode="search"
			placeholder="Find an area name"
			idKey="areacd"
			labelKey="areanm"
			on:change={doSelect}
			autoClear
		/>
	</div>
	<Twisty title="Browse areas" {open}>
		<Grid colwidth="narrow">
			{#each parents as parent}
				<div blank>
					<a href="{base}/areas/{parent.code}" class="parent-link">{parent.name}</a>
					{#each areas.filter((el) => el.parentcd === parent.code) as area}
						<a href="{base}/areas/{area.areacd}" class="area-link">{area.areanm}</a>
					{/each}
				</div>
			{/each}
		</Grid>
	</Twisty>
</Container>
