import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MockProvider } from 'ng-mocks';
import { MenuSideNavComponent } from './menu-side-nav.component';

describe('MenuSideNavComponent', () => {
	let component: MenuSideNavComponent;
	let fixture: ComponentFixture<MenuSideNavComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [MenuSideNavComponent],
			imports: [MatListModule],
			providers: [MockProvider(MATERIAL_SANITY_CHECKS, false)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(MenuSideNavComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
