const { getJestProjects } = require('@nrwl/jest');

export default {
	projects: [
		...getJestProjects(),
		'<rootDir>/apps/beta',
		'<rootDir>/libs/pwa-auto-update',
		'<rootDir>/libs/pwa-notifications',
	],
};
