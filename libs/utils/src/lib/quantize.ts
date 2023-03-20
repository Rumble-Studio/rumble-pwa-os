import { max, sum } from 'lodash';

// private constants
const sigbits = 5,
	rshift = 8 - sigbits,
	maxIterations = 1000,
	fractByPopulations = 0.75;

// Simple priority queue

class PQueue<T> {
	comparator: (a: T, b: T) => number;
	contents: T[] = [];
	sorted = false;

	constructor(comparator: (a: T, b: T) => number) {
		this.comparator = comparator;
	}

	sort(alternativeComparator?: (a: T, b: T) => number) {
		this.contents.sort(alternativeComparator ? alternativeComparator : this.comparator);
		this.sorted = true;
	}

	push(o: T) {
		this.contents.push(o);
		this.sorted = false;
	}
	peek(index: number) {
		if (!this.sorted) this.sort();
		if (index === undefined) index = this.contents.length - 1;
		return this.contents[index];
	}
	pop() {
		if (!this.sorted) this.sort();
		return this.contents.pop();
	}
	size() {
		return this.contents.length;
	}
	map(f: (value: T, index: number, array: T[]) => T) {
		return this.contents.map(f);
	}
	debug() {
		if (!this.sorted) this.sort();
		return this.contents;
	}
}

// get reduced-space color index for a pixel

function getColorIndex(r: number, g: number, b: number) {
	return (r << (2 * sigbits)) + (g << sigbits) + b;
}

export type Pixel = [number, number, number];

// 3d color space box

class VBox {
	r1: number;
	r2: number;
	g1: number;
	g2: number;
	b1: number;
	b2: number;
	histo: number[];

	_volume?: number;
	_count_set = false;
	_count = 0;
	_avg?: Pixel;

	constructor(r1: number, r2: number, g1: number, g2: number, b1: number, b2: number, histo: number[]) {
		this.r1 = r1;
		this.r2 = r2;
		this.g1 = g1;
		this.g2 = g2;
		this.b1 = b1;
		this.b2 = b2;
		this.histo = histo;
	}

	getProp(propName: string) {
		switch (propName) {
			case 'r1':
				return this.r1;
				break;
			case 'r2':
				return this.r2;
				break;
			case 'g1':
				return this.g1;
				break;
			case 'g2':
				return this.g2;
				break;
			case 'b1':
				return this.b1;
				break;
			case 'b2':
				return this.b2;
				break;
			default:
				throw new Error('Not accessible via this method');
				break;
		}
	}

	setProp(propName: string, value: number) {
		switch (propName) {
			case 'r1':
				this.r1 = value;
				break;
			case 'r2':
				this.r2 = value;
				break;
			case 'g1':
				this.g1 = value;
				break;
			case 'g2':
				this.g2 = value;
				break;
			case 'b1':
				this.b1 = value;
				break;
			case 'b2':
				this.b2 = value;
				break;
			default:
				throw new Error('Not accessible via this method');
				break;
		}
	}

	volume(force = false) {
		if (!this._volume || force) {
			this._volume = (this.r2 - this.r1 + 1) * (this.g2 - this.g1 + 1) * (this.b2 - this.b1 + 1);
		}
		return this._volume;
	}
	count(force = false) {
		if (!this._count_set || force) {
			let npix = 0,
				i,
				j,
				k,
				index;
			for (i = this.r1; i <= this.r2; i++) {
				for (j = this.g1; j <= this.g2; j++) {
					for (k = this.b1; k <= this.b2; k++) {
						index = getColorIndex(i, j, k);
						npix += this.histo[index] || 0;
					}
				}
			}
			this._count = npix;
			this._count_set = true;
		}
		return this._count;
	}
	copy() {
		return new VBox(this.r1, this.r2, this.g1, this.g2, this.b1, this.b2, this.histo);
	}
	avg(force = false) {
		if (!this._avg || force) {
			const mult = 1 << (8 - sigbits);
			let ntot = 0,
				rsum = 0,
				gsum = 0,
				bsum = 0;
			for (let i = this.r1; i <= this.r2; i++) {
				for (let j = this.g1; j <= this.g2; j++) {
					for (let k = this.b1; k <= this.b2; k++) {
						const histoindex = getColorIndex(i, j, k);
						const hval = this.histo[histoindex] || 0;
						ntot += hval;
						rsum += hval * (i + 0.5) * mult;
						gsum += hval * (j + 0.5) * mult;
						bsum += hval * (k + 0.5) * mult;
					}
				}
			}
			if (ntot) {
				this._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)];
			} else {
				//console.log('empty box');
				this._avg = [
					~~((mult * (this.r1 + this.r2 + 1)) / 2),
					~~((mult * (this.g1 + this.g2 + 1)) / 2),
					~~((mult * (this.b1 + this.b2 + 1)) / 2),
				];
			}
		}
		return this._avg;
	}

	contains(pixel: Pixel) {
		const rval = pixel[0] >> rshift;
		const gval = pixel[1] >> rshift;
		const bval = pixel[2] >> rshift;
		return rval >= this.r1 && rval <= this.r2 && gval >= this.g1 && gval <= this.g2 && bval >= this.b1 && bval <= this.b2;
	}
}

function naturalOrder(a: number, b: number) {
	return a < b ? -1 : a > b ? 1 : 0;
}

// Color map

class CMap {
	vboxes = new PQueue<{ vbox: VBox; color: Pixel }>((a, b) => {
		return naturalOrder(a.vbox.count() * a.vbox.volume(), b.vbox.count() * b.vbox.volume());
	});

	push(vbox: VBox) {
		this.vboxes.push({
			vbox: vbox,
			color: vbox.avg(),
		});
	}
	palette() {
		return this.vboxes.contents.map(function (vb) {
			return vb.color;
		});
	}
	size() {
		return this.vboxes.size();
	}
	map(color: Pixel) {
		for (let i = 0; i < this.vboxes.size(); i++) {
			if (this.vboxes.peek(i).vbox.contains(color)) {
				return this.vboxes.peek(i).color;
			}
		}
		return this.nearest(color);
	}
	nearest(color: Pixel) {
		let d1, d2, pColor;
		for (let i = 0; i < this.vboxes.size(); i++) {
			d2 = Math.sqrt(
				Math.pow(color[0] - this.vboxes.peek(i).color[0], 2) +
					Math.pow(color[1] - this.vboxes.peek(i).color[1], 2) +
					Math.pow(color[2] - this.vboxes.peek(i).color[2], 2)
			);
			if (d1 === undefined || d2 < d1) {
				d1 = d2;
				pColor = this.vboxes.peek(i).color;
			}
		}
		return pColor;
	}
	forcebw() {
		this.vboxes.sort((a, b) => {
			return naturalOrder(sum(a.color), sum(b.color));
		});

		// force darkest color to black if everything < 5
		const lowest = this.vboxes.contents[0].color;
		if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5) this.vboxes.contents[0].color = [0, 0, 0];

		// force lightest color to white if everything > 251
		const idx = this.vboxes.contents.length - 1,
			highest = this.vboxes.contents[idx].color;
		if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251) this.vboxes.contents[idx].color = [255, 255, 255];
	}
}

// histo (1-d array, giving the number of pixels in
// each quantized region of color space), or null on error

function getHisto(pixels: Pixel[]) {
	const histosize = 1 << (3 * sigbits),
		histo = new Array<number>(histosize);
	let index, rval, gval, bval;
	pixels.forEach(function (pixel) {
		rval = pixel[0] >> rshift;
		gval = pixel[1] >> rshift;
		bval = pixel[2] >> rshift;
		index = getColorIndex(rval, gval, bval);
		histo[index] = (histo[index] || 0) + 1;
	});
	return histo;
}
function vboxFromPixels(pixels: Pixel[], histo: number[]) {
	let rmin = 1000000,
		rmax = 0,
		gmin = 1000000,
		gmax = 0,
		bmin = 1000000,
		bmax = 0,
		rval,
		gval,
		bval;
	// find min/max
	pixels.forEach(function (pixel) {
		rval = pixel[0] >> rshift;
		gval = pixel[1] >> rshift;
		bval = pixel[2] >> rshift;
		if (rval < rmin) rmin = rval;
		else if (rval > rmax) rmax = rval;
		if (gval < gmin) gmin = gval;
		else if (gval > gmax) gmax = gval;
		if (bval < bmin) bmin = bval;
		else if (bval > bmax) bmax = bval;
	});
	return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
}

function medianCutApply(histo: number[], vbox: VBox) {
	if (!vbox.count()) return;

	const rw = vbox.r2 - vbox.r1 + 1,
		gw = vbox.g2 - vbox.g1 + 1,
		bw = vbox.b2 - vbox.b1 + 1,
		maxw = max([rw, gw, bw]);
	// only one pixel, no split
	if (vbox.count() == 1) {
		return [vbox.copy()];
	}
	/* Find the partial sum arrays along the selected axis. */
	const partialsum: number[] = [],
		lookaheadsum: number[] = [];
	let total = 0,
		i,
		j,
		k,
		sum,
		index;
	if (maxw == rw) {
		for (i = vbox.r1; i <= vbox.r2; i++) {
			sum = 0;
			for (j = vbox.g1; j <= vbox.g2; j++) {
				for (k = vbox.b1; k <= vbox.b2; k++) {
					index = getColorIndex(i, j, k);
					sum += histo[index] || 0;
				}
			}
			total += sum;
			partialsum[i] = total;
		}
	} else if (maxw == gw) {
		for (i = vbox.g1; i <= vbox.g2; i++) {
			sum = 0;
			for (j = vbox.r1; j <= vbox.r2; j++) {
				for (k = vbox.b1; k <= vbox.b2; k++) {
					index = getColorIndex(j, i, k);
					sum += histo[index] || 0;
				}
			}
			total += sum;
			partialsum[i] = total;
		}
	} else {
		/* maxw == bw */
		for (i = vbox.b1; i <= vbox.b2; i++) {
			sum = 0;
			for (j = vbox.r1; j <= vbox.r2; j++) {
				for (k = vbox.g1; k <= vbox.g2; k++) {
					index = getColorIndex(j, k, i);
					sum += histo[index] || 0;
				}
			}
			total += sum;
			partialsum[i] = total;
		}
	}
	partialsum.forEach(function (d, i) {
		lookaheadsum[i] = total - d;
	});

	function doCut(color: 'r' | 'g' | 'b') {
		const dim1 = color + '1',
			dim2 = color + '2';
		let left,
			right,
			vbox1: VBox,
			vbox2: VBox,
			d2,
			count2 = 0;
		for (i = vbox.getProp(dim1); i <= vbox.getProp(dim2); i++) {
			if (partialsum[i] > total / 2) {
				vbox1 = vbox.copy();
				vbox2 = vbox.copy();
				left = i - vbox.getProp(dim1);
				right = vbox.getProp(dim2) - i;
				if (left <= right) d2 = Math.min(vbox.getProp(dim2) - 1, ~~(i + right / 2));
				else d2 = Math.max(vbox.getProp(dim1), ~~(i - 1 - left / 2));
				// avoid 0-count boxes
				while (!partialsum[d2]) d2++;
				count2 = lookaheadsum[d2];
				while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2];
				// set dimensions
				vbox1.setProp(dim2, d2);
				vbox2.setProp(dim1, vbox1.getProp(dim2) + 1);
				// console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
				return [vbox1, vbox2];
			}
		}
		return [vbox, null];
	}
	// determine the cut planes
	return maxw == rw ? doCut('r') : maxw == gw ? doCut('g') : doCut('b');
}

export function quantize(pixels: Pixel[], maxcolors: number) {
	// short-circuit
	if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
		// console.log('wrong number of maxcolors');
		return false;
	}

	// XXX: check color content and convert to grayscale if insufficient

	const histo = getHisto(pixels);
	//   histosize = 1 << (3 * sigbits);

	// check that we aren't below maxcolors already
	let nColors = 0;
	histo.forEach(function () {
		nColors++;
	});
	if (nColors <= maxcolors) {
		// XXX: generate the new colors from the histo and return
	}

	// get the beginning vbox from the colors
	const vbox = vboxFromPixels(pixels, histo),
		pq = new PQueue<VBox>(function (a, b) {
			return naturalOrder(a.count(), b.count());
		});
	pq.push(vbox);

	// inner function to do the iteration

	function iter(lh: PQueue<VBox>, target: number) {
		let ncolors = 1,
			niters = 0,
			vbox;
		while (niters < maxIterations) {
			vbox = lh.pop() as VBox;
			if (!vbox.count()) {
				/* just put it back */
				lh.push(vbox);
				niters++;
				continue;
			}
			// do the cut
			const vboxes = medianCutApply(histo, vbox) as VBox[];
			const vbox1 = vboxes[0],
				vbox2 = vboxes[1];

			if (!vbox1) {
				// console.log("vbox1 not defined; shouldn't happen!");
				return;
			}
			lh.push(vbox1);
			if (vbox2) {
				/* vbox2 can be null */
				lh.push(vbox2);
				ncolors++;
			}
			if (ncolors >= target) return;
			if (niters++ > maxIterations) {
				// console.log("infinite loop; perhaps too few pixels!");
				return;
			}
		}
	}

	// first set of colors, sorted by population
	iter(pq, fractByPopulations * maxcolors);
	// console.log(pq.size(), pq.debug().length, pq.debug().slice());

	// Re-sort by the product of pixel occupancy times the size in color space.
	const pq2 = new PQueue<VBox>(function (a, b) {
		return naturalOrder(a.count() * a.volume(), b.count() * b.volume());
	});
	while (pq.size()) {
		pq2.push(pq.pop() as VBox);
		//   pq2.push(pq.pop());
	}

	// next set - generate the median cuts using the (npix * vol) sorting.
	iter(pq2, maxcolors - pq2.size());

	// calculate the actual colors
	const cmap = new CMap();
	while (pq2.size()) {
		cmap.push(pq2.pop() as VBox);
		//   cmap.push(pq2.pop());
	}

	return cmap;
}
