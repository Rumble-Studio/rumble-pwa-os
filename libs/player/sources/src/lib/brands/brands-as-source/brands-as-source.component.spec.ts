import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandsAsSourceComponent } from './brands-as-source.component';

describe('BrandsAsSourceComponent', () => {
	let component: BrandsAsSourceComponent;
	let fixture: ComponentFixture<BrandsAsSourceComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [BrandsAsSourceComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(BrandsAsSourceComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
