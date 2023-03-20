import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import * as Sentry from '@sentry/angular';
import { BrowserTracing } from '@sentry/tracing';

if (environment.production) {
	Sentry.init({
		dsn: 'https://5c357c942f714002aaf5ce4af13e5f32@o423478.ingest.sentry.io/5353783',
		integrations: [
			new BrowserTracing({
				tracingOrigins: ['localhost', 'https://app.rumble.studio'],
				routingInstrumentation: Sentry.routingInstrumentation,
			}),
		],

		// Set tracesSampleRate to 1.0 to capture 100%
		// of transactions for performance monitoring.
		// We recommend adjusting this value in production
		// See https://develop.sentry.dev/sdk/performance
		tracesSampleRate: 0.2,
	});
	enableProdMode();
}

platformBrowserDynamic()
	.bootstrapModule(AppModule)
	.catch((err) => console.error(err));
