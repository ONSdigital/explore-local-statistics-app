<script>
	import { onMount, onDestroy, getContext } from 'svelte';
	import { slugify } from '$lib/util/url/slugify.ts';

	/**
	 * Title of tab/panel
	 * @type {string}
	 */
	export let title = 'Tab title';
	/**
	 * Hide the title within the panel
	 * @type {boolean}
	 */
	export let hideTitle = false;
	/**
	 * ID/slug for tab (auto-generated from title if not set)
	 * @type {string}
	 */
	export let id = slugify(title);

	const sections = getContext('sections');
	const selected = getContext('selected');

	let el;

	onMount(() => {
		if (sections) {
			$sections = [...el.parentElement.getElementsByTagName('section')].filter(
				(s) => s.dataset.type === 'Tab'
			);
			if ($selected === null || $selected === undefined) $selected = $sections[0]?.id;
		}
	});

	onDestroy(() => {
		if (sections) {
			$sections = $sections.filter((s) => s.id !== id);
			if ($selected === id) $selected = $sections.length > 0 ? $sections[0].id : null;
		}
	});
</script>

<section
	{id}
	data-title={title}
	data-type="Tab"
	class="ons-tabs__panel"
	bind:this={el}
	class:ons-tabs__panel--hidden={$selected !== id}
	role="tabpanel"
>
	<h2 id="{id}-content-title" class="ons-u-vh" class:ons-u-vh={hideTitle}>{title}</h2>
	<slot />
</section>
