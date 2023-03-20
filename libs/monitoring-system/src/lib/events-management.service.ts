import { v4 as uuidv4 } from 'uuid';

import { Injectable } from '@angular/core';
import { Event } from '@rumble-pwa/mega-store';

function isBrowserEnv() {
	return typeof window === 'object' && (window === null || window === void 0 ? void 0 : window.document) !== undefined;
}
function getLanguage() {
	return (navigator && ((navigator.languages && navigator.languages[0]) || navigator.language)) || '';
}
function getLocation() {
	return window.location;
}
function getHost(url: string) {
	const a = document.createElement('a');
	a.href = url;
	return a.hostname || location.hostname;
}
function getTopDomain() {
	let i, h;
	const weird_cookie = 'weird_get_top_level_domain=cookie',
		hostname = document.location.hostname.split('.');
	for (i = hostname.length - 1; i >= 0; i--) {
		h = hostname.slice(i).join('.');
		document.cookie = weird_cookie + ';domain=.' + h + ';SameSite=None; Secure;';
		if (document.cookie.indexOf(weird_cookie) > -1) {
			// We were able to store a cookie! This must be it
			document.cookie =
				weird_cookie.split('=')[0] +
				'=;domain=.' +
				h +
				';SameSite=None; Secure; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
			return h;
		}
	}
	return '';
}
function getQueryParam(name: string, query: string) {
	name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
	const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
	const results = regex.exec(query);
	return results === null ? undefined : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
function isEmptyString(str?: string) {
	return !str || str.length === 0;
}
function getUtmData(query: string, rawCookie?: string) {
	// Translate the utmz cookie format into url query string format.
	const cookie = rawCookie ? '?' + rawCookie.split('.').slice(-1)[0].replace(/\|/g, '&') : '';

	function fetchParam(queryName: string, query: string, cookieName: string, cookie: string) {
		return getQueryParam(queryName, query) || getQueryParam(cookieName, cookie);
	}

	const utmSource = fetchParam('utm_source', query, 'utmcsr', cookie);
	const utmMedium = fetchParam('utm_medium', query, 'utmcmd', cookie);
	const utmCampaign = fetchParam('utm_campaign', query, 'utmccn', cookie);
	const utmTerm = fetchParam('utm_term', query, 'utmctr', cookie);
	const utmContent = fetchParam('utm_content', query, 'utmcct', cookie);
	const utmData: { [key: string]: unknown } = {};

	function addIfNotNull(key: string, value?: string) {
		if (!isEmptyString(value)) {
			utmData[key] = value;
		}
	}

	addIfNotNull('utm_source', utmSource);
	addIfNotNull('utm_medium', utmMedium);
	addIfNotNull('utm_campaign', utmCampaign);
	addIfNotNull('utm_term', utmTerm);
	addIfNotNull('utm_content', utmContent);
	return utmData;
}
function getReferrer() {
	return document.referrer;
}
function getUrlParams() {
	return location.search;
}

@Injectable({
	providedIn: 'root',
})
export class EventsManagementService {
	constructor() {
		const constructionEvent = this.generateEvent({
			event_name: 'EventsManagementService constructed',
			event_kind: 'construction',
			event_source: {
				element: 'EventsManagementService',
				function: 'constructor',
			},
			isTest: true,
		});

		// console.log({
		//   constructionEvent,
		// });
	}

	generateEvent(event?: Partial<Event>) {
		// create event with all client info
		const newEvent: Event = {
			id: uuidv4(),
			event_name: '<no name>',
			event_kind: '<no type>',
			event_source: {
				element: '<no element>',
				function: '<no function>',
			},
			event_data: {
				isBrowserEnv: isBrowserEnv(),
				getLanguage: getLanguage(),
				getLocation: getLocation(),
				getHost: getHost(location.href),
				getTopDomain: getTopDomain(),
				getReferrer: getReferrer(),
				getUrlParams: getUrlParams(),
				getUtmData: getUtmData(location.search),
			},
			isTest: false,
			...event,
		};
		return newEvent;
	}
}
