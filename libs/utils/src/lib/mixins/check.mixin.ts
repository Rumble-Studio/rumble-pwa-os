import { ChangeDetectorRef } from '@angular/core';
import { AbstractConstructor, Constructor } from './constructor';

// needed
export interface HasCdrService {
	_cdr: ChangeDetectorRef;
}

// objective
export interface CanCheck {
	/**
	 * Check the state of the component with ChangeDetectorRef.check()
	 */
	_check(): void;
	_detechChanges(): void;
	checked(): void;
}

// objective in constructor result
type CanCheckCtor = Constructor<CanCheck> & AbstractConstructor<CanCheck>;

/** Mixin to augment a directive with a `_check()` property. */
export function mixinCheck<T extends AbstractConstructor<HasCdrService>>(base: T, defaultColor?: string): CanCheckCtor & T;
export function mixinCheck<T extends Constructor<HasCdrService>>(base: T): CanCheckCtor & T {
	return class extends base {
		constructor(...args: any[]) {
			super(...args);
		}
		_check() {
			// console.log('%c[' + this.constructor.name + '] check()', 'color:yellow');
			this._cdr.markForCheck();
		}

		_detechChanges() {
			// setTimeout(() => {
			this._cdr.detectChanges();
			// });
		}

		checked() {
			console.log('%c[' + this.constructor.name + '] checked', 'color:green');
		}
	};
}
