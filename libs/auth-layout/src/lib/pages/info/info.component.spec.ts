import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@rumble-pwa/auth-system';
import { SessionState } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AuthDialogService } from '../../auth-dialog.service';
import { InfoComponent } from './info.component';

describe('InfoComponent', () => {
	let component: InfoComponent;
	let fixture: ComponentFixture<InfoComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [InfoComponent],
			providers: [
				MockProvider(AuthService, {
					session$$: new BehaviorSubject<SessionState>({ token: '' }),
				}),
				MockProvider(ChangeDetectorRef),
				MockProvider(AuthDialogService),
			],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(InfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
