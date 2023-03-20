import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatchAllPatchComponent } from './catch-all-patch.component';

describe('CatchAllPatchComponent', () => {
	let component: CatchAllPatchComponent;
	let fixture: ComponentFixture<CatchAllPatchComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [CatchAllPatchComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(CatchAllPatchComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
