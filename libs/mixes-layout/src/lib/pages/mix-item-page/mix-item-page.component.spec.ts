import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MixItemPageComponent } from './mix-item-page.component';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from '@rumble-pwa/design-system';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { ProfileSystemService } from '@rumble-pwa/profile-system';
import {
	AnswersManagementService,
	FormsManagementService,
	RecordingSessionsManagementService,
	StepsManagementService,
} from '@rumble-pwa/forms-system';
import { UsersManagementService } from '@rumble-pwa/users-system';
import { StorageService } from '@rumble-pwa/storage';
import { GroupsManagementService, PermissionService } from '@rumble-pwa/groups-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { BrandsManagementService } from '@rumble-pwa/brands-system';
import { GlobalPlayerService } from '@rumble-pwa/global-player';
import { ExportsManagementService } from '@rumble-pwa/exports-system';
import { PlaylistItem } from '@rumble-pwa/mega-store';

describe('MixItemComponent', () => {
	let component: MixItemPageComponent;
	let fixture: ComponentFixture<MixItemPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MixItemPageComponent],
			providers: [
				MockProvider(ProfileSystemService, {
					favoritesAsPlaylistItems$$: new BehaviorSubject<PlaylistItem[]>([]),
				}),
				MockProvider(StepsManagementService),
				MockProvider(AnswersManagementService),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(UsersManagementService),
				MockProvider(RecordingSessionsManagementService),
				MockProvider(PermissionService),
				MockProvider(GroupsManagementService),
				MockProvider(FilesManagementService),
				MockProvider(BrandsManagementService),
				MockProvider(FormsManagementService),
				MockProvider(GlobalPlayerService),
				MockProvider(MixesManagementService),
				MockProvider(ExportsManagementService),
				MockProvider(ActivatedRoute),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(ActivatedRoute, { params: new Observable<Params>() }),
				MockProvider(MixesManagementService),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
			imports: [MatDialogModule, MaterialModule, RouterTestingModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(MixItemPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
