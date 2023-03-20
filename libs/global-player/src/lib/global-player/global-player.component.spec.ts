import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlaylistItem } from '@rumble-pwa/mega-store';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { GlobalPlayerService } from '../global-player.service';
import { GlobalPlayerComponent } from './global-player.component';

describe('GlobalPlayerComponent', () => {
	let component: GlobalPlayerComponent;
	let fixture: ComponentFixture<GlobalPlayerComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			providers: [
				MockProvider(GlobalPlayerService, {
					playlist$$: new BehaviorSubject<PlaylistItem[]>([]),
				}),
			],
			declarations: [GlobalPlayerComponent],
			schemas: [CUSTOM_ELEMENTS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(GlobalPlayerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
