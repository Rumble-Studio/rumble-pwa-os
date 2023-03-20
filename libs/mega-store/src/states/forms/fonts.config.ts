export const AVAILABLE_FONTS = [
	{
		label: 'Roboto',
		value: 'Roboto, sans-serif',
	},
	{
		label: 'Lobster',
		value: 'Lobster, cursive',
	},
	{
		label: 'Cinzel',
		value: 'Cinzel, serif',
	},
	{
		label: 'FredokaOne',
		value: 'FredokaOne, cursive',
	},
	{
		label: 'ShadowsIntoLight',
		value: 'ShadowsIntoLight, cursive',
	},
	{
		label: 'Shizuru',
		value: 'Shizuru, cursive',
	},
	{
		label: 'DancingScript',
		value: 'DancingScript, cursive',
	},
	{
		label: 'Teko',
		value: 'Teko, sans-serif',
	},
	{
		label: 'Poppins',
		value: 'Poppins, sans-serif',
	},
];

export function convertFontLabelToFontValue(fontName: string) {
	return AVAILABLE_FONTS.find((fontAvailable) => fontAvailable.label === fontName)?.value;
}
