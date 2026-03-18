export function labelPlacer(zs) {
	let batches = [];
	for (let z of zs) {
		batches.push({ size: 1, mean: z });
		while (batches.length > 1) {
			let b = batches[batches.length - 2];
			let c = batches[batches.length - 1];
			if (b.mean < c.mean) break;
			b.mean = (b.mean * b.size + c.mean * c.size) / (b.size + c.size);
			b.size = b.size + c.size;
			batches.pop();
		}
	}
	let xs = [];
	for (const batch of batches) for (let i = 0; i < batch.size; i++) xs.push(batch.mean);
	return xs;
}

export function marginLabels(params = {}) {
	const selected = params.selected || [];
	const heights = params.heights || [];
	const yScale = params.yScale || null;
	const yKey = params.yKey || 'value';
	const labelProximityThreshold = params.labelProximityThreshold || 40;
	const elbowRoom = params.elbowRoom || 6;

	if (selected.length < 2) {
		// console.log('fewer than 2 areas selected');
		return null;
	}
	// if (heights.filter((h) => h).length !== selected.length) {
	// 	console.log('heights not available for all selections');
	// 	return null;
	// }

	//////////////// Calculate dodged y positions for labels ///////////////
	let sortedYs = selected
		.map((s) => ({ y: yScale(s[s.length - 1][yKey]), value: s[s.length - 1][yKey] }))
		.map((d, i) => ({ y: d.y, i, value: d.value })) //retain index of original selection order prior to sorting
		.sort((a, b) => a.y - b.y);

	const cumulativeHeights = Array(selected.length).fill(0);
	for (let j = 1; j < selected.length; j++) {
		const current = sortedYs[j].i;
		const previous = sortedYs[j - 1].i;
		cumulativeHeights[current] =
			cumulativeHeights[previous] + (heights[previous] + heights[current]) / 2;
	}
	// subtract offsets
	let baselinedYs = sortedYs.map(({ y, i }) => y - cumulativeHeights[i]);
	// run isotonic regression function to overwrite yLabelPositions
	let regressedYs = labelPlacer(baselinedYs);
	// add offsets back on to the regressed values
	const yLabelPositions = sortedYs.map(({ i }, j) => regressedYs[j] + cumulativeHeights[i]);

	//////////////// Calculate elbow position for leader lines ///////////////

	// Group together proximate selected labels (after dodging)
	// to allow for elbow offsetting
	const leaderLineGroups = [];
	sortedYs.forEach((arr, i) => {
		const y = yLabelPositions[i];
		let group = leaderLineGroups.find((g) => Math.abs(g.y - y) < labelProximityThreshold);
		if (!group) {
			group = { y, items: [] };
			leaderLineGroups.push(group);
		}
		group.items.push(i);
		group.y = y;
	});

	const elbowOffsets = Array(selected.length).fill(0);
	const isDodged = Array(selected.length).fill(false);
	// console.log({ leaderLineGroups });

	leaderLineGroups.forEach((group) => {
		const indices = group.items;

		const middleElbowOffset = indices.length > 2 ? elbowRoom : elbowRoom / 2;

		const elbowGap =
			indices.length > 2 ? middleElbowOffset / Math.floor((indices.length - 1) / 2) : 0;

		indices.forEach((labelIndex, groupIndex) => {
			const offset =
				middleElbowOffset - Math.floor(Math.abs(groupIndex - (indices.length - 1) / 2)) * elbowGap;

			elbowOffsets[labelIndex] = offset;
			isDodged[labelIndex] = indices.length > 1;
		});
	});

	// const lookup = selected.map((_, i) => ({ y: yLabelPositions[i], elbow: elbowOffsets[i] }));
	const lookup = Array(selected.length).fill(null);
	sortedYs.forEach(
		(d, i) =>
			(lookup[d.i] = {
				value: sortedYs[i].value,
				y: yLabelPositions[i],
				elbow: elbowOffsets[i],
				isDodged: isDodged[i]
			})
	);
	return lookup;
}
