import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainItemPageComponent } from './domain-item-page.component';

describe('DomainItemPageComponent', () => {
	let component: DomainItemPageComponent;
	let fixture: ComponentFixture<DomainItemPageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DomainItemPageComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(DomainItemPageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
