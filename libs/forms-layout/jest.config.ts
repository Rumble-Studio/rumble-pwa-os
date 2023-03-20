/* eslint-disable */
export default {
	displayName: 'forms-layout',
	preset: '../../jest.preset.js',
	setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.spec.json',
			stringifyContentPathRegex: '\\.(html|svg)$',
		},
	},
	coverageDirectory: '../../coverage/libs/forms-layout',
	// transform: {
	//   '^.+\\.(ts|js|html)$': 'jest-preset-angular',
	// },
	// transformIgnorePatterns: ['/node_modules/(?!angular-shepherd)'],
	snapshotSerializers: [
		'jest-preset-angular/build/serializers/no-ng-attributes',
		'jest-preset-angular/build/serializers/ng-snapshot',
		'jest-preset-angular/build/serializers/html-comment',
	],
};
