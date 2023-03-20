export const environment = {
	production: true,
	environmentName: 'prod',
	enableReduxStore: false,
	amplitude: {
		id: '29f9856abf5ccda1335f7fe41b8faf4d',
	},
	responsive: {
		dashboard: {
			collapsingLayoutSize: 2,
		},
		conversations: {
			collapsingLayoutSize: {
				convList: 1,
				settings: 3,
			},
		},
		collections: {
			collapsingLayoutSize: {
				convList: 1,
				settings: 3,
			},
		},
		scripts: {
			collapsingLayoutSize: {
				scriptList: 1,
				settings: 3,
			},
		},
	},
	apiRoot: 'https://api.rumble.studio/api/v1',
};
