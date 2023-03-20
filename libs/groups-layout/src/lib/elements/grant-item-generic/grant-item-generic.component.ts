import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { DataObsViaId } from '@rumble-pwa/utils';
import { GrantsManagementService } from '@rumble-pwa/groups-system';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { tap } from 'rxjs/operators';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { BrandsRepository } from '@rumble-pwa/brands/state';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-grant-item-generic',
	templateUrl: './grant-item-generic.component.html',
	styleUrls: ['./grant-item-generic.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrantItemGenericComponent {
	grant$$$ = new DataObsViaId(this._grantsManagementService.get$, this._grantsManagementService);

	private _grantId?: string;
	public get grantId() {
		return this._grantId;
	}
	@Input()
	public set grantId(value) {
		// console.log('grantId', value);
		this._grantId = value;
		this.grant$$$.id = value;
	}

	constructor(
		private _grantsManagementService: GrantsManagementService,
		private _formsManagementService: FormsManagementService,
		private _brandsRepository: BrandsRepository,
		private _cdr: ChangeDetectorRef
	) {
		this.grant$$$.$.pipe(
			untilDestroyed(this),
			tap(() => {
				this._check();
			})
		).subscribe();
	}

	getForm() {
		if (!this.grant$$$.value) return;
		const parameters = JSON.parse(this.grant$$$.value.parameters || '{}');
		if (!parameters.scriptId) return;
		const form = this._formsManagementService.get(parameters.scriptId);
		return form;
	}
	getBrand() {
		if (!this.grant$$$.value) return;
		const parameters = JSON.parse(this.grant$$$.value.parameters || '{}');
		if (!parameters.brandId) return;
		const brand = this._brandsRepository.get(parameters.brandId);
		return brand;
	}
	private _check() {
		setTimeout(() => {
			this._cdr.detectChanges();
		});
	}
}
