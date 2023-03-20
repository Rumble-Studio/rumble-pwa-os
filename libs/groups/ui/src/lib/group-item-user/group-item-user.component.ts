import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { FilesRepository } from '@rumble-pwa/files/state';
import { convertUserToDisplayableName, User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { DataObsViaId } from '@rumble-pwa/utils';

@Component({
	selector: 'rumble-pwa-group-item-user',
	templateUrl: './group-item-user.component.html',
	styleUrls: ['./group-item-user.component.scss'],
	standalone: true,
	imports: [
		//
		CommonModule,
		MatTooltipModule,
		TrackClickDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupItemUserComponent {
	user$$$ = new DataObsViaId<User>((userId) => this._usersRepository.get$(userId));

	public get userId(): string | undefined {
		return this.user$$$.id;
	}
	@Input()
	public set userId(value: string | undefined) {
		this.user$$$.id = value;
	}

	convertUserToDisplayableName = convertUserToDisplayableName;

	constructor(private _usersRepository: UsersRepository, public filesRepository: FilesRepository) {}

	public getUserAvatar(user?: User) {
		return this._usersRepository.getUserAvatar(user);
	}
}
