import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CollectionsManagementService } from '@rumble-pwa/collection-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { ItemsManagementService } from '@rumble-pwa/items-system';
import { StorageService } from '@rumble-pwa/storage';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';

import { ItemPageComponent } from './item-page.component';

describe('ItemPageComponent', () => {
	let component: ItemPageComponent;
	let fixture: ComponentFixture<ItemPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DesignSystemModule, RouterTestingModule],
			providers: [
				MockProvider(ItemsManagementService),
				MockProvider(ActivatedRoute, { params: new Observable<Params>() }),
				MockProvider(CollectionsManagementService),
				MockProvider(MatDialog),
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
			],
			declarations: [ItemPageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ItemPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
