import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlaylistItem } from '@rumble-pwa/mega-store';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import { LocalforageStorageService, StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { GlobalPlayerService, PlaylistSettings } from '../global-player.service';

import { GlobalPlaybarComponent } from './global-playbar.component';

describe('GlobalPlaybarComponent', () => {
	let component: GlobalPlaybarComponent;
	let fixture: ComponentFixture<GlobalPlaybarComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GlobalPlaybarComponent],
			providers: [
				MockProvider(GlobalPlayerService, {
					playlist$$: new BehaviorSubject<PlaylistItem[]>([]),
					globalPlaylistCollapsed$$: new BehaviorSubject<boolean>(true),
					playlistInfos$$: new BehaviorSubject<PlaylistSettings | undefined>(undefined),
					play$$: new BehaviorSubject<boolean>(false),
					percentage$$: new BehaviorSubject<number>(0),
					totalDuration$$: new BehaviorSubject<number>(0),
					curentDuration$$: new BehaviorSubject<number>(0),
					playlistIdentifier$$: new BehaviorSubject<string | null>(null),
					playbarCollapsed$$: new BehaviorSubject<boolean>(true),
					playbarClosed$$: new BehaviorSubject<boolean>(true),
				}),

				MockProvider(ProfileSystemService),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GlobalPlaybarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
