import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionCnamedPageComponent } from './collection-cnamed-page.component';

describe('CollectionCnamedPageComponent', () => {
	let component: CollectionCnamedPageComponent;
	let fixture: ComponentFixture<CollectionCnamedPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [CollectionCnamedPageComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(CollectionCnamedPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
