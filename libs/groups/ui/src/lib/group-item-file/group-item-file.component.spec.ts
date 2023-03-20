import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FilesManagementService } from '@rumble-pwa/files-system';
import { MockProvider } from 'ng-mocks';
import { GroupItemFileComponent } from './group-item-file.component';

describe('GroupItemFileComponent', () => {
	let component: GroupItemFileComponent;
	let fixture: ComponentFixture<GroupItemFileComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [DesignSystemModule],
			declarations: [GroupItemFileComponent],
			providers: [MockProvider(FilesManagementService), MockProvider(MATERIAL_SANITY_CHECKS, false)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GroupItemFileComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
