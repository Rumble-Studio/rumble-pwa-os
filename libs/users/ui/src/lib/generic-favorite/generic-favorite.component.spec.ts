import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericFavoriteComponent } from './generic-favorite.component';

describe('GenericFavoriteComponent', () => {
	let component: GenericFavoriteComponent;
	let fixture: ComponentFixture<GenericFavoriteComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GenericFavoriteComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(GenericFavoriteComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
