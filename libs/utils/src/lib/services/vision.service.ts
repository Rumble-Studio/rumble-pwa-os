import { Injectable } from '@angular/core';
import { toSvg } from 'jdenticon';
import { capitalize } from '../string.utils';

import { ColorThief } from '../colorthief';

const configYellow = {
	hues: [48],
	saturation: {
		color: 0.92,
		grayscale: 0.92,
	},
	lightness: {
		color: [0.53, 0.53],
		grayscale: [0.53, 0.53],
	},
	backColor: '#fff',
};
const configGreen = {
	hues: [124],
	saturation: {
		color: 0.41,
		grayscale: 0.41,
	},
	lightness: {
		color: [0.49, 0.49],
		grayscale: [0.49, 0.49],
	},
	backColor: '#fff',
};
const configBlue = {
	hues: [205],
	saturation: {
		color: 0.63,
		grayscale: 0.63,
	},
	lightness: {
		color: [0.54, 0.54],
		grayscale: [0.54, 0.54],
	},
	backColor: '#fff',
};
const configPink = {
	hues: [339],
	saturation: {
		color: 0.81,
		grayscale: 0.81,
	},
	lightness: {
		color: [0.51, 0.51],
		grayscale: [0.51, 0.51],
	},
	backColor: '#fff',
};
const configRed = {
	hues: [0],
	saturation: {
		color: 0.77,
		grayscale: 0.77,
	},
	lightness: {
		color: [0.64, 0.64],
		grayscale: [0.64, 0.64],
	},
	backColor: '#fff',
};
const configYellowBis = {
	hues: [48],
	saturation: {
		color: 0.92,
		grayscale: 0.92,
	},
	lightness: {
		color: [0.5, 0.6],
		grayscale: [0.5, 0.6],
	},
	backColor: '#fff',
};
const configGreenBis = {
	hues: [124],
	saturation: {
		color: 0.41,
		grayscale: 0.41,
	},
	lightness: {
		color: [0.45, 0.55],
		grayscale: [0.45, 0.55],
	},
	backColor: '#fff',
};
const configBlueBis = {
	hues: [205],
	saturation: {
		color: 0.63,
		grayscale: 0.63,
	},
	lightness: {
		color: [0.5, 0.6],
		grayscale: [0.5, 0.6],
	},
	backColor: '#fff',
};
const configPinkBis = {
	hues: [339],
	saturation: {
		color: 0.81,
		grayscale: 0.81,
	},
	lightness: {
		color: [0.45, 0.55],
		grayscale: [0.45, 0.55],
	},
	backColor: '#fff',
};
const configRedBis = {
	hues: [0],
	saturation: {
		color: 0.77,
		grayscale: 0.77,
	},
	lightness: {
		color: [0.6, 0.7],
		grayscale: [0.6, 0.7],
	},
	backColor: '#fff',
};
const allColorConfig = [
	configYellow,
	configGreen,
	configBlue,
	configPink,
	configRed,
	configYellowBis,
	configGreenBis,
	configBlueBis,
	configPinkBis,
	configRedBis,
];
const brandPalette = [
	'#4aaf51', // original green
	'#429d48',
	'#3b8c40',
	'#337a38',
	'#2c6930',
	// '#255728',
	// '#1d4620',
	// '#163418',
	'#4196d4', //original blue
	'#3a87be',
	'#3478a9',
	// "#2d6994",
	'#275a7f',
	// "#204b6a",
	// "#1a3c54",
	// "#132d3f",
	'#e71b64', // original pink
	// "#cf185a",
	'#b81550',
	// "#a11246",
	// "#8a103c",
	// "#730d32",
	// "#5c0a28",
	// '#45081e',
	'#ea5a5a', // original red (salmon)
	// '#d25151',
	'#bb4848',
	// '#a33e3e',
	// '#8c3636',
	// '#752d2d',
	// '#5d2424',
	// '#461b1b',
	'#f5ca1b', // original yellow
	'#dcb518',
	'#c4a115',
	'#ab8d12',
	'#937910',
	// "#7a650d",
	// '#62500a',
	// '#493c08',
];

// utils colors function

function hexToRGB(hex: string): Array<number> {
	const r: number = parseInt(hex.slice(1, 3), 16);
	const g: number = parseInt(hex.slice(3, 5), 16);
	const b: number = parseInt(hex.slice(5, 7), 16);
	return [r, g, b];
}

// https://fr.wikipedia.org/wiki/SRGB
function luminance(r: number, g: number, b: number): number {
	const lum: number[] = [r, g, b].map((value: number) => {
		// linear value
		const cLinear = 12.92;
		value = value / 255;
		return value <= 0.03928 ? value / cLinear : Math.pow((value + 0.055) / 1.055, 2.4);
	});
	const relativeLuminance = lum[0] * 0.2126 + lum[1] * 0.7152 + lum[2] * 0.0722;
	return relativeLuminance;
}

function contrast(rgb1: number[], rgb2: number[]): number {
	const lum1: number = luminance(rgb1[0], rgb1[1], rgb1[2]);
	const lum2: number = luminance(rgb2[0], rgb2[1], rgb2[2]);
	const brightest: number = Math.max(lum1, lum2);
	const darkest: number = Math.min(lum1, lum2);
	return (brightest + 0.05) / (darkest + 0.05);
}

//  contrast ratio of 3:1 is the minimum level recommended by [ISO-9241-3] and [ANSI-HFES-100-1988] for standard text and vision https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html#:~:text=A%20contrast%20ratio%20of%203,for%20standard%20text%20and%20vision.
export function checkContrastRatio(colorA: string, colorB: string, contrastRatioValue = 3): boolean {
	const color1: number[] = hexToRGB(colorA);
	const color2: number[] = hexToRGB(colorB);
	const contrastDiff: number = contrast(color1, color2);
	if (contrastDiff > contrastRatioValue) return false;
	return true;
}

@Injectable({
	providedIn: 'root',
})
export class VisionService {
	/**
	 
	 * @url Source of the image to use (will be loaded into a `new Image().src`)
	 * @aspectRatio The aspect ratio to apply
	 * @returns an HTML Canvas element
	 	```js		
			this.visionService.giveMeCentralCrop(blobUrlOrBase64encodingUrl).then((imageCanvas) => {
				const ImageAndQuality:{
					quality: number;
					imgBase64: string;
				} = this.visionService.toDataUrlWithMaxSize(imageCanvas);
			});
			```
	 */
	async giveMeCentralCrop(url: string, aspectRatio: number = 1.0): Promise<HTMLCanvasElement> {
		return new Promise((resolve) => {
			// this image will hold our source image data
			const inputImage = new Image();

			// we want to wait for our image to load
			inputImage.onload = () => {
				// let's store the width and height of our image
				const inputWidth = inputImage.naturalWidth;
				const inputHeight = inputImage.naturalHeight;

				// get the aspect ratio of the input image
				const inputImageAspectRatio = inputWidth / inputHeight;

				// if it's bigger than our target aspect ratio
				let outputWidth = inputWidth;
				let outputHeight = inputHeight;
				if (inputImageAspectRatio > aspectRatio) {
					outputWidth = inputHeight * aspectRatio;
				} else if (inputImageAspectRatio < aspectRatio) {
					outputHeight = inputWidth / aspectRatio;
				}

				// calculate the position to draw the image at
				const outputX = (outputWidth - inputWidth) * 0.5;
				const outputY = (outputHeight - inputHeight) * 0.5;

				// create a canvas that will present the output image
				const outputImage = document.createElement('canvas');

				const minSize = Math.min(outputWidth, outputHeight);
				const maxSize = Math.max(outputWidth, outputHeight);

				let maximumSizeAllowedForCropSelection = 1000;
				let scale = 1;

				if (maxSize > 3000) {
					maximumSizeAllowedForCropSelection = 3000;
					scale = Math.min(
						maximumSizeAllowedForCropSelection / outputWidth,
						maximumSizeAllowedForCropSelection / outputHeight
					);
					console.log('Reducing to 3000px max.');
				} else if (minSize < 1400) {
					maximumSizeAllowedForCropSelection = 1400;
					scale = Math.min(
						maximumSizeAllowedForCropSelection / outputWidth,
						maximumSizeAllowedForCropSelection / outputHeight
					);
					console.log('Upsizing to 1400px min.');
				}

				// set it to the same size as the image
				outputImage.width = scale * outputWidth;
				outputImage.height = scale * outputHeight;

				// draw our image at position 0, 0 on the canvas

				const ctx = outputImage.getContext('2d');
				ctx?.drawImage(inputImage, scale * outputX, scale * outputY, scale * inputWidth, scale * inputHeight);
				resolve(outputImage);
			};

			// start loading our image
			inputImage.src = url;
		});
	}

	toDataUrlWithMaxSize(
		canvasHTML: HTMLCanvasElement,
		maxSize: number = 500000,
		initialQuality: number = 0.9,
		ratio: number = 0.75,
		minimalQuality: number = 0.1
	): {
		quality: number;
		imgBase64: string;
	} {
		let quality = initialQuality;
		console.log('quality:', quality);
		let imgBase64 = canvasHTML.toDataURL('image/jpeg', quality);
		while ((imgBase64.length * 3) / 4 > maxSize) {
			if (ratio * quality < minimalQuality) {
				break;
			}
			quality = ratio * quality;
			console.log('quality:', quality);
			imgBase64 = canvasHTML.toDataURL('image/jpeg', quality);
		}
		console.log('Quality kept:', quality);
		console.log('Image estimated size:', (imgBase64.length * 3) / 4);

		return { quality, imgBase64 };
	}

	giveARandomSvg(hash: string): string {
		const randomColorConfig = allColorConfig[Math.floor(Math.random() * allColorConfig.length)];
		const r = toSvg(hash, 1400, randomColorConfig);
		console.warn({ r });
		return r;
	}

	blobToBase64(blob: Blob, callback: (dataUrl: string) => void) {
		const reader = new FileReader();
		reader.onload = function () {
			const dataUrl = <string>reader.result;
			callback(dataUrl);
		};
		reader.readAsDataURL(blob);
	}

	giveMeRandomBlob(hash: string): Blob {
		const svg = this.giveARandomSvg(hash);
		const blob = new Blob([svg], { type: 'image/svg+xml' });
		return blob;
	}

	giveMeRandomImg(hash: string): Promise<string> {
		return new Promise((resolve) => {
			this.blobToBase64(this.giveMeRandomBlob(hash), (dataUrl) => {
				resolve(dataUrl);
			});
		});
	}

	blobToFile(theBlob: Blob, fileName: string): File {
		return new File([theBlob], fileName, {
			lastModified: new Date().getTime(),
			type: theBlob.type,
		});
	}

	blobToFileOld(theBlob: Blob, fileName: string): File {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const b: any = theBlob;
		//A Blob() is almost a File() - it's just missing the two properties below which we will add
		b.lastModified = Date.now();
		b.name = fileName;
		//Cast to a File() type
		return <File>theBlob;
	}

	giveMeRandomFile(hash: string): File {
		return this.blobToFile(this.giveMeRandomBlob(hash), hash);
	}

	hashCode(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return hash;
	}

	intToRGB(i: number) {
		const c = (i & 0x00ffffff).toString(16).toUpperCase();
		return '00000'.substring(0, 6 - c.length) + c;
	}

	componentToHex(c: number) {
		const hex = c.toString(16);
		return hex.length == 1 ? '0' + hex : hex;
	}

	rgbToHex(r: number, g: number, b: number) {
		return '#' + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
	}

	intToRSColor(i: number) {
		// SHOULD RETURN A COLOR OF OUR BRAND PALETTE !
		const intHash = Math.max(0, ((i % brandPalette.length) + brandPalette.length) % brandPalette.length);
		return brandPalette[intHash];
	}

	avatarImage(letters: string, hash: string, sizeIn: number = 200) {
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		const size = sizeIn || 200;

		if (!context) return '';

		// Generate a random color every time function is called
		// var color = "#" + (Math.random() * 0xFFFFFF << 0).toString(16);
		// var color = "#" + this.intToRGB(this.hashCode(hash))
		const color = this.intToRSColor(this.hashCode(hash));

		// Set canvas with & height
		canvas.width = size;
		canvas.height = size;

		// Select a font family to support different language characters
		// like Arial
		context.font = Math.round(canvas.width / 2) + 'px DM Sans';
		context.textAlign = 'center';

		// Setup background and front color
		context.fillStyle = color;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = '#FFF';
		context.fillText(letters, size / 2, size / 1.5);

		// Set image representation in default format (png)
		const dataURI = canvas.toDataURL();

		// Dispose canvas element
		// canvas = null;

		return dataURI;
	}

	convertStringToPhotoUrl(value: string, hashValue?: string) {
		const aString = value ? value : '..';
		return this.avatarImage(capitalize(aString.substring(0, 2).toLowerCase() + '.'), aString);
	}

	getReplacementImage(event: any, displayName: string) {
		event.target.src = this.convertStringToPhotoUrl(displayName);
	}

	getPlaceholderImage(displayName = '...') {
		return this.convertStringToPhotoUrl(displayName);
	}

	async getImagePaletteFromUrl(url: string, callback: (palette: string[]) => void) {
		const ct = new ColorThief();
		const inputImage = new Image();
		inputImage.onload = () => {
			const result = ct.getPalette(inputImage, 2, 20);
			callback(
				result.map((p) => {
					return this.rgbToHex(p[0], p[1], p[2]);
				})
			);
		};
		// const googleProxyURL =
		// 	'https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=';

		inputImage.crossOrigin = 'Anonymous';
		// inputImage.src = googleProxyURL + encodeURIComponent(url);

		inputImage.src = url;
	}

	/**
	 * Given url, check if images height & width are below threshold
	 * @param imageURL
	 * @param threshold optional, starts at 10
	 * @returns a Promise containing a boolean or undefined
	 */
	private async _isImageSmall$(imageURL: string, threshold = 10): Promise<boolean | undefined> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.src = imageURL;
			image.onload = async (e: any) => {
				const image = new Image();
				image.src = imageURL;
				image.onerror = async () => {
					resolve(false);
				};
				image.onload = async () => {
					resolve(Math.min(image.width, image.height) < threshold);
				};
			};
		});
	}

	/**
	 * given a list of sting, calls the method checking if their with and height are above
	 * a threshold for each one then returns a promise containing all promises
	 * @param imageURLs a list of string
	 * @returns
	 */
	public async areImagesSmall$(imageURLs: string[]): Promise<(boolean | undefined)[]> {
		const newPromises = imageURLs.map((imageURL) => this._isImageSmall$(imageURL));
		const final = await Promise.all(newPromises);
		return final;
	}
}
