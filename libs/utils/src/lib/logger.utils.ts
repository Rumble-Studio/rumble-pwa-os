export function rslog(parent: any, method: string, color: string, ...args: any[]): void {
	console.log(
		'%c[' + (parent.constructor.name == 'String' ? parent : parent.constructor.name) + '](' + method + ')',
		'color:' + color,
		...args
	);
}

export function rsDrawLog(url: string, height: number = 1000, width: number = 1000, scale: number = 1) {
	// Create a new `Image` instance
	const image = new Image();

	image.onload = function () {
		// Inside here we already have the dimensions of the loaded image
		const style = [
			// Hacky way of forcing image's viewport using `font-size` and `line-height`
			'font-size: 1px;',
			'line-height: ' + (height % 2) + 'px;',

			// Hacky way of forcing a middle/center anchor point for the image
			'padding: ' + height * scale * 0.5 + 'px ' + width * scale * 0.5 + 'px;',

			// Set image dimensions
			'background-size: ' + width * scale + 'px ' + height * scale + 'px;',

			// Set image URL
			'background: url(' + url + ');',
			// center contain no-repeat
			'background-repeat: no-repeat;',
			'background-position: center;',
			'background-size: contain;',
		].join(' ');

		// notice the space after %c
		console.log('%c ', style);
	};

	// Actually loads the image
	image.src = url;
}
