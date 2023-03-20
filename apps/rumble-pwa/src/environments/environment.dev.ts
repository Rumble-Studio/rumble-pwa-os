export const environment = {
	production: true,
	environmentName: 'dev',
	enableReduxStore: true,
	amplitude: {
		id: 'b9510532369967c8941441453e35f271',
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
	apiRoot: 'https://devel-api.rumble.studio/api/v1',
};
