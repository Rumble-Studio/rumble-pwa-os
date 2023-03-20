const nxPreset = require('@nrwl/jest/preset').default;

module.exports = {
	...nxPreset,

	transform: {
		'^.+\\.(ts|mjs|js|html)$': 'jest-preset-angular',
	},
	transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
};
