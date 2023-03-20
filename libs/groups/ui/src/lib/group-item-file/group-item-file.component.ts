import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { DataObsViaId } from '@rumble-pwa/utils';

@Component({
	selector: 'rumble-pwa-group-item-file',
	templateUrl: './group-item-file.component.html',
	styleUrls: ['./group-item-file.component.scss'],
	standalone: true,
	imports: [
		//
		CommonModule,
		MatTooltipModule,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupItemFileComponent {
	file$$$ = new DataObsViaId<EntityFile>(this.filesRepository.get$, this.filesRepository);

	private _fileId?: string;
	public get fileId(): string | undefined {
		return this._fileId;
	}
	@Input()
	public set fileId(value: string | undefined) {
		this._fileId = value;
		this.file$$$.id = value;
	}
	constructor(private filesRepository: FilesRepository) {}
}
