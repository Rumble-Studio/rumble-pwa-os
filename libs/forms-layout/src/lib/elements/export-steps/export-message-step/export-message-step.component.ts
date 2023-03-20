import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { FilesRepository } from '@rumble-pwa/files/state';
import { DataObsViaId } from '@rumble-pwa/utils';

import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-message-step',
	templateUrl: './export-message-step.component.html',
	styleUrls: ['./export-message-step.component.scss'],
})
export class ExportMessageStepComponent {
	steptitle?: string;
	stepdescription?: string;
	playlistid?: string;

	imagePath?: string;

	imageAsStr$$$ = new DataObsViaId<string>((fileId: string) => this.filesRepository.convertEntityFileIdToUrl$(fileId));

	_attrs: any;
	@Input()
	public set attrs(v: any) {
		this._attrs = JSON.parse(v);
		this.steptitle = this._attrs.steptitle;
		this.stepdescription = this._attrs.stepdescription;
		this.playlistid = this._attrs.playlistid;
		this.imageAsStr$$$.id = this._attrs.imageid;
	}
	public get attrs(): any {
		return this._attrs;
	}

	constructor(private filesRepository: FilesRepository, private cdr: ChangeDetectorRef) {
		this.imageAsStr$$$.$.pipe(
			untilDestroyed(this),
			tap((imageAsStr) => {
				this.imagePath = imageAsStr;
				this.cdr.markForCheck();
			})
		).subscribe();
	}
}
