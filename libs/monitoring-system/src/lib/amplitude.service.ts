import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { User } from '@rumble-pwa/users/models';
import amplitude from 'amplitude-js';

// // code to add on landing page to update every links
// const interval = setInterval(() => {
//   let ampDeviceId = null;
//   try {
//     ampDeviceId = amplitude.getInstance().options.deviceId;
//   } catch (error) {
//     console.error('Amplitude not initialized yet');
//     // expected output: ReferenceError: nonExistentFunction is not defined
//     // Note - error messages will vary depending on browser
//   }
//   if (ampDeviceId) {
//     console.log('Amplitude device id set.');
//     clearInterval(interval);
//     document.querySelectorAll('a').forEach((a) => {
//       const href = a.href;
//       if (href.indexOf('app.rumble.studio') >= 0) {
//         if (href.indexOf('?') > 0) {
//           a.setAttribute('href', href + '&ampDeviceId=' + ampDeviceId);
//         } else {
//           a.setAttribute('href', href + '?ampDeviceId=' + ampDeviceId);
//         }
//       }
//     });
//   }
// }, 100);

// var eventProperties = {
//   'url': window.location.pathname
//  };
//  amplitude.getInstance().logEvent('navigation:hubspot', eventProperties);

export enum AMPLITUDE_EVENTS {
	'open-modal-create-interview-dash' = 'open-modal-create-interview-dash',
	'navigation' = 'navigation',

	// brand editor
	'brand-editor:new-brand' = 'brand-editor:new-brand',

	// form editor
	'form-properties:new-form' = 'form-properties:new-form',

	// auth
	'auth:login' = 'auth:login',
	'auth:logout' = 'auth:logout',
	'auth:register' = 'auth:register',
	'auth:reset-password:request' = 'auth:reset-password:request',

	// form stepper
	'form-stepper:call-next' = 'form-stepper:call-next',
	'form-stepper:call-prev' = 'form-stepper:call-prev',
	'form-stepper:step-changed' = 'form-stepper:step-changed',

	// form editor dad
	'form-editor:menu-change' = 'form-editor:menu-change',
	'form-editor:action-change' = 'form-editor:action-change',
	'form-editor:new-step' = 'form-editor:new-step',
	'form-editor:move-step' = 'form-editor:move-step',
	'form-editor:collapse-change' = 'form-editor:collapse-change',
	'form-editor:duplicate-step' = 'form-editor:duplicate-step',
	'form-editor:change-providers' = 'form-editor:change-providers',

	// playlist recorder
	'playlist-recorder:open-file-selector' = 'playlist-recorder:open-file-selector',
	'playlist-recorder:start-recording' = 'playlist-recorder:start-recording',
	'playlist-recorder:stop-recording' = 'playlist-recorder:stop-recording',
	'playlist-recorder:pause-recording' = 'playlist-recorder:pause-recording',
	'playlist-recorder:resume-recording' = 'playlist-recorder:resume-recording',
	'playlist-recorder:drop-track' = 'playlist-recorder:drop-track',
	'playlist-recorder:seek-on-multi' = 'playlist-recorder:seek-on-multi',
	'playlist-recorder:play' = 'playlist-recorder:play',
	'playlist-recorder:pause' = 'playlist-recorder:pause',
	'playlist-recorder:change-device' = 'playlist-recorder:change-device',
	'playlist-recorder:ask-for-permissions-btn-clicked' = 'playlist-recorder:ask-for-permissions-btn-clicked',
	'playlist-recorder:device-changed' = 'playlist-recorder:device-changed',
	'playlist-recorder:check-track' = 'playlist-recorder:check-track',

	// object prompt
	'button:object-prompt' = 'button:object-prompt',
	'button:recorder' = 'button:recorder',
	'button:drag-and-drop-editor' = 'button:drag-and-drop-editor',
	'tab:drag-and-drop-editor' = 'tab:drag-and-drop-editor',

	// errors
	'error' = 'error',
}

export type AmplitudeEvent = keyof typeof AMPLITUDE_EVENTS;

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class AmplitudeService {
	client?: amplitude.AmplitudeClient;
	private _apiKey = '<unset-api-root>';
	public get apiKey() {
		return this._apiKey;
	}

	public set apiKey(value) {
		this._apiKey = value;
		this.client = amplitude.getInstance();
		this.client.init(value, undefined, {
			includeUtm: true,
			includeReferrer: true,
			includeFbclid: true,
			includeGclid: true,
		});
		// console.log('%c[amplitudeService](init)', 'color:sandybrown', value);
	}

	setApiKey(apiKey?: string) {
		if (apiKey) this.apiKey = apiKey;
	}

	updateUser(user?: User | null, subscriptions?: string[], resetSession = false) {
		if (!this.client) return;

		if (!user || !user.id) {
			if (this.client.getUserId()) this.client.setUserId(null, resetSession);
			return;
		}

		this.client.setUserId(user.id);
		this.client.setUserProperties({
			email: user.email || '',
			emailValidated: user.emailValidated || false,
			firstName: user.firstName,
			lastName: user.lastName,
			fullName: user.fullName,
			isTest: user.isTest,
			isSuperuser: user.isSuperuser || false,
			isActive: user.isActive || false,
			hasPassword: user.hasPassword || false,
			invited: user.invited || false,
			anonymous: user.anonymous || false,
			stripeCustomerId: user.stripeCustomerId || '',
			pennylaneCustomerId: user.pennylaneCustomerId || '',
			state: user.state || 'default',
			timeCreation: user.timeCreation,
			subscriptions: subscriptions || [],
		});
	}

	saveEvent(eventName: AmplitudeEvent | string, eventProperties?: any) {
		if (!this.client) return;
		this.client.logEvent(eventName, eventProperties);
	}

	setUserProperty(properties: any) {
		if (!this.client) return;
		this.client.setUserProperties(properties);
		// console.log(
		//   '%c[amplitudeService](setting)',
		//   'color:sandybrown',
		//   'setting user propeties:',
		//   properties
		// );
	}

	setDeviceId(ampDeviceId: string) {
		if (!this.client) return;
		this.client.setDeviceId(ampDeviceId);
		// console.log(
		//   '%c[amplitudeService](setting)',
		//   'color:sandybrown',
		//   'setting device id:',
		//   ampDeviceId
		// );
	}
}
