import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BrandsRepository, Brand } from '@rumble-pwa/brands/state';
import { FilesRepository } from '@rumble-pwa/files/state';
import { DataObsViaId } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-welcome-step',
	templateUrl: './export-welcome-step.component.html',
	styleUrls: ['./export-welcome-step.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportWelcomeStepComponent {
	steptitle?: string;
	stepdescription?: string;
	playlistid?: string;

	imagePath?: string;

	imageAsStr$$$ = new DataObsViaId<string>((fileId: string) => this.filesRepository.convertEntityFileIdToUrl$(fileId));

	brand$$$ = new DataObsViaId<Brand>((brandId: string) => this._brandsRepository.get$(brandId));

	_attrs: any;
	@Input()
	public set attrs(v: any) {
		this._attrs = JSON.parse(v);
		this.steptitle = this._attrs.steptitle;
		this.stepdescription = this._attrs.stepdescription;
		this.playlistid = this._attrs.playlistid;
		this.imageAsStr$$$.id = this._attrs.imageid;
		this.brand$$$.id = this._attrs.brandid;
	}
	public get attrs(): any {
		return this._attrs;
	}

	constructor(
		private filesRepository: FilesRepository,
		private cdr: ChangeDetectorRef,
		private _brandsRepository: BrandsRepository
	) {
		this.imageAsStr$$$.$.pipe(
			untilDestroyed(this),
			tap((imageAsStr) => {
				this.imagePath = imageAsStr;
				this.cdr.markForCheck();
			})
		).subscribe();

		this.brand$$$.$.pipe(
			untilDestroyed(this),
			tap(() => this.cdr.markForCheck())
		).subscribe();
	}
}
