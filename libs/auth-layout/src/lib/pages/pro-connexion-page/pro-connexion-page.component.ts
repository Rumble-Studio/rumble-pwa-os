import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LayoutRepository } from '@rumble-pwa/layout/state';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	getRouteQueryParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { combineLatest } from 'rxjs';
import { filter, map, startWith, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-pro-connexion-page',
	templateUrl: './pro-connexion-page.component.html',
	styleUrls: ['./pro-connexion-page.component.scss'],
})
export class ProConnexionPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged, OnInit {
	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _layoutRepository: LayoutRepository,
		private _usersRepository: UsersRepository,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this._layoutRepository.setLayoutProps({
			displayHeader: false,
			displayBurgerMenu: false,
			displayFooter: false,
			displaySidebarLeft: false,
			displayGlobalPlayer: false,
		});
	}

	ngOnInit(): void {
		combineLatest([
			getRouteQueryParam$(this._activatedRoute, 'redirectUrl').pipe(
				startWith('/'),
				map((redirectUrl) => redirectUrl ?? '/')
			),
			this._usersRepository.isConnected$$,
		])
			.pipe(
				untilDestroyed(this),
				filter(([, isConnected]) => isConnected),
				take(1),
				tap(([redirectUrl]) => {
					this._router.navigateByUrl(redirectUrl);
				})
			)
			.subscribe();
	}
}
