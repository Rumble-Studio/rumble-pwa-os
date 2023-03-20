import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { SessionService } from '@rumble-pwa/mega-store';

import { RestService } from '@rumble-pwa/requests';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { UsersRepository } from '@rumble-pwa/users/state';

// interface Response {
//   token_connexion: string | null;
//   need_password: boolean | null;
// }

@Component({
	selector: 'rumble-pwa-team-invitation-claim',
	templateUrl: './team-invitation-claim.component.html',
	styleUrls: ['./team-invitation-claim.component.scss'],
})
export class TeamInvitationClaimComponent implements OnInit {
	bad_link = false;
	email: string | null = null;

	constructor(
		private activatedRoute: ActivatedRoute,
		// private authService: AuthService,
		private sessionService: SessionService,
		// private sessionStore: SessionStore,
		private restService: RestService,
		private router: Router,
		private usersRepository: UsersRepository,
		private notificationsService: NotificationsService
	) {}

	ngOnInit(): void {
		this.usersRepository.connectedUser$$.subscribe((user) => {
			if (user) this.email = user.email;
		});
		this.activatedRoute.params
			.pipe(
				map((params) => {
					if (params.token && params.token.length) {
						return params.token;
					} else {
						return null;
					}
				})
			)
			.subscribe((token) => {
				console.warn('Not implemented', token);

				// this.restService
				//   .put('/invitations/claim/' + token, {})
				//   .pipe(
				//     catchError((err) => {
				//       this.notificationsService.error('Error while logging', 'Error');
				//       this.bad_link = true;
				//       // return of({ token_connexion: null, need_password: null });

				//     }),
				//     tap((response: Response) => {
				//       console.log(response);
				//       if (
				//         response.token_connexion &&
				//         response.need_password === false
				//       ) {
				//         this.notificationsService.success('Connected', 'Login');

				//         this.sessionService.login(
				//           createInitialState({ token: response.token_connexion })
				//         );
				//         this.router.navigate(['/teams']);
				//       } else if (
				//         response.token_connexion &&
				//         response.need_password === true
				//       ) {
				//         this.sessionService.login(
				//           createInitialState({ token: response.token_connexion })
				//         );

				//         this.router.navigate(['/auth/password-reset/nopass']);
				//       }
				//     })
				//   )
				//   .subscribe((response) => {
				//     console.log(response);
				//     this.sessionService.login({
				//       token: response.token_connexion,
				//     } as SessionState);
				//   });
			});

		/*this.activatedRoute.params.pipe(
      map((params) => {
        if (params.token && params.token.length) {
           return {token: params.token, name: ''} as SessionState;
        } else {
          return {token:null, name:null} as SessionState;
        }
      })
    ).subscribe(token => {
      this.sessionStore.login(token)
    })*/
	}
}
