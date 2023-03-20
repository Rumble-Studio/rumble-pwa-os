import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { DataObsViaId } from '@rumble-pwa/utils';
import { GroupItemFileComponent } from '../group-item-file/group-item-file.component';
import { GroupItemUserComponent } from '../group-item-user/group-item-user.component';

@Component({
	selector: 'rumble-pwa-group-item-generic',
	templateUrl: './group-item-generic.component.html',
	styleUrls: ['./group-item-generic.component.scss'],
	standalone: true,
	imports: [
		//
		CommonModule,
		GroupItemFileComponent,
		GroupItemUserComponent,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupItemGenericComponent {
	group$$$ = new DataObsViaId((id) => this.groupsManagementService.get$(id));

	private _groupId?: string | undefined;
	public get groupId(): string | undefined {
		return this._groupId;
	}
	@Input()
	public set groupId(value: string | undefined) {
		this._groupId = value;
		this.group$$$.id = value;
	}

	@Input()
	hideIcon = false;

	constructor(private groupsManagementService: GroupsManagementService) {}
}
