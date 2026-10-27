<script lang="ts">
	import { Icon } from '@onsvisual/svelte-components';
	let { sidebarTop, sidebar, children, open = $bindable(true), label = 'indicator' } = $props();

	$effect(() => {
		if (typeof window === 'undefined') return;
		const isMobile = window.matchMedia('(max-width: 768px)').matches;
		document.body.style.overflow = open && isMobile ? 'hidden' : '';
		return () => (document.body.style.overflow = '');
	});

	// allow keyboard users on mobile/narrow screens to close tab with esc
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (!window.matchMedia('(max-width: 768px)').matches) return;
		open = false;
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="shell">
	<button
		class="backdrop"
		class:open
		tabindex="-1"
		aria-hidden="true"
		onclick={() => (open = false)}
	></button>

	<aside id="page-sidebar" class:open>
		<div class="sidebar-inner">
			{#if sidebarTop}
				<div class="sidebar-top">
					{@render sidebarTop()}
				</div>
			{/if}
			<div class="sidebar-scroll">
				{@render sidebar()}
			</div>
		</div>

		<button
			class="tab"
			aria-label={open ? `Hide ${label} panel` : `Change ${label}`}
			aria-controls="page-sidebar"
			aria-expanded={open}
			onclick={() => (open = !open)}
		>
			<Icon type="chevron" rotation={open ? 180 : 0}></Icon>
		</button>
	</aside>

	<div class="main">
		{@render children()}
	</div>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: 320px minmax(0, 1fr);
		gap: 2rem;
		align-items: start;
	}

	aside {
		position: sticky;
		top: 0;
	}
	.sidebar-inner {
		display: flex;
		flex-direction: column;
		max-height: 100vh;
		box-sizing: border-box;
		padding: 1rem 1rem 1rem 0;
	}
	.sidebar-top {
		position: relative;
		z-index: 2; /* lets dropdown sit above the scrolling area */
		flex: none;
	}
	.sidebar-scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
	}
	.backdrop,
	.tab {
		display: none;
	}

	@media (max-width: 768px) {
		.shell {
			display: block;
		}

		aside {
			position: fixed;
			top: 0;
			bottom: 0;
			left: 0;
			width: 80vw; /* how far across the page the sidebar extends on mobile */
			max-width: 420px;
			z-index: 1000;
			transform: translateX(-100%);
			transition: transform 0.25s ease;
		}
		aside.open {
			transform: translateX(0);
		}

		.sidebar-inner {
			height: 100%;
			max-height: none;
			padding: 1rem;
			background: #fff;
		}
		aside.open .sidebar-inner {
			box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
		}
		aside:not(.open) .sidebar-inner {
			visibility: hidden;
			transition: visibility 0s linear 0.25s;
		}

		.backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 999;
			padding: 0;
			border: 0;
			background: rgba(0, 0, 0, 0.4);
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.25s ease;
		}
		.backdrop.open {
			opacity: 1;
			pointer-events: auto;
		}

		.tab {
			display: flex;
			align-items: center;
			justify-content: center;
			position: absolute;
			top: 50%;
			right: -44px;
			transform: translateY(-50%);
			width: 44px;
			height: 56px;
			padding: 0;
			border: 0;
			border-radius: 0 8px 8px 0;
			background: rgba(32, 96, 149, 0.7);
			color: #fff;
			box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
			cursor: pointer;
		}
		.tab:focus-visible {
			outline: 3px solid #fbc900;
			outline-offset: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		aside,
		.backdrop {
			transition: none;
		}
	}
</style>
