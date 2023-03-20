import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { MockProvider } from 'ng-mocks';
import { GuestGenericComponent } from './guest-generic.component';

describe('GuestGenericComponent', () => {
	let component: GuestGenericComponent;
	let fixture: ComponentFixture<GuestGenericComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [MatSnackBarModule, DesignSystemModule, BrowserAnimationsModule],
			declarations: [GuestGenericComponent],
			providers: [MockProvider(MatDialog)],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GuestGenericComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
