import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SideNavLink } from '@rumble-pwa/mega-store';
import { MockDirectives } from 'ng-mocks';
import { LinkSideNavComponent } from './link-side-nav.component';

describe('LinkSideNavComponent', () => {
	let component: LinkSideNavComponent;
	let fixture: ComponentFixture<LinkSideNavComponent>;
	const link: SideNavLink = {
		shortName: '',
		name: '',
		description: '',
		matIcon: '',
		path: '',
		displayIn: [],
	};
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [LinkSideNavComponent, ...MockDirectives(RouterLinkActive, RouterLink)],
			imports: [RouterTestingModule],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(LinkSideNavComponent);
		component = fixture.componentInstance;
		component.link = link;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
