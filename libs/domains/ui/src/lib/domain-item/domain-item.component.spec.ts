import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomainItemComponent } from './domain-item.component';

describe('DomainItemComponent', () => {
	let component: DomainItemComponent;
	let fixture: ComponentFixture<DomainItemComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DomainItemComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(DomainItemComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
