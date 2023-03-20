export interface TextDataToPDF {
	text: string;
	type: 'HEADER' | 'SUBTITLE_UP' | 'SUBTITLE_DOWN' | 'FOOTER' | 'TITLE';
	fontFamily?: 'Arial' | 'Courier' | 'Helvetica' | 'Times' | 'Symbol';
	fontStyle?: 'I' | 'B' | 'U'; // Italic, Bold, Underline
	fontSize?: number;
	align?: 'C' | 'R'; // default is 'L' which is left align,
	fontColor?: string;
}
export interface ImageDataToPDF {
	imageId: string;
	type?: 'BRAND_IMAGE';
}
export interface DataToPDF {
	textsToPrint: TextDataToPDF[];
	qrCode?: {
		link: string;
		color?: string;
		backgroundColor?: string;
	};
	backgroundColor?: string;
	images: ImageDataToPDF[];
}
