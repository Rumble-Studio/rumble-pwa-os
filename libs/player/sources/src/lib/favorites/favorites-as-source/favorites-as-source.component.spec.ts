import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesAsSourceComponent } from './favorites-as-source.component';

describe('FavoritesAsSourceComponent', () => {
	let component: FavoritesAsSourceComponent;
	let fixture: ComponentFixture<FavoritesAsSourceComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FavoritesAsSourceComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(FavoritesAsSourceComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
