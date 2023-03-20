import { ActivatedRoute } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';
import { getRouteQueryParam$ } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';
import { AbstractConstructor, Constructor } from './constructor';

// needed
export interface HasActivatedRouteService {
	_activatedRoute: ActivatedRoute;
}

// objective
export interface CanBeDebugged {
	_debug: boolean;
}

// objective in constructor result
type CanBeDebuggedCtor = Constructor<CanBeDebugged> & AbstractConstructor<CanBeDebugged>;

// needed in constructor
/** Mixin to augment a directive with a `_debug` property. */
export function mixinDebug<T extends AbstractConstructor<HasActivatedRouteService>>(
	base: T,
	defaultColor?: string
): CanBeDebuggedCtor & T;
export function mixinDebug<T extends Constructor<HasActivatedRouteService>>(base: T): CanBeDebuggedCtor & T {
	return class extends base {
		_debug = false;

		constructor(...args: any[]) {
			super(...args);
			getRouteQueryParam$(this._activatedRoute, 'debug')
				.pipe(
					untilDestroyed(this),
					tap((debug) => {
						this._debug = !!debug;
					})
				)
				.subscribe();
		}
	};
}
