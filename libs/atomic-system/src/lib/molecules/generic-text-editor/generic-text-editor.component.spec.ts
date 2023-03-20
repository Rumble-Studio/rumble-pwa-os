import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericTextEditorComponent } from './generic-text-editor.component';

describe('GenericTextEditorComponent', () => {
	let component: GenericTextEditorComponent;
	let fixture: ComponentFixture<GenericTextEditorComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GenericTextEditorComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(GenericTextEditorComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
