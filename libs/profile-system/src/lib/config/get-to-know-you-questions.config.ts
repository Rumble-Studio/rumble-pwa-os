export const GET_TO_KNOW_YOU_DATA_KEY = 'getToKnowYou';

export type GetToKnowYouAnswer = string[];

export interface GetToKnowYouChoice {
	id: string;
	displayValue: string;
	icon?: string;
}
export interface GetToKnowYouQuestion {
	questionId: string;
	question: string;
	possibleChoices: GetToKnowYouChoice[];
	kind: 'select' | 'input';
	multiple?: boolean;
}

export const GET_TO_KNOW_YOU_QUESTIONS: GetToKnowYouQuestion[] = [
	{
		questionId: 'describesYou',
		question: 'What describes you best?',
		possibleChoices: [
			{
				id: 'podcasting-agency',
				displayValue: 'Podcasting Agency',
				icon: 'supervised_user_circle',
			},
			{
				id: 'creative-agency',
				displayValue: 'Creating agency',
				icon: 'flare',
			},
			{
				id: 'digital-agency',
				displayValue: 'Digital Agency',
				icon: 'weekend',
			},
			{
				id: 'company',
				displayValue: 'Company',
				icon: 'memory',
			},
			{
				id: 'podcaster',
				displayValue: 'Podcaster',
				icon: 'wb_incandescent',
			},
			{
				id: 'media',
				displayValue: 'Media',
				icon: 'headset_mic',
			},
			{
				id: 'entrepreneur',
				displayValue: 'Entrepreneur',
				icon: 'thumb_up',
			},
			{
				id: 'sales',
				displayValue: 'Investor',
				icon: 'trending_up',
			},
			{
				id: 'other',
				displayValue: 'Other',
				icon: 'signal_cellular_alt',
			},
		],
		kind: 'select',
		multiple: false,
	},
	{
		questionId: 'company_size',
		question: 'How many people are in your organization?',
		possibleChoices: [
			{
				id: '1',
				displayValue: '1',
			},
			{
				id: '2-10',
				displayValue: 'Between 2 and 10',
			},
			{
				id: '11-50',
				displayValue: 'Between 11 and 50',
			},
			{
				id: '51-100',
				displayValue: 'Between 51 and 100',
			},
			{
				id: '100-500',
				displayValue: 'Between 100 and 500',
			},
			{
				id: '501-1000',
				displayValue: 'Between 501 and 1000',
			},
			{
				id: '1000+',
				displayValue: 'More than 1000',
			},
		],
		kind: 'select',
		multiple: false,
	},
	{
		//
		questionId: 'why-a-podcast',
		question: 'Why do you want to create audio contents? (tick all that apply)',
		possibleChoices: [
			{
				id: 'podcasting-Services',
				displayValue: 'Sell podcasting services',
			},
			{
				id: 'agency-Services',
				displayValue: 'Sell other agency services',
			},
			{
				id: 'company-Branding',
				displayValue: 'Company branding',
			},
			{
				id: 'sales-Ads',
				displayValue: 'Product sales / ad revenue',
			},
			{
				id: 'personal-Branding',
				displayValue: 'Personal branding',
			},
			{
				id: 'personal-Income',
				displayValue: 'Personal income',
			},
			{
				id: 'self-Improvement',
				displayValue: 'Self improvement',
			},
			{
				id: 'just-For-Fun',
				displayValue: 'Just for fun',
			},
			{
				id: 'other',
				displayValue: 'Other',
			},
		],
		kind: 'select',
		multiple: true,
	},
	{
		questionId: 'why-rumble-today',
		question: 'Why did you decide to sign-up for Rumble Studio? Do you have a particular project in mind?',
		possibleChoices: [],
		kind: 'input',
	},

	{
		questionId: 'alreadyHavePodcast',
		// value: false,
		possibleChoices: [
			{
				id: 'yes',
				displayValue: 'Yes',
			},
			{
				id: 'no',
				displayValue: 'No',
			},
		],
		question: 'Do you already have a podcast?',
		kind: 'select',
		multiple: false,
	},
	{
		questionId: 'usage',
		question: 'What will be the main use of Rumble Studio?',
		possibleChoices: [
			{
				displayValue: 'Internal Communication',
				id: 'internal',
				icon: 'forum',
			},
			{
				displayValue: 'Other',
				id: 'other',
				icon: 'supervisor_account',
			},
			{
				displayValue: 'Surveys',
				icon: 'weekend',
				id: 'surveys',
			},

			{
				displayValue: 'Testimonials',
				id: 'testimonials',
				icon: 'contacts',
			},
			{
				displayValue: 'Podcast show(s)',
				id: 'podcast',
				icon: 'thumb_up',
			},
		],
		kind: 'select',
		multiple: false,
	},
];
