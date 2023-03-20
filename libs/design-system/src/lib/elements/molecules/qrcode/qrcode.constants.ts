import { QrcodeElementTypes, QrcodeErrorCorrectionLevels, QrcodeVersionType } from './qrcode.types';

export const DEFAULT_VALUES = {
	elementType: QrcodeElementTypes.URL,
	cssClass: 'qrcode',
	value: 'https://www.techiediaries.com',
	version: '' as QrcodeVersionType,
	errorCorrectionLevel: QrcodeErrorCorrectionLevels.MEDIUM,
	margin: 4,
	scale: 4,
	width: 10,
	colorDark: '#000',
	colorLight: '#FFF',
};
