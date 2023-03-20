import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { User } from '@rumble-pwa/users/models';

declare global {
	interface Window {
		_hsq: any | undefined;
	}
}

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class HubspotService {
	setProfile(profile: User | null) {
		if (profile && profile.id) {
			if (window._hsq) {
				window._hsq.push([
					'identify',
					{
						email: profile.email,
						id: profile.id,
					},
				]);
			}
		}
	}

	setPath(path: string) {
		if (window._hsq?.push && path) {
			if (path) {
				window._hsq.push(['setPath', path]);
				window._hsq.push(['trackPageView']);
			}
		}
	}
}
