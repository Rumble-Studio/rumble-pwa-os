import { FormCustomisationDetails } from '@rumble-pwa/mega-store';

export interface CUSTOMISATION_ITEM {
	name: string;
	customisationData: FormCustomisationDetails;
}

const BASIC_CUSTOMISATION: CUSTOMISATION_ITEM = {
	name: 'Basic',
	customisationData: {
		color: '#ffffff',
		fontColor: '#000000',
	},
};

const ACCESSIBILITY_CUSTOMISATION: CUSTOMISATION_ITEM = {
	name: 'Large font',
	customisationData: {
		color: '#ffffff',
		fontColor: '#000000',
		fontSizePx: 30,
	},
};

const BASIC_CUSTOMISATION_DARK_MODE: CUSTOMISATION_ITEM = {
	name: 'White on black',
	customisationData: {
		color: '#000000',
		fontColor: '#ffffff',
	},
};

const CUSTOMISATION_WITH_IMAGE_LEFT_CENTERED: CUSTOMISATION_ITEM = {
	name: 'Image centered on the left',
	customisationData: {
		layout: 'IMAGE_LEFT_CENTERED',
		imageOpacity: 1,
		imageSrc: '/assets/backgrounds/podcast-two-persons.jpg',
	},
};

const CUSTOMISATION_WITH_SIMPLE_BACKGROUND_IMAGE: CUSTOMISATION_ITEM = {
	name: 'Background image',
	customisationData: {
		layout: 'IMAGE_AS_BACKGROUND',
		imageOpacity: 0.8,
		imageSrc: '/assets/backgrounds/simple-background.jpg',
	},
};

const CUSTOMISATION_WITH_IMAGE_RIGHT_FULL: CUSTOMISATION_ITEM = {
	name: 'Full height image on the right',
	customisationData: {
		layout: 'IMAGE_RIGHT_FULL',
		imageOpacity: 1,
		imageSrc: '/assets/backgrounds/light-background.jpg',
	},
};

const CUSTOMISATION_WITH_IMAGE_TOP_FULL: CUSTOMISATION_ITEM = {
	name: 'Full width image on the top',
	customisationData: {
		layout: 'IMAGE_TOP_FULL',
		imageOpacity: 1,
		imageSrc: '/assets/backgrounds/dark-background.jpg',
	},
};

const CUSTOMISATION_WITH_LOW_OPACTITY_BACKGROUND_IMAGE: CUSTOMISATION_ITEM = {
	name: 'Background image with low opacity',
	customisationData: {
		layout: 'IMAGE_AS_BACKGROUND',
		imageOpacity: 0.05,
		imageSrc: '/assets/backgrounds/red-background.jpg',
	},
};

const CUSTOMISATION_SASSY: CUSTOMISATION_ITEM = {
	name: 'Hand written',
	customisationData: {
		fontSizePx: 25,
		font: 'DancingScript',
	},
};

export const CUSTOMISATION_LIBRAIRY: CUSTOMISATION_ITEM[] = [
	BASIC_CUSTOMISATION,
	ACCESSIBILITY_CUSTOMISATION,
	BASIC_CUSTOMISATION_DARK_MODE,
	CUSTOMISATION_WITH_IMAGE_LEFT_CENTERED,
	CUSTOMISATION_WITH_SIMPLE_BACKGROUND_IMAGE,
	CUSTOMISATION_WITH_IMAGE_RIGHT_FULL,
	CUSTOMISATION_WITH_IMAGE_TOP_FULL,
	CUSTOMISATION_WITH_LOW_OPACTITY_BACKGROUND_IMAGE,
	CUSTOMISATION_SASSY,
];

export const STOCK_IMAGES_SRC: string[] = [
	'/assets/backgrounds/podcast-two-persons.jpg',
	'/assets/backgrounds/simple-background.jpg',
	'/assets/backgrounds/light-background.jpg',
	'/assets/backgrounds/dark-background.jpg',
	'/assets/backgrounds/red-background.jpg',
	'/assets/backgrounds/podcast-background.jpg',
	'/assets/backgrounds/podcast-big-micro.jpg',
];
