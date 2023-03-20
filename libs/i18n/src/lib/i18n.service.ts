import { Injectable } from '@angular/core';
import { getBrowserCultureLang, getBrowserLang, TranslocoService } from '@ngneat/transloco';
import { tap } from 'rxjs/operators';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './i18n.config';

@Injectable({
	providedIn: 'root',
})
export class I18nService {
	constructor(private _translocoService: TranslocoService) {
		const defaultLang = _translocoService.getDefaultLang();
		const activateLang = _translocoService.getActiveLang();
		const availableLangs = _translocoService.getAvailableLangs();
		const browserLang = getBrowserLang();
		const browserCultureLang = getBrowserCultureLang();

		console.log('[I18nService](constructor)', {
			defaultLang,
			activateLang,
			availableLangs,
			browserLang,
			browserCultureLang,
		});

		if (browserLang && AVAILABLE_LANGS.includes(browserLang)) {
			console.log('[I18nService](constructor) setting browser lang for transloco:', browserLang);
			this._translocoService.setActiveLang(browserLang);
			this._translocoService.setFallbackLangForMissingTranslation({ fallbackLang: defaultLang });
		} else {
			this._translocoService.setActiveLang(DEFAULT_LANG);
		}

		this._translocoService.events$.pipe(tap((event) => console.log({ event }))).subscribe();

		_translocoService.langChanges$
			.pipe(
				tap((lang) => {
					console.log('[I18nService](constructor$) New selected lang:', lang);
				})
			)
			.subscribe();
	}
}
