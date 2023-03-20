import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { CollectionDeletePromptComponent } from '../../elements/collection-delete-prompt/collection-delete-prompt.component';
import { CollectionEditorComponent } from '../../elements/collection-editor/collection-editor.component';
import { RouterTestingModule } from '@angular/router/testing';

import { CollectionListComponent } from './collection-list.component';
import { MockProvider } from 'ng-mocks';
import { StorageService } from '@rumble-pwa/storage';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { DesignSystemModule } from '@rumble-pwa/design-system';

describe('CollectionListComponent', () => {
	let component: CollectionListComponent;
	let fixture: ComponentFixture<CollectionListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [CollectionListComponent, CollectionEditorComponent, CollectionDeletePromptComponent],
			imports: [MatDialogModule, HttpClientTestingModule, RouterTestingModule, DesignSystemModule],
			providers: [
				MockProvider(StorageService, {
					getItem() {
						return new Promise((resolve) => {
							resolve(null);
						});
					},
				}),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(CollectionListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
