import { Component, HostListener } from '@angular/core';
import { ActivationStart, Event as RouterEvent, NavigationEnd, Router } from '@angular/router';
import { MetaDataService } from '@rumble-pwa/atomic-system';
import { BrokerService, BROKE_OPTIONS } from '@rumble-pwa/broker-system';
import { LinksService } from '@rumble-pwa/links/services';
import { AmplitudeService, HubspotService } from '@rumble-pwa/monitoring-system';
import { RestService } from '@rumble-pwa/requests';
import { AutoUpdateService } from '@rumble-pwa/sw-auto-update';
import { environment } from '../environments/environment';

if (environment.environmentName === 'prod') {
	console.log(
		'%cRumble studio',
		'color: #f5ca1b; font-family: Roboto,  sans-serif; font-size: 4.5em; font-weight: bolder; text-shadow: #c49e08 1px 1px;'
	);

	console.log('%c🇬🇧 Looking for a job? Contact us on LinkedIn!', 'color:blue');
	console.log('%c🇫🇷 Tu cherches un travail ? Contacte-nous sur LinkedIn !', 'color:blue');
	console.log('%chttps://www.linkedin.com/company/rumblestudio', 'color:darkblue');
}

@Component({
	selector: 'rumble-pwa-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	title: string;
	public domain: string = window.location.hostname;

	constructor(
		private pwaAutoUpdateService: AutoUpdateService,
		private restService: RestService,
		private amplitudeService: AmplitudeService,
		private hubspotService: HubspotService,
		private brokerService: BrokerService,
		private router: Router,
		private _linksService: LinksService,
		private _metaDataService: MetaDataService
	) {
		// console.log('%c[AppComponent](constructor)', 'color:mediumpurple');

		this.subcribeToSWUpdates();
		this.setApiRoot();
		const cnamed = !(window.location.origin.includes('localhost') || window.location.origin.includes('app.rumble.studio'));
		this.title = cnamed ? 'Loading...' : 'Rumble Studio';
		if (environment.environmentName != 'prod') {
			this.title += ' (' + environment.environmentName + ')';
		}
		this._metaDataService.setTitle(this.title);

		// console.log('[AppComponent](constructor) app:', this.title);
		this.router.events.subscribe((event: RouterEvent) => {
			// console.log(
			//   '%c[AppComponent](constructor) \u{2693}',
			//   'color:pink',
			//   event
			// );
			this.navigationInterpretor(event);
		});

		// registry$.subscribe((event) => {
		// 	const stores = getRegistry();
		// 	console.log('[AppComponent](constructor) registries:', event.type, event.store.name, { stores });
		// });
	}

	subcribeToSWUpdates(): void {
		if (environment.production) {
			// console.log(
			//   '%c[AppComponent](constructor) PRODUCTION MODE',
			//   'color:mediumpurple',
			//   'subscribing SW updates'
			// );
			this.pwaAutoUpdateService.subcribeToSWUpdates();
		} else {
			// console.log(
			//   '%c[AppComponent](constructor) DEV MODE',
			//   'color:mediumpurple',
			//   '-> no service workers \u{1f636}'
			// );
		}
	}

	setApiRoot() {
		this.restService.setApiRoot(environment.apiRoot);
		// if (environment.environmentName !== 'devLocal') {
		this.amplitudeService.setApiKey(environment.amplitude.id);
		// }
	}

	navigationInterpretor(event: RouterEvent): void {
		if (event instanceof NavigationEnd) {
			this.amplitudeService.saveEvent('navigation', {
				url: event.urlAfterRedirects,
			});
			this.hubspotService.setPath(event.urlAfterRedirects);
		}

		if (event instanceof ActivationStart) {
			const ampDeviceId = event.snapshot.queryParams['ampDeviceId'] || '';
			if (typeof ampDeviceId === 'string' && ampDeviceId) {
				console.log('Amplitude Device ID found !');
				this.amplitudeService.setDeviceId(ampDeviceId);
			}
		}
	}

	// host listener to click
	@HostListener('click', ['$event'])
	onClick(event: MouseEvent) {
		this.brokerService.broke(BROKE_OPTIONS.preloadSongs);
	}

	@HostListener('window:beforeinstallprompt', ['$event'])
	onbeforeinstallprompt(e: any) {
		e.preventDefault();
		this._linksService.storeInstallPromptEvent(e);
	}
}
