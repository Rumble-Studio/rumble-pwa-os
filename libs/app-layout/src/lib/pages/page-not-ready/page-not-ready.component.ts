import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Page } from '@rumble-pwa/pages/state';
import { User } from '@rumble-pwa/users/models';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-page-not-ready',
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
	templateUrl: './page-not-ready.component.html',
	styleUrls: ['./page-not-ready.component.scss'],
})
export class PageNotReadyComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	_page$$ = new BehaviorSubject<Page | undefined>(undefined);
	@Input()
	public set page(newPage) {
		this._page$$.next(newPage);
	}
	public get page() {
		return this._page$$.value;
	}

	_user$$ = new BehaviorSubject<User | null>(null);
	@Input()
	public set user(newUser) {
		this._user$$.next(newUser);
	}
	public get user() {
		return this._user$$.value;
	}

	@Input() pageFetched?: boolean;

	isOwner = false;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		combineLatest([this._page$$, this._user$$])
			.pipe(
				untilDestroyed(this),
				tap(([page, user]) => {
					if (!page || !user) return;
					this.isOwner = page?.ownerId === user?.id;
				})
			)
			.subscribe();
	}

	processClick() {
		this._router.navigate(['/pages']);
	}
}
