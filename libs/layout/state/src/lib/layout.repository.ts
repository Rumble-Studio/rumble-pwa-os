import { Injectable, TemplateRef } from '@angular/core';
import { createStore, propsFactory } from '@ngneat/elf';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { Observable, Subject } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { LayoutService } from '@rumble-pwa/utils';
import { LinkCategory, SideNavLink } from '@rumble-pwa/links/models';

const storeName = 'layout';

export interface PageSegment {
	title: string;
	link?: string;
	eventName?: string;
	tooltip?: string;
}

export const HOME_SEGMENT: PageSegment = {
	title: '<span class="material-icons-outlined"> home </span>/',
	link: '/',
	eventName: undefined,
};

export interface LayoutProps {
	displayHeader: boolean;
	displayFooter: boolean;
	displaySidebarLeft: boolean | 'auto';
	displaySidebarRight: boolean;

	displayBurgerMenu: boolean | 'auto';

	displayLogo: boolean;

	displayGlobalPlayer: boolean;

	layoutSize: number; // from layout Service

	loading: boolean;
	darkMode: boolean;

	pageSegments: PageSegment[];
	// pageTitle?: string;
	// pageSubTitle?: string;

	hostname?: string;
	embedded?: boolean;
	cnamed?: boolean;
	url?: string;
	demoFormPostponed?: boolean;
	linkCategories?: LinkCategory[];
	sideNavLinks?: SideNavLink[];
}

export const INITIAL_LAYOUT_PROPS: LayoutProps = {
	displayHeader: false,
	displayFooter: false,
	displaySidebarLeft: false,
	displaySidebarRight: false,
	displayBurgerMenu: false,
	displayLogo: false,
	displayGlobalPlayer: false,
	layoutSize: 2,
	loading: true,
	darkMode: false,
	pageSegments: [],
};

export const DEFAULT_LAYOUT_PROPS: LayoutProps = {
	...INITIAL_LAYOUT_PROPS,
	displayHeader: true,
	displaySidebarLeft: 'auto',
	displayBurgerMenu: 'auto',
	displayLogo: true,
	pageSegments: [],
};

export const CNAME_LAYOUT_PROPS: LayoutProps = {
	...INITIAL_LAYOUT_PROPS,
};

export const LAYOUT_FOR_ITEM: Partial<LayoutProps> = {
	displayHeader: true,
	displayFooter: false,
	displaySidebarRight: false,
	displaySidebarLeft: false,
	displayBurgerMenu: 'auto',

	displayLogo: false,
	pageSegments: [],
};

export const LAYOUT_FOR_LIST: Partial<LayoutProps> = {
	displayHeader: true,
	displayFooter: false,
	displaySidebarRight: false,

	displaySidebarLeft: 'auto',
	displayBurgerMenu: 'auto',

	displayLogo: true,
	pageSegments: [],
};

export const LAYOUT_FOR_DASHBOARD: Partial<LayoutProps> = {
	displayHeader: true,
	displayFooter: false,
	displaySidebarRight: false,

	displaySidebarLeft: 'auto',
	displayBurgerMenu: 'auto',

	displayLogo: true,
	pageSegments: [
		// { title: '/', link: '/' },
		// { title: 'Dashboard', link: '/' },
	],
};

export const FEATURE_LAYOUT_PIPES = propsFactory('layout', {
	initialValue: INITIAL_LAYOUT_PROPS,
});

@Injectable({ providedIn: 'root' })
export class LayoutRepository {
	public layoutProps$: Observable<LayoutProps>;
	private _persist;

	private _store;

	public eventPublisher$ = new Subject<string>();
	public centralTemplate?: TemplateRef<HTMLElement>;

	constructor(private _layoutService: LayoutService) {
		// console.log('%c[LayoutRepository](constructor)', 'color: #00a7e1; font-weight: bold');

		this._store = this._createStore();
		this._persist = persistState(this._store, {
			key: storeName,
			storage: localStorageStrategy,
		});
		// this._persist.initialized$.subscribe(() => console.log(storeName + ' initialized', this._store.value));
		this.layoutProps$ = this._store.pipe(FEATURE_LAYOUT_PIPES.selectLayout(), shareReplay({ refCount: true }));

		this._layoutService.layoutSize$$.subscribe((size) => {
			this.setLayoutProps({
				layoutSize: size,
			});
		});
	}

	public setLayoutProps(layoutProps: Partial<LayoutProps>) {
		this._store.update(FEATURE_LAYOUT_PIPES.updateLayout(layoutProps));
	}

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			FEATURE_LAYOUT_PIPES.withLayout() // like withProps, but for a specific prop
		);

		return store;
	}

	public emitEvent(eventName: string) {
		this.eventPublisher$.next(eventName);
	}
}
