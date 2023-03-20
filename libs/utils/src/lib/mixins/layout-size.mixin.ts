import { untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { LayoutService } from '../services/layout.service';
import { CanCheck } from './check.mixin';
import { AbstractConstructor, Constructor } from './constructor';

// needed
export interface HasLayoutService extends CanCheck {
	// canCheck implies cdr is available
	_layoutService: LayoutService;
}

// objective
export interface HasLayoutSize {
	layoutSize$: Observable<number>;
	layoutSize: number;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
}

// objective in construcor result
type HasLayoutSizeCtor = Constructor<HasLayoutSize> & AbstractConstructor<HasLayoutSize>;

/** Mixin to augment a directive with a `layoutSize` and `layoutSize$` property. */
export function mixinLayoutSize<T extends AbstractConstructor<HasLayoutService>>(
	base: T,
	defaultColor?: string
): HasLayoutSizeCtor & T;
export function mixinLayoutSize<T extends Constructor<HasLayoutService>>(base: T): HasLayoutSizeCtor & T {
	return class extends base {
		private _layoutSize = 3;
		get layoutSize() {
			return this._layoutSize;
		}
		set layoutSize(value) {
			if (value !== this._layoutSize) {
				this._layoutSize = value;
			}
		}

		get layoutSize$() {
			return this._layoutService.layoutSize$;
		}

		isMobile = false;
		isTablet = false;
		isDesktop = false;

		constructor(...args: any[]) {
			super(...args);
			this._layoutService.layoutSize$.pipe(untilDestroyed(this)).subscribe((layoutSize) => {
				this.layoutSize = layoutSize;
				this.isMobile = layoutSize < 1;
				this.isTablet = layoutSize >= 1 && layoutSize <= 2;
				this.isDesktop = layoutSize > 2;
				this._check();
			});
		}
	};
}
