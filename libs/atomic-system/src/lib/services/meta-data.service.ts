import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { UntilDestroy } from '@ngneat/until-destroy';

export interface OpenGraphParameters {
	locale?: string;
	url?: string;
	type?: string;
	title?: string;
	description?: string;
	image?: string;
	site_name?: string;
}

// const DEFAULT_OPEN_GRAPH_PARAMETERS: OpenGraphParameters = {
// 	locale: 'en_US',
// 	url: 'https://www.rumble.studio/',
// 	type: 'website',
// 	title: 'Rumble Studio',
// 	description: 'Create podcasts 10X faster & easier.',
// 	image: './assets/icons/icon-360x360.png',
// 	site_name: 'Rumble Studio',
// };

const defaultFavicon = 'favicon.ico';
const RUMBLE_FAVICON = '/assets/favicons/favicon_rumble.ico';

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class MetaDataService {
	// ------------------------------------//
	//                                     //
	//            DEFAULT VALUES           //
	//	                     		       //
	//-------------------------------------//

	// defaultTitle = 'Rumble Studio';

	// ------- end default values ---------//

	constructor(private title: Title) {}

	/**
	 * Set the page title
	 * @param title
	 */
	public setTitle(title: string) {
		this.title.setTitle(title);
	}

	// /**
	//  * Reset the page title (default is root `favicon.ico`)
	//  */
	// public resetTitle() {
	// 	this.title.setTitle(this.defaultTitle);
	// 	// console.log('%c[MetaDataService]: title reset', 'color:purple');
	// }
	/**
	 * Set the page fav icon
	 * @param faviconUrl should be an image with .png, .gif, .jpg or .ico extension
	 */
	public setFavicon(faviconUrl: string) {
		let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
		if (!link) {
			link = document.createElement('link');
			link.rel = 'icon';
			document.getElementsByTagName('head')[0].appendChild(link);
		}
		link.href = faviconUrl;
		// console.log('%c[MetaDataService]: favicon set to: ' + faviconUrl, 'color:purple');
	}

	/**
	 * Set the rumble fav icon
	 */
	public setRumbleFavicon() {
		this.setFavicon(RUMBLE_FAVICON);
		// console.log('%c[MetaDataService]: fav icon set to rumble fav icon', 'color:purple');
	}

	// /**
	//  * Reset the page fav icon (default is the rumble studio logo)
	//  */
	// public resetFavicon() {
	// 	this.setFavicon(this.defaultFavicon);
	// 	// console.log('%c[MetaDataService]: favicon reset', 'color:purple');
	// }

	/**
	 * Get the current fav icon
	 * @returns current href
	 */
	getCurrentFavicon(): string | undefined {
		const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
		if (!link) return;
		return link.href;
	}

	/**
	 * @param openGraphParameters parameters to set
	 * @param allowEmptyValue if true, meta content can be empty (default is false)
	 */
	public setOpenGraphParameters(openGraphParameters: OpenGraphParameters, allowEmptyValue = false) {
		Object.entries(openGraphParameters).forEach(([openGraphParameter, value]) => {
			if (!allowEmptyValue && !value) return;
			const selector = '#meta-' + openGraphParameter;
			const openGraphParameterHtmlEl: HTMLMetaElement | null = document.querySelector(selector);
			if (!openGraphParameterHtmlEl) {
				// console.error('[MetaDataService]: ' + openGraphParameter + ' not found');
				return;
			}
			openGraphParameterHtmlEl.content = value;
			// console.log('%c[MetaDataService]: ' + openGraphParameter + ' has been set to: ' + value, 'color:purple');
		});
	}

	// /**
	//  * @param openGraphParameters
	//  * List of parameters to reset.
	//  * If not provided, it will reset ALL parameters
	//  */
	// public resetOpenGraphParameters(openGraphParameters?: (keyof OpenGraphParameters)[]) {
	// 	if (!openGraphParameters) {
	// 		this.setOpenGraphParameters(DEFAULT_OPEN_GRAPH_PARAMETERS);
	// 		return;
	// 	}

	// 	openGraphParameters.forEach((openGraphParameter) => {
	// 		this.setOpenGraphParameters({ [openGraphParameter]: DEFAULT_OPEN_GRAPH_PARAMETERS[openGraphParameter] });
	// 	});
	// }
}
