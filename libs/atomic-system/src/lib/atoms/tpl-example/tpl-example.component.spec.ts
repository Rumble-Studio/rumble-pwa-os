import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TplExampleComponent } from './tpl-example.component';

describe('TplExampleComponent', () => {
	let component: TplExampleComponent;
	let fixture: ComponentFixture<TplExampleComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [TplExampleComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(TplExampleComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
