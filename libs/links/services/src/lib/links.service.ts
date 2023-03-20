import { Injectable } from '@angular/core';
import { LayoutProps, LayoutRepository } from '@rumble-pwa/layout/state';
import { LinkCategory, SideNavLink } from '@rumble-pwa/links/models';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LINK_CATEGORIES } from './links.config';

@Injectable({
	providedIn: 'root',
})
export class LinksService {
	private _sideNavLinks: SideNavLink[] = [];
	installPromptEvent$$: BehaviorSubject<any> = new BehaviorSubject(undefined);

	layoutProps?: LayoutProps;

	// TODO: once we have the form repository: enable the todo of the form to createa form like the brands
	constructor(private _layoutRepository: LayoutRepository) {
		this._sideNavLinks = [
			{
				name: 'Dashboard',
				shortName: 'Home',
				description: 'Go to your home page.',
				matIcon: 'home',
				path: '/',
				displayIn: ['dash'],
			},
			{
				name: 'Interviews',
				shortName: 'Interviews',
				description: 'Build and manage your interviews.',
				matIcon: 'wysiwyg',
				path: './forms',
				displayIn: ['creation'],
				// permissionDetails: {
				// 	permissionKey: 'menu-display-form',
				// },
				upgrade: {
					id: 'upgrade:menu-form',
					title: 'Inerviews',
					description: 'Upgrade to list your interviews.',
					// grantsRequired: [],
					permissionsRequired: ['menu-display-form'],
				},
			},
			{
				name: 'Mixes',
				shortName: 'Mixes',
				description: 'Merge audio files together to create what you need.',
				matIcon: 'blender',
				path: './mixes',
				displayIn: ['creation'],
				// permissionDetails: {
				// 	permissionKey: 'menu-display-mix',
				// },
				upgrade: {
					id: 'upgrade:menu-mix',
					title: 'Mixes',
					description: 'Upgrade to list your mixes.',
					// grantsRequired: [],
					permissionsRequired: ['menu-display-mix'],
				},
			},
			// {
			// 	name: 'Items',
			// 	shortName: 'Item',
			// 	description: 'Manage your items (beta)',
			// 	matIcon: 'library_music',
			// 	path: './items',
			// 	displayIn: ['creation'],
			// 	permissionDetails: {
			// 		permissionKey: 'menu-display-item',
			// 	},
			// },
			{
				name: 'Collections',
				shortName: 'Collections',
				description: 'Collections (beta)',
				matIcon: 'podcasts',
				matIconSuffix: 'science',
				path: './collections',
				displayIn: ['creation'],
				permissionDetails: {
					permissionKey: 'menu-display-collection',
				},
			},
			// { name: '4. Hosting', description: 'Manage your RSS feed', matIcon:'rss_feed', path:'/'},

			{
				name: 'File library',
				shortName: 'Files',
				description: 'File list',
				matIcon: 'file_copy',
				path: './files',
				displayIn: ['filesexports'],
				// permissionDetails: {
				// 	permissionKey: 'menu-display-file',
				// },
			},
			{
				name: 'Exports',
				shortName: 'Exports',
				description: 'All your exports',
				matIcon: 'archive', //'folder_zip',
				path: './exports',
				displayIn: ['filesexports'],
				// permissionDetails: {
				// 	permissionKey: 'menu-display-mix',
				// },
			},
			{
				name: 'Branding kits',
				shortName: 'Branding',
				description: 'Manage your brands to customise your contents.',
				matIcon: 'format_paint',
				path: './brands',
				displayIn: ['brandteams'],
				permissionDetails: {
					permissionKey: 'menu-display-brand',
				},
				// todo: {
				// 	id: 'todo:branding-kit-menu',
				// 	title: 'Branding kits',
				// 	description: 'Create a branding kit to easily re-use your graphical elements, colors, fonts and more.',
				// 	tooltip: 'Branding kits',
				// 	priority: 5,
				// 	displayConditions: ['todo:create-interview-from-dash'],
				// 	isDone: (todo: Todo) => {
				// 		return this._brandsRepository.getAll().filter((b) => b.state == 'default').length > 0;
				// 	},
				// 	doAction: (todo: Todo) => {
				// 		const params = { modalTitle: 'Create a new branding kit', modalSubmitText: 'Create' };
				// 		this._brandsRepository
				// 			.openPromptEditor(params)
				// 			.pipe(
				// 				tap((result) => {
				// 					if (result && result.name) {
				// 						const newBrand: Brand = {
				// 							...result,
				// 							name: result.name,
				// 							id: uuidv4(),
				// 							ownerId: this._usersRepository.connectedUser$$.getValue()?.id || '',
				// 							colors: '#c2c2c2;#ffffff',
				// 							domain: result.domain === 'https://' ? undefined : result.domain,
				// 						};
				// 						this._brandsRepository.addBrand(newBrand);
				// 					}
				// 				})
				// 			)
				// 			.subscribe();
				// 	},
				// 	confirmTerm: 'Later',
				// 	actionTitle: 'Create now',
				// },
			},

			{
				name: 'Domains',
				shortName: 'Domains',
				description: 'Domain list (beta)',
				matIcon: 'http',
				// matIconSuffix: 'science',
				path: './domains',
				displayIn: ['brandteams'],
				// permissionDetails: {
				// 	permissionKey: 'menu-display-domain',
				// },
				upgrade: {
					id: 'upgrade:menu-domain',
					title: 'Upgrade to manage domains',
					description: 'By upgrading you can register your custom domain name and use it for your interviews.',
					// grantsRequired: [],
					permissionsRequired: ['menu-open-domain'],
				},
			},
			{
				name: 'Pages',
				shortName: 'Pages',
				description: 'Manage your pages. (beta)',
				matIcon: 'link',
				// matIconSuffix: 'science',
				path: './pages',
				displayIn: ['creation'],
				// permissionDetails: {
				// 	permissionKey: 'menu-display-page',
				// },
				upgrade: {
					id: 'upgrade:menu-page',
					title: 'Upgrade to manage pages',
					description: 'By upgrading you can create pages for each interview and to share your contents.',
					// grantsRequired: [],
					permissionsRequired: ['menu-open-page'],
				},
			},
			{
				name: 'Notes',
				shortName: 'Notes',
				description: 'Manage your notes. (beta)',
				matIcon: 'notes',
				matIconSuffix: 'science',
				path: './notes',
				displayIn: ['creation'],
				permissionDetails: {
					permissionKey: 'menu-display-note',
				},
			},
			{
				name: 'Teams & contacts',
				shortName: 'Teams',
				description: 'Manage your teams and contacts.',
				matIcon: 'apartment',
				path: './groups',
				displayIn: ['brandteams'],
				permissionDetails: {
					permissionKey: 'menu-display-group',
				},
			},
			{
				name: 'Subscriptions',
				shortName: 'Subscrptions',
				description: 'Manage your plans.',
				matIcon: 'receipt',
				path: './subscriptions',
				displayIn: ['billing'],
				permissionDetails: {
					permissionKey: 'menu-display-subscription',
				},
			},
			{
				name: 'Payment',
				shortName: 'payment',
				description: 'Manage your plans and bills.',
				matIcon: 'payment',
				path: './billing',
				displayIn: ['billing'],
			},
			{
				name: 'Profile settings',
				shortName: 'Profile',
				description: 'Manage your preferences',
				matIcon: 'manage_accounts',
				path: './profile',
				displayIn: ['top'],
			},
			{
				name: 'Roadmap',
				shortName: 'roadmap',
				description: 'Have a look at the coming features.',
				matIcon: 'timeline',
				path: './roadmap',
				displayIn: ['helproadmap', 'top'],
			},
			{
				name: 'Help',
				shortName: 'help',
				description: 'Get help and support.',
				matIcon: 'help',
				path: './help',
				displayIn: ['helproadmap', 'top'],
			},
			{
				name: 'Admin panel',
				shortName: 'Admin',
				description: 'Admin Panel',
				matIcon: 'admin_panel_settings',
				matIconSuffix: 'warning',
				path: './admin',
				displayIn: ['admin'],
				superUserOnly: true,
				supportUserAccess: true,
			},
			{
				name: 'Payment',
				shortName: 'payment',
				description: 'Manage your plans, bills and credit cards',
				matIcon: 'payment',
				path: './billing',
				displayIn: ['top'],
			},
			{
				name: 'Reset helpers',
				shortName: 'Reset helpers',
				description: 'Display all helpers through the app',
				matIcon: 'info',
				path: '@resetHelpers',
				displayIn: ['top'],
			},
			// {
			// 	name: 'Launch guided tour',
			// 	shortName: 'Launch guided tour',
			// 	description: 'Launch all helpers through the app',
			// 	matIcon: 'switch_access_shortcut_add',
			// 	path: '@launchGuidedTour',
			// },
			{
				name: 'Install Rumble Studio',
				shortName: 'install',
				description: 'Install Rumble Studio on your device',
				imageUrl: '/assets/icons/favicon_rumble.ico',
				displayIn: [], // filled by
				callback: () => {
					this.openInstallPrompt();
				},
			},
			{
				name: 'Log out',
				shortName: 'Log out',
				description: 'Disconnect from this account',
				matIcon: 'logout',
				path: '/auth/logout',
				displayIn: ['top'],
			},
		];

		this._layoutRepository.layoutProps$
			.pipe(
				tap((layoutProps) => {
					this.layoutProps = layoutProps;
				})
			)
			.subscribe();

		this._layoutRepository.setLayoutProps({
			linkCategories: LINK_CATEGORIES,
			sideNavLinks: this._sideNavLinks,
		});

		// react to install-prompt state
		this.installPromptEvent$$
			.pipe(
				tap((event) => {
					this.insertRumbleStudioInstallLink(event);
					this.processInstallPromptUserChoice(event);
				})
			)
			.subscribe();
	}

	/**
	 * Store the install prompt event
	 * @param event
	 */
	storeInstallPromptEvent(event: any) {
		this.installPromptEvent$$.next(event);
	}

	/**
	 * Open the install prompt
	 */
	openInstallPrompt() {
		this.installPromptEvent$$.value?.prompt();
	}

	/**
	 * Display install link if event available
	 * @param event Event from the install prompt
	 *
	 */
	insertRumbleStudioInstallLink(event: any): void {
		const installLink = this._sideNavLinks.find((sideNavLink) => sideNavLink.shortName === 'install');
		if (!installLink) return;
		installLink.displayIn = event ? ['top'] : [];
		this._layoutRepository.setLayoutProps({
			sideNavLinks: this._sideNavLinks,
		});
	}

	/**
	 * Listen to user choice, it could be 'accepted' or 'denied.
	 *
	 * If 'accepted', event is set to undefined to remove 'Install Rumble Studio' link.
	 *
	 * @param event Event from the install prompt
	 */
	processInstallPromptUserChoice(event: any) {
		event?.userChoice?.then((result: any) => {
			if (result?.outcome === 'accepted') this.installPromptEvent$$.next(undefined);
		});
	}

	updateCollapsedState(linkCategory: LinkCategory, newCollapsedState: boolean) {
		if (!(this.layoutProps && this.layoutProps?.linkCategories)) return;
		const index = this.layoutProps.linkCategories.indexOf(linkCategory);
		if (index < 0) return;
		console.log('You want to callapse this category:', linkCategory);
		// const LINK_CATEGORIES_COPY = cloneDeep(LINK_CATEGORIES);
		// LINK_CATEGORIES_COPY[index].collapsed = !LINK_CATEGORIES_COPY[index].collapsed;
		// console.log(LINK_CATEGORIES_COPY[index]);

		// this._layoutRepository.setLayoutProps({
		// 	linkCategories: LINK_CATEGORIES_COPY,
		// });

		// linkCategory.collapsed = !linkCategory.collapsed;
		// linkCategories[index].collapsed = linkCategory.collapsed;
		// this._layoutRepository.setLayoutProps({ linkCategories: linkCategories });
	}

	getSideNavLinkIcon(path: string) {
		return this._sideNavLinks.find((SIDENAVLNK) => SIDENAVLNK.path?.includes(path));
	}
}
