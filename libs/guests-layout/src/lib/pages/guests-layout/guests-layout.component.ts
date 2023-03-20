import { Component } from '@angular/core';
import { UsersRepository } from '@rumble-pwa/users/state';
@Component({
	selector: 'rumble-pwa-guests-layout',
	templateUrl: './guests-layout.component.html',
	styleUrls: ['./guests-layout.component.scss'],
})
export class GuestsLayoutComponent {
	constructor(private usersRepository: UsersRepository) {}
}
