import { Syncable } from '../../others/types';

export interface Form extends Syncable {
	id: string;
	title?: string;
	description?: string;
	ownerId: string;
	scriptId?: string;
	brandId?: string | null;
	data?: string;
}

export interface FormData {
	isOffline?: boolean;
	preventEditing?: boolean;
	sharedWith?: string[];
	customisationDetails?: FormCustomisationDetails;
}

export const LAYOUTS = {
	NO_IMAGE: 'No image',
	IMAGE_AS_BACKGROUND: 'Use image for background',
	IMAGE_LEFT_FULL: 'Use image on the left, full height',
	IMAGE_LEFT_CENTERED: 'Use image on the left, centered',
	IMAGE_RIGHT_FULL: 'Use image on the right, full height',
	IMAGE_RIGHT_CENTERED: 'Use image on the right, centered',
	IMAGE_TOP_FULL: 'Use image on the top, full width',
	IMAGE_TOP_CENTERED: 'Use image on the top, centered',
	IMAGE_BOTTOM_FULL: 'Use image on the bottom, full width',
	IMAGE_BOTTOM_CENTERED: 'Use image on the bottom, centered',
};

export type LayoutOption = keyof typeof LAYOUTS;

export interface FormCustomisationDetails {
	/** background color */
	color?: string;

	/** used for text and mat-icons */
	fontColor?: string;

	actionBtnFontColor?: string;
	actionBtnBackgroundColor?: string;
	progressBarColor?: string;
	playbarColor?: string;

	// button radius
	borderRadius?: number;

	// extra
	customPlayerAvatarSrc?: string;

	// font
	font?: string;
	fontSizePx?: number;

	// image and layout
	layout?: LayoutOption;
	imageSrc?: string;
	imageOpacity?: number;
	imageSizeRatio?: number;
	showHostAvatar?: boolean; // unused

	forceDisplayOnSmallScreen?: boolean;

	// to help at customisation
	brandId?: string | null;

	hideStepList?: boolean;
	hideProgressBar?: boolean;

	wordsMapping?: { [key: string]: string };
}

export interface FormCustomisationDetailsWithName {
	name: string;
	formCustomisationDetails: FormCustomisationDetails;
}

export const DEFAULT_CUSTOMISATION_DETAILS: FormCustomisationDetails = {
	color: '#ffffff',
	fontColor: '#000000',
	actionBtnFontColor: '#3f4147', // grey dark
	actionBtnBackgroundColor: '#fdf4ce10', // yellow super light
	progressBarColor: '#fdf4ce', // yellow super light
	playbarColor: '#fdf4ce', // yellow super light,

	borderRadius: 4,

	imageOpacity: 1,
	fontSizePx: 18,
	layout: 'NO_IMAGE',
	imageSizeRatio: 0.5,
	showHostAvatar: false,
	brandId: undefined,

	forceDisplayOnSmallScreen: false,

	hideStepList: false,
	hideProgressBar: false,
	wordsMapping: {
		"Let's go": "Let's go",
		'Continue as': 'Continue as',
		'Connect as a different user': 'Connect as a different user',
		'Loading your details': 'Loading your details',
		OK: 'OK',
		'Go back': 'Go back',
		microphone: 'microphone',
		mic: 'mic',
		'Celebrate again': 'Celebrate again',
		'Try Rumble Studio': 'Try Rumble Studio',
		'Your answer': 'Your answer',
		Firstname: 'Firstname',
		Lastname: 'Lastname',
		'Profile picture': 'Profile picture',
		'Drop or browse files': 'Drop or browse files',
		'Your linkedin porfile URL': 'Your linkedin porfile URL',
		'Your twitter profile URL': 'Your twitter profile URL',
		'Your website URL': 'Your website URL',
		'Tell us a little bit about yourself': 'Tell us a little bit about yourself',
		Email: 'Email',
		'Share this interview': 'Share this interview',
		Done: 'Done',
	},
};

export const NEW_FORM_CUSTOMISATION: FormCustomisationDetails = {
	...DEFAULT_CUSTOMISATION_DETAILS,
	color: '#2D2D2D',
	fontColor: '#F8E173',
	actionBtnFontColor: '#2D2D2D',
	actionBtnBackgroundColor: '#F8E173',
	progressBarColor: '#F8E173',
	playbarColor: '#F8E173',
};

export function createForm(params?: Partial<Form>) {
	return {
		...params,
	} as Form;
}
