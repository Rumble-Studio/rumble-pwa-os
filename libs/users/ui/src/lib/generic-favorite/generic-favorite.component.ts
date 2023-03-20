import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FAVORITE_OBJECT_KINDS } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { BehaviorSubject } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'generic-favorite',
	templateUrl: './generic-favorite.component.html',
	styleUrls: ['./generic-favorite.component.scss'],
	imports: [
		//
		CommonModule,
		MatIconModule,
		MatTooltipModule,
		TrackClickDirective,
	],
	standalone: true,
})
export class GenericFavoriteComponent {
	_favoriteDetails$$ = new BehaviorSubject<{ objectId: string; objectKind: FAVORITE_OBJECT_KINDS } | undefined>(undefined);
	public get favoriteDetails() {
		return this._favoriteDetails$$.getValue();
	}
	@Input()
	public set favoriteDetails(newFavoriteDetails) {
		this._favoriteDetails$$.next(newFavoriteDetails);
	}

	/** Small text for HTML title explaining why to favorite this iteam */
	@Input() whyToFavorite?: string;

	isFavorite: boolean | undefined = undefined;

	constructor(private _usersRepository: UsersRepository) {
		this._favoriteDetails$$
			.pipe(
				untilDestroyed(this),
				switchMap((favoriteDetails) =>
					this._usersRepository.isObjectFavorite$(favoriteDetails?.objectId, favoriteDetails?.objectKind)
				),
				tap((isFavorite) => (this.isFavorite = isFavorite))
			)
			.subscribe();
	}

	/**
	 * Call the user repo to update connected
	 * @returns
	 */
	public toggleFavoriteItemState() {
		return this._usersRepository.toggleFavoriteObjectState(
			this.favoriteDetails?.objectId,
			this.favoriteDetails?.objectKind
		);
	}
}
