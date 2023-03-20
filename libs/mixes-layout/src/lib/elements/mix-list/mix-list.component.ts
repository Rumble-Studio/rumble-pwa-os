import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Mix } from '@rumble-pwa/mega-store';
import { MixesManagementService } from '@rumble-pwa/mixes-system';
import { MixEditorPromptComponent } from '@rumble-pwa/mixes/ui';
import { TableClickEvent } from '@rumble-pwa/objects/ui';
import { v4 as uuidv4 } from 'uuid';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-mix-list',
	templateUrl: './mix-list.component.html',
	styleUrls: ['./mix-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixListComponent extends LayoutSizeAndCheck implements CanBeDebugged, HasLayoutSize, CanCheck {
	@Input() mixes: Mix[] = [];
	@Input()
	displayArchivedToggle = true;

	private _displayArchivedMixes = false;
	public get displayArchivedMixes() {
		return this._displayArchivedMixes;
	}
	@Input()
	public set displayArchivedMixes(value) {
		this._displayArchivedMixes = value;
		this.displayArchivedMixesChange.emit(value);
	}

	@Output()
	tableClickEventEmitter = new EventEmitter<TableClickEvent<any>>();
	@Output()
	displayArchivedMixesChange = new EventEmitter<boolean>();

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private mixesManagementService: MixesManagementService,
		public dialog: MatDialog,
		private notificationsService: NotificationsService
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	openDialog(mix?: Mix) {
		this.dialog.open(MixEditorPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { mix: mix },
		});
	}

	duplicateFormWithConfirmation(mix: Mix) {
		this.notificationsService.confirm('Duplicate ' + mix.name + '?').subscribe((result) => {
			if (result) {
				this.duplicateForm(mix);
			}
		});
	}

	duplicateForm(mix: Mix) {
		console.log('duplicateForm MIX', mix);

		const now = Math.round(Date.now() / 1000);

		// 1 duplicate the mix itself
		const newMix: Mix = {
			...mix,
			id: uuidv4(),
			name: `${mix.name} (copy)`,
			timeUpdate: now,
			timeCreation: now,
		};
		this.mixesManagementService.add(newMix);
		this._check();
	}

	archiveMix(mix: Mix) {
		this.notificationsService.confirm().subscribe((result) => {
			if (result) {
				this.mixesManagementService.archive(mix.id);
				this._check();
			}
		});
	}

	restoreMix(mix: Mix) {
		this.mixesManagementService.restore(mix.id);
		this.notificationsService.success('Your mix has been restored');
		this._check();
	}

	deleteForm(mix: Mix) {
		this.notificationsService.confirm().subscribe((result) => {
			if (result) {
				this.mixesManagementService.delete(mix.id);
				this._check();
			}
		});
	}

	public processTableClick(tableClickEvent: TableClickEvent<any>) {
		this.tableClickEventEmitter.emit(tableClickEvent);
	}
}
