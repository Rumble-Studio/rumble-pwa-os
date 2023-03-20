import { HttpClientModule } from '@angular/common/http';
import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { akitaConfig } from '@datorama/akita';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { AppLayoutModule } from '@rumble-pwa/app-layout';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ClientNotificationsModule } from '@rumble-pwa/client-notifications';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { GlobalPlayerModule } from '@rumble-pwa/global-player';
import { LoadingModule } from '@rumble-pwa/loading';
import { Subscription } from '@rumble-pwa/mega-store';
import { AmplitudeService } from '@rumble-pwa/monitoring-system';
import { PersistenceService, StorageModule } from '@rumble-pwa/storage';
import { TabManagerModule } from '@rumble-pwa/tab-manager';
import { User } from '@rumble-pwa/users/models';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core.module';
import { TranslocoRootModule } from './transloco-root.module';

akitaConfig({ resettable: true });

@Injectable({
	providedIn: 'root',
})
class AmplitudeErrorHandler extends ErrorHandler {
	constructor(private amplitudeService: AmplitudeService) {
		super();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handleError(error: any) {
		// send the error to the server
		this.amplitudeService.saveEvent('error', { error });

		// delegate to the default handler
		super.handleError(error);
	}
}

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		HttpClientModule,
		ServiceWorkerModule.register('ngsw-worker.js', {
			enabled: environment.production,
		}),
		// if prod, and not dev in env name (like devLocal or dev)
		environment.enableReduxStore ? AkitaNgDevtools.forRoot() : [],
		AkitaNgRouterStoreModule,
		StorageModule,
		CoreModule,
		ClientNotificationsModule,
		LoadingModule,
		// RequestsModule,
		TabManagerModule,
		DesignSystemModule,
		GlobalPlayerModule,
		// TimeagoModule.forRoot(),
		AppLayoutModule,
		AppRoutingModule,
		TrackClickDirective,
		TranslocoRootModule,
	],
	providers: [{ provide: ErrorHandler, useClass: AmplitudeErrorHandler }],
	bootstrap: [AppComponent],
})
export class AppModule {
	subscriptions: Subscription[] = [];
	user?: User | null;

	constructor(private persistenceService: PersistenceService) {
		this.persistenceService.activatePersistence();
	}
}
