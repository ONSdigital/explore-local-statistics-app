<script>
	export let expandIcon,
		fill = 'black';
</script>

<div class="info-cell">
	<svg
		style:width="24px"
		style:height="24px"
		class="c h-16 w-16 inline svelte-nloqxl"
		viewBox={expandIcon ? '4 6 40 40' : '0 2 48 48'}
		><path
			{fill}
			d="M24.15 34q.65 0 1.075-.425.425-.425.425-1.075v-9.05q0-.6-.45-1.025Q24.75 22 24.15 22q-.65 0-1.075.425-.425.425-.425 1.075v9.05q0 .6.45 1.025.45.425 1.05.425ZM24 18.3q.7 0 1.175-.45.475-.45.475-1.15t-.475-1.2Q24.7 15 24 15q-.7 0-1.175.5-.475.5-.475 1.2t.475 1.15q.475.45 1.175.45ZM24 44q-4.25 0-7.9-1.525-3.65-1.525-6.35-4.225-2.7-2.7-4.225-6.35Q4 28.25 4 24q0-4.2 1.525-7.85Q7.05 12.5 9.75 9.8q2.7-2.7 6.35-4.25Q19.75 4 24 4q4.2 0 7.85 1.55Q35.5 7.1 38.2 9.8q2.7 2.7 4.25 6.35Q44 19.8 44 24q0 4.25-1.55 7.9-1.55 3.65-4.25 6.35-2.7 2.7-6.35 4.225Q28.2 44 24 44Zm0-20Zm0 17q7 0 12-5t5-12q0-7-5-12T24 7q-7 0-12 5T7 24q0 7 5 12t12 5Z"
		></path></svg
	>
</div>

<style>
	.info-cell {
		padding: 0 5px;
		margin: 0;
		display: inline-block;
		position: relative;
		transform: translateY(-1px);
	}

	svg {
		vertical-align: middle;
		overflow: visible;
	}
</style>
