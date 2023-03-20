import { Plan } from './subscription.model';

export const FEATURES_ALWAYS_INCLUDED = [
	{ name: 'Take-turns audio recorder™', unit: undefined, available: true },
	{ name: 'Interview creator', unit: undefined, available: true },
	{ name: 'Interview templates', unit: undefined, available: true },
	{ name: 'Rumble invitation links', unit: undefined, available: true },
	{ name: 'Unlimited audio recording and preview', unit: undefined, available: true },
	{ name: 'High-quality audio exports in WAV and MP3', unit: undefined, available: true },
	{ name: 'Bulk export and download', unit: undefined, available: true },
	{ name: 'Advanced export mix tool', unit: undefined, available: true },
	{ name: 'Magic sparkles audio enhancement', unit: undefined, available: true },
	{ name: 'Royalty-free jingles and sound packs', unit: undefined, available: true },
	{ name: 'Unlimited transcriptions', unit: undefined, available: true },
	{ name: 'Text: image and video capture', unit: undefined, available: true },
	{ name: 'Help center and training resources', unit: undefined, available: true },
	{ name: 'Embeddable player', unit: undefined, available: true },
];

export const PLANS: Plan[] = [
	{
		grantMapping: 'creator',
		name: 'Creator',
		description: 'Everything you need to create interviews and export audio.',
		priceLine: {
			perMonth: {
				currency: '$',
				amount: '9',
			},
		},
		features: [
			{ name: 'Branding kits', unit: '3', available: true },
			{ name: 'Export audio', unit: '10h/month', available: true },
			{ name: 'Included seat', unit: '1', available: true },
			{ name: 'Extra seats', unit: '0', available: false },
			// creator
		],
	},
	{
		grantMapping: 'pro',
		name: 'Pro',
		description: 'Everything you need to create interviews and export audio.',
		priceLine: {
			perMonth: {
				currency: '$',
				amount: '99',
			},
		},
		features: [
			{ name: 'Branding kits', unit: '10', available: true },
			{ name: 'Export audio', unit: '50h/month', available: true },
			{ name: 'Included seats', unit: '3', available: true },
			// pro
		],
	},
	{
		grantMapping: 'team',
		name: 'Team',
		description: 'Everything you need to create interviews and export audio.',
		priceLine: {
			perMonth: {
				currency: '$',
				amount: '499',
			},
		},
		features: [
			{ name: 'Branding kits', unit: '♾️', available: true },
			{ name: 'Export audio', unit: '150h/month', available: true },
			{ name: 'Included seats', unit: '10', available: true },
			// teamm
		],
	},

	{
		grantMapping: 'basic',
		name: 'Basic',
		description: 'Everything you need to create interviews and export audio.',
		priceLine: {
			perMonth: {
				currency: '$',
				amount: '9',
			},
		},
		features: [
			{ name: 'Branding kits', unit: '3', available: true },
			{ name: 'Export audio', unit: '10h/month', available: true },
			{ name: 'Included seat', unit: '1', available: true },
			{ name: 'Extra seats', unit: '0', available: false },
			// creator
		],
	},
	{
		grantMapping: 'plus',
		name: 'Plus',
		description: 'Everything you need to create interviews, export audio, and collaborate with a small team.',
		priceLine: {
			perMonth: {
				currency: '$',
				amount: '99',
			},
		},
		features: [
			{ name: 'Branding kits', unit: '10', available: true },
			{ name: 'Export audio', unit: '50h/month', available: true },
			{ name: 'Included seats', unit: '3', available: true },
			// pro
		],
	},
	{
		grantMapping: 'advanced',
		name: 'Advanced',
		description: 'More seats and kits, for bigger teams.',
		priceLine: {
			perMonth: {
				currency: '$',
				amount: '499',
			},
		},
		features: [
			{ name: 'Branding kits', unit: '♾️', available: true },
			{ name: 'Export audio', unit: '150h/month', available: true },
			{ name: 'Included seats', unit: '10', available: true },
			// teamm
		],
	},

	{
		grantMapping: 'rumblestudio_tier1', // like basic
		name: 'AppSumo 🌮 1st Tier 🌮 Basic',
		description: 'Everything you need to create interviews and export audio.',
		priceLine: {
			// perMonth: {
			// 	currency: '$',
			// 	amount: '9',
			// },
		},
		features: [
			{ name: 'Branding kits', unit: '3', available: true },
			{ name: 'Export audio', unit: '10h/month', available: true },
			{ name: 'Included seat', unit: '1', available: true },
			{ name: 'Extra seats', unit: '0', available: false },
			// creator
		],
	},
	{
		grantMapping: 'rumblestudio_tier2', // like plus
		name: 'AppSumo 🌮 2nd Tier 🌮 Plus',
		description: 'Everything you need to create interviews, export audio, and collaborate with a small team.',
		priceLine: {
			// perMonth: {
			// 	currency: '$',
			// 	amount: '99',
			// },
		},
		features: [
			{ name: 'Branding kits', unit: '10', available: true },
			{ name: 'Export audio', unit: '50h/month', available: true },
			{ name: 'Included seats', unit: '3', available: true },
			// pro
		],
	},
	{
		grantMapping: 'rumblestudio_tier3', // like advanced
		name: 'AppSumo 🌮 3rd Tier 🌮 Advanced',
		description: 'More seats and kits, for bigger teams.',
		priceLine: {
			// perMonth: {
			// 	currency: '$',
			// 	amount: '499',
			// },
		},
		features: [
			{ name: 'Branding kits', unit: '♾️', available: true },
			{ name: 'Export audio', unit: '500h/month', available: true },
			{ name: 'Included seats', unit: '10', available: true },
			// teamm
		],
	},
];
