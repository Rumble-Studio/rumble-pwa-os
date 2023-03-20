import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LayoutService } from '../services/layout.service';
import { mixinCheck } from './check.mixin';
import { mixinDebug } from './debug.mixin';
import { mixinLayoutSize } from './layout-size.mixin';

export const LayoutSizeAndCheck = mixinLayoutSize(
	mixinCheck(
		mixinDebug(
			class {
				constructor(
					public _cdr: ChangeDetectorRef,
					public _layoutService: LayoutService,
					public _activatedRoute: ActivatedRoute
				) {}
			}
		)
	)
);

export const Check = mixinCheck(
	class {
		constructor(public _cdr: ChangeDetectorRef) {}
	}
);
