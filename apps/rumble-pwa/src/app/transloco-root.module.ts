import { HttpClient } from '@angular/common/http';
import { Injectable, NgModule } from '@angular/core';
import {
	Translation,
	translocoConfig,
	TranslocoLoader,
	TranslocoModule,
	TRANSLOCO_CONFIG,
	TRANSLOCO_LOADER,
} from '@ngneat/transloco';
import { AVAILABLE_LANGS, DEFAULT_LANG } from '@rumble-pwa/i18n';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
	constructor(private http: HttpClient) {}

	getTranslation(lang: string) {
		console.log('[TranslocoHttpLoader](getTranslation)', lang);

		return this.http.get<Translation>(`/i18n/${lang}.json`);
	}
}

@NgModule({
	exports: [TranslocoModule],
	providers: [
		{
			provide: TRANSLOCO_CONFIG,
			useValue: translocoConfig({
				availableLangs: AVAILABLE_LANGS,
				defaultLang: DEFAULT_LANG,
				fallbackLang: DEFAULT_LANG,
				missingHandler: {
					allowEmpty: false,
					logMissingKey: true,
					useFallbackTranslation: environment.production,
				},

				// Remove this option if your application doesn't support changing language in runtime.
				reRenderOnLangChange: true,
				prodMode: environment.production,
			}),
		},
		{ provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader },
	],
})
export class TranslocoRootModule {}
