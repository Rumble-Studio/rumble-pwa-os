import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { GrantsManagementService } from '@rumble-pwa/groups-system';
import { Grant } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';
import { GrantsListComponent } from './grants-list.component';

describe('GrantsListComponent', () => {
	let component: GrantsListComponent;
	let fixture: ComponentFixture<GrantsListComponent>;
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [GrantsListComponent],
			providers: [
				MockProvider(MatDialog),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
				MockProvider(GrantsManagementService, {
					getAll$() {
						return new Observable<Grant[]>();
					},
				}),
			],
			imports: [MatPaginatorModule, DesignSystemModule, BrowserAnimationsModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GrantsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
