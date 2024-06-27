export function makeCurlyBrace(x1, y1, x2, y2, w, q) {
	//Calculate unit vector
	var dx = x1 - x2;
	var dy = y1 - y2;
	var len = Math.sqrt(dx * dx + dy * dy);
	dx = dx / len;
	dy = dy / len;

	//Calculate Control Points of path,
	var qx1 = x1 + q * w * dy;
	var qy1 = y1 - q * w * dx;
	var qx2 = x1 - 0.25 * len * dx + (1 - q) * w * dy;
	var qy2 = y1 - 0.25 * len * dy - (1 - q) * w * dx;
	var tx1 = x1 - 0.5 * len * dx + w * dy;
	var ty1 = y1 - 0.5 * len * dy - w * dx;
	var qx3 = x2 + q * w * dy;
	var qy3 = y2 - q * w * dx;
	var qx4 = x1 - 0.75 * len * dx + (1 - q) * w * dy;
	var qy4 = y1 - 0.75 * len * dy - (1 - q) * w * dx;

	return (
		'M ' +
		x1 +
		' ' +
		y1 +
		' Q ' +
		qx1 +
		' ' +
		qy1 +
		' ' +
		qx2 +
		' ' +
		qy2 +
		' T ' +
		tx1 +
		' ' +
		ty1 +
		' M ' +
		x2 +
		' ' +
		y2 +
		' Q ' +
		qx3 +
		' ' +
		qy3 +
		' ' +
		qx4 +
		' ' +
		qy4 +
		' T ' +
		tx1 +
		' ' +
		ty1
	);
}
