import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { FavoriteObject } from '@rumble-pwa/mega-store';
import { PlaylistsManagementService } from '@rumble-pwa/player-system';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { GlobalPlayerService } from '../global-player.service';

import { PlaylistComponent } from './playlist.component';

describe('PlaylistComponent', () => {
	let component: PlaylistComponent;
	let fixture: ComponentFixture<PlaylistComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DesignSystemModule],
			providers: [
				MockProvider(MatDialog),
				MockProvider(ProfileSystemService, { favorites$$: new BehaviorSubject<FavoriteObject[]>([]) }),
				MockProvider(NotificationsService),
				MockProvider(FilesManagementService),
				MockProvider(PlaylistsManagementService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(GlobalPlayerService, {
					play$$: new BehaviorSubject<boolean>(false),
					pause$$: new BehaviorSubject<boolean>(false),
					stop$$: new BehaviorSubject<boolean>(false),
					currentIndex$$: new BehaviorSubject<number>(0),
					curentIndexPercentage$$: new BehaviorSubject<number>(0),
				}),
			],
			declarations: [PlaylistComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PlaylistComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
