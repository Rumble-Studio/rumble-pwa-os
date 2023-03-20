export const environment = {
	production: false,
	environmentName: 'devLocal',
	enableReduxStore: true,
	amplitude: {
		// id: 'b9510532369967c8941441453e35f271',
		id: undefined,
	},
	responsive: {
		dashboard: {
			collapsingLayoutSize: 3, //2
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
				scriptList: 4,
				settings: 4,
			},
		},
	},
	apiRoot: 'http://localhost:8000/api/v1',
	// apiRoot: 'http://bs-local.com:8000/api/v1',
	// apiRoot: 'https://dev-api.rumble.studio/api/v1',
	// apiRoot: 'https://api.rumble.studio/api/v1',
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
