import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DesignSystemModule, MaterialModule } from '@rumble-pwa/design-system';
import { OperationsManagementService } from '@rumble-pwa/groups-system';
import { Operation } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { OperationsListComponent } from './operations-list.component';

describe('OperationsListComponent', () => {
	let component: OperationsListComponent;
	let fixture: ComponentFixture<OperationsListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [BrowserAnimationsModule, DesignSystemModule, MaterialModule],
			declarations: [OperationsListComponent],
			providers: [
				MockProvider(OperationsManagementService, {
					operations$$: new BehaviorSubject<Operation[]>([]),
				}),
				MockProvider(MatDialog),
				MockProvider(MATERIAL_SANITY_CHECKS, false),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(OperationsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
