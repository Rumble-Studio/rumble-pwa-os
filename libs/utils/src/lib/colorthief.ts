import { Pixel, quantize } from './quantize';

function createPixelArray(imgData: Uint8ClampedArray, pixelCount: number, quality: number) {
	const pixels = imgData;
	const pixelArray: Pixel[] = [];

	for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
		offset = i * 4;
		r = pixels[offset + 0];
		g = pixels[offset + 1];
		b = pixels[offset + 2];
		a = pixels[offset + 3];

		// If pixel is mostly opaque and not white
		if (typeof a === 'undefined' || a >= 125) {
			if (!(r > 250 && g > 250 && b > 250)) {
				pixelArray.push([r, g, b]);
			}
		}
	}
	return pixelArray;
}

function validateOptions(options: { colorCount: number; quality: number }) {
	let { colorCount, quality } = options;

	if (typeof colorCount === 'undefined' || !Number.isInteger(colorCount)) {
		colorCount = 10;
	} else if (colorCount === 1) {
		throw new Error('colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()');
	} else {
		colorCount = Math.max(colorCount, 2);
		colorCount = Math.min(colorCount, 20);
	}

	if (typeof quality === 'undefined' || !Number.isInteger(quality) || quality < 1) {
		quality = 10;
	}

	return {
		colorCount,
		quality,
	};
}

/*
  CanvasImage Class
  Class that wraps the html image element and canvas.
  It also simplifies some of the canvas context manipulation
  with a set of helper functions.
*/

class CanvasImage {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D | null;
	width: number;
	height: number;

	constructor(image: HTMLImageElement) {
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.width = this.canvas.width = image.naturalWidth;
		this.height = this.canvas.height = image.naturalHeight;
		if (this.context) {
			this.context.drawImage(image, 0, 0, this.width, this.height);
		}
	}
	getImageData() {
		return this.context?.getImageData(0, 0, this.width, this.height);
	}
}

export class ColorThief {
	/*
	 * getColor(sourceImage[, quality])
	 * returns {r: num, g: num, b: num}
	 *
	 * Use the median cut algorithm provided by quantize.js to cluster similar
	 * colors and return the base color from the largest cluster.
	 *
	 * Quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
	 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
	 * faster a color will be returned but the greater the likelihood that it will not be the visually
	 * most dominant color.
	 *
	 * */
	getColor(sourceImage: HTMLImageElement, quality = 10) {
		const palette = this.getPalette(sourceImage, 5, quality);
		const dominantColor = palette[0];
		return dominantColor;
	}

	/*
	 * getPalette(sourceImage[, colorCount, quality])
	 * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
	 *
	 * Use the median cut algorithm provided by quantize.js to cluster similar colors.
	 *
	 * colorCount determines the size of the palette; the number of colors returned. If not set, it
	 * defaults to 10.
	 *
	 * quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
	 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
	 * faster the palette generation but the greater the likelihood that colors will be missed.
	 *
	 *
	 */
	getPalette(sourceImage: HTMLImageElement, colorCount: number, quality: number) {
		const options = validateOptions({
			colorCount,
			quality,
		});

		// Create custom CanvasImage object
		const image = new CanvasImage(sourceImage);
		const imageData = image.getImageData();
		if (!imageData) {
			throw new Error('No image data available');
		}
		const pixelCount = image.width * image.height;

		const pixelArray = createPixelArray(imageData.data, pixelCount, options.quality);

		// Send array to quantize function which clusters values
		// using median cut algorithm
		const cmap = quantize(pixelArray, options.colorCount);
		const palette = cmap ? cmap.palette() : [];

		return palette;
	}

	getColorFromUrl(imageUrl: string, callback: (arg0: Pixel, arg1: string) => void, quality: number) {
		const sourceImage = document.createElement('img');

		sourceImage.addEventListener('load', () => {
			const palette = this.getPalette(sourceImage, 5, quality);
			const dominantColor = palette[0];
			callback(dominantColor, imageUrl);
		});
		sourceImage.src = imageUrl;
	}

	// getImageData(
	//   imageUrl: string | URL,
	//   callback: (dataUriBase64: string) => unknown
	// ) {
	//   const xhr = new XMLHttpRequest();
	//   xhr.open('GET', imageUrl, true);
	//   xhr.responseType = 'arraybuffer';
	//   xhr.onload = function () {
	//     if (this.status == 200) {
	//       const uInt8Array = new Uint8Array(this.response);
	//       const binaryString = new Array(uInt8Array.length);
	//       for (let i = 0; i < uInt8Array.length; i++) {
	//         binaryString[i] = String.fromCharCode(uInt8Array[i]);
	//       }
	//       const data = binaryString.join('');
	//       const base64 = window.btoa(data);
	//       callback('data:image/png;base64,' + base64);
	//     }
	//   };
	//   xhr.send();
	// }

	// getColorAsync(
	//   imageUrl: string,
	//   callback: (arg0: Pixel, arg1: this) => void,
	//   quality: number
	// ) {
	//   this.getImageData(imageUrl, (imageData) => {
	//     const sourceImage = document.createElement('img');
	//     sourceImage.addEventListener('load', () => {
	//       const palette = this.getPalette(sourceImage, 5, quality);
	//       const dominantColor = palette[0];
	//       callback(dominantColor, this);
	//     });
	//     sourceImage.src = imageData;
	//   });
	// }
}
