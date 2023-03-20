import { DragDropModule } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlaylistItem } from '@rumble-pwa/mega-store';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { GlobalPlayerService, PlaylistSettings } from '../global-player.service';
import { GlobalPlaylistComponent } from './global-playlist.component';

describe('GlobalPlaylistComponent', () => {
	let component: GlobalPlaylistComponent;
	let fixture: ComponentFixture<GlobalPlaylistComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DragDropModule],
			providers: [
				MockProvider(GlobalPlayerService, {
					playlist$$: new BehaviorSubject<PlaylistItem[]>([]),
					globalPlaylistCollapsed$$: new BehaviorSubject<boolean>(true),
					playlistInfos$$: new BehaviorSubject<PlaylistSettings | undefined>(undefined),
				}),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			declarations: [GlobalPlaylistComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GlobalPlaylistComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
