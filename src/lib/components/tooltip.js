import Tooltip from './Tooltip.svelte';

const tooltip = (element, options = { pos: 'middle' }) => {
	let title;
	let tooltipComponent;

	function mouseOver(event) {
		// NOTE: remove the `title` attribute, to prevent showing the default browser tooltip
		// remember to set it back on `mouseleave`
		title = element.getAttribute('title');
		element.removeAttribute('title');

		let tooltip_pos = options.pos;
		let top = tooltip_pos && (tooltip_pos == 'top' || tooltip_pos == 'middle') ? true : false;
		let middle = tooltip_pos && tooltip_pos == 'middle' ? true : false;
		let body = document.body.getBoundingClientRect();
		let pos = element.getBoundingClientRect();
		let y = middle ? (pos.bottom + pos.top) / 2 : top ? pos.top : pos.bottom;
		let x = (pos.left + pos.right) / 2;

		tooltipComponent = new Tooltip({
			props: {
				title: title,
				x: x,
				y: y + window.scrollY,
				width: body.width,
				pos: top ? 'top' : 'bottom'
			},
			target: document.body
		});
	}
	function mouseOut() {
		tooltipComponent.$destroy();
		// NOTE: restore the `title` attribute
		element.setAttribute('title', title);
	}

	element.addEventListener('mouseover', mouseOver);
	element.addEventListener('mouseout', mouseOut);

	return {
		destroy() {
			if (tooltipComponent) tooltipComponent.$destroy();
			element.removeEventListener('mouseover', mouseOver);
			element.removeEventListener('mouseout', mouseOut);
		}
	};
};

export default tooltip;
