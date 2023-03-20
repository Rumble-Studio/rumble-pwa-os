import { TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { RestService } from '@rumble-pwa/requests';
import { MockProvider } from 'ng-mocks';

import { PlaylistsManagementService } from './playlists-management.service';
import { TracksQuery } from '@rumble-pwa/mega-store';

describe('PlaylistManagementService', () => {
	let service: PlaylistsManagementService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				MockProvider(RestService),
				MockProvider(TracksQuery),
				MockProvider(AuthService),
				MockProvider(ProfileSystemService),
			],
		});
		service = TestBed.inject(PlaylistsManagementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
