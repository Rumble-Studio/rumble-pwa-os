import { UsersRepository } from '@rumble-pwa/users/state';
import { Injectable } from '@angular/core';
import { selectPersistStateInit } from '@datorama/akita';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { StripeMatchingUserSubscription, StripePlan, StripeSubscriptions } from '@rumble-pwa/mega-store';
import { RestService } from '@rumble-pwa/requests';
import { isEqual } from 'lodash';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import minimatch from 'minimatch';

const launchDate = 1651615201 * 1000; // launch date 4may 00:00:01
const sevenDays = 60 * 60 * 24 * 10 * 1000;

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class BillingService {
	// plans
	plans$$ = new BehaviorSubject<StripePlan[]>([]);
	public get plans() {
		return this.plans$$.value;
	}
	public set plans(value) {
		if (!isEqual(this.plans$$.value, value)) {
			// console.log('[billingService] set plans', value);
			this.plans$$.next(value);
		}
	}

	userSubscriptions$$ = new BehaviorSubject<StripeSubscriptions | null>(null);
	public get userSubscriptions() {
		return this.userSubscriptions$$.value;
	}
	public set userSubscriptions(value) {
		if (!isEqual(this.userSubscriptions$$.value, value)) {
			// console.log('[billingService] set userSubscriptions', value);
			this.userSubscriptions$$.next(value);
		}
	}

	usersSubscriptions$$ = new BehaviorSubject<StripeSubscriptions | null>(null);
	public get usersSubscriptions() {
		return this.usersSubscriptions$$.value;
	}
	public set usersSubscriptions(value) {
		if (!isEqual(this.usersSubscriptions$$.value, value)) {
			this.usersSubscriptions$$.next(value);
		}
	}

	matchingUserSubscription: StripeMatchingUserSubscription[] = [];

	hasActiveSubscription$$ = new BehaviorSubject<boolean | undefined>(undefined);

	constructor(
		private notificationsService: NotificationsService,
		private restService: RestService,
		private _usersRepository: UsersRepository
	) {
		selectPersistStateInit()
			.pipe(untilDestroyed(this), take(1))
			.subscribe(() => {
				this.requestPlans();
				this._usersRepository.connectedUser$$
					.pipe(
						untilDestroyed(this),
						tap((profile) => {
							if (profile?.emailValidated) {
								this.requestUserSubscriptions();
							}
							if (profile?.isSuperuser) {
								this.requestUsersSubscriptions();
							}
						})
					)
					.subscribe();
				combineLatest([this.userSubscriptions$$, this.plans$$, this._usersRepository.connectedUser$$])
					.pipe(
						untilDestroyed(this),
						filter(
							([userSubscriptions, plans, profile]) =>
								!!userSubscriptions && !!plans && plans.length > 0 && !!profile?.id
						),
						switchMap(([subscriptions, plans, profile]) => {
							const filteredSubscriptions: StripeMatchingUserSubscription[] = [];
							// loop over subscriptions
							subscriptions?.data.forEach((subscription) => {
								plans.forEach((planCandidate) => {
									// loop over prices
									planCandidate.prices.forEach((priceCandidate) => {
										// if price id matches subscription price id
										if (priceCandidate.id === subscription.plan?.id) {
											const price = priceCandidate;
											const plan = planCandidate;
											const subscriptionCandidate: StripeMatchingUserSubscription = {
												price,
												plan,
												status: subscription.status ?? '',
												cancelAt: subscription.cancel_at,
												currentPeriodEnd: subscription.current_period_end ?? null,
											};
											filteredSubscriptions.push(subscriptionCandidate);
										}
									});
								});
							});
							return of(filteredSubscriptions);
							// return of(null);
						}),
						tap((subscriptions) => {
							// console.log('set subscriptions', subscriptions);
							this.matchingUserSubscription = subscriptions;
							this.hasActiveSubscription$$.next(
								subscriptions.some((subscription) => subscription.status === 'active') ||
									this.noNeedForSubscription()
							);
						})
					)
					.subscribe();
			});
	}

	requestPlans() {
		this.restService.get<StripePlan[]>('/payment/stripe/list-plans').subscribe(
			(plans) => {
				this.plans = [...plans];
			},
			(error) => {
				this.plans =
					this.plans.length > 0
						? this.plans
						: [
								{
									id: '<unset>',
									name: 'Error',
									description: 'Plans not available',
									prices: [],
									metadata: { displayInApp: 'true' },
								},
						  ];
			}
		);
	}

	createStripeAccount() {
		// console.log('create stripe account');
		this.restService.get('/payment/stripe/create-account', {}).subscribe(
			() => {
				this.notificationsService.success('Billing account created.');
			},
			(error) => {
				this.notificationsService.error(`Unexpected error: ${error?.error.detail}`, 'Error', error);
			}
		);
	}

	requestUserSubscriptions() {
		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				filter((profile) => !!profile?.emailValidated),
				take(1),
				// takeWhile(profile => !!profile?.id),
				tap((profile) => {
					if (profile?.emailValidated) {
						this.restService.get<StripeSubscriptions>('/payment/stripe/list-user-subscriptions').subscribe(
							(subscriptions) => {
								this.userSubscriptions = subscriptions;
							},
							(error) => {
								this.notificationsService.error(
									`An error occured while loading the subscriptions, please try again later.`,
									'Error',
									error
								);
							}
						);
					}
				})
			)
			.subscribe();
	}

	requestUsersSubscriptions() {
		// this.profileQuery.profile$
		// 	.pipe(
		// 		untilDestroyed(this),
		// 		filter((profile) => !!profile?.emailValidated),
		// 		take(1),
		// 		// takeWhile(profile => !!profile?.id),
		// 		tap((profile) => {
		// 			if (profile?.emailValidated) {
		// 				this.restService.get<StripeSubscriptions>('/payment/stripe/all-users-subscriptions').subscribe(
		// 					(subscriptions) => {
		// 						this.usersSubscriptions = subscriptions;
		// 					},
		// 					(error) => {
		// 						this.notificationsService.error(
		// 							`An error occured while loading the subscriptions, please try again later.`,
		// 							'Error',
		// 							error
		// 						);
		// 					}
		// 				);
		// 			}
		// 		})
		// 	)
		// 	.subscribe();
	}

	openStripePortal() {
		this.restService.get<string>('/payment/stripe/open-customer-portal').subscribe(
			(url) => {
				window.open(url, '_blank');
			},
			(error) => {
				this.notificationsService.error(`Unexpected error: ${error?.error.detail}`, 'Error', error);
			}
		);
	}

	goToPlanPaymentPage(priceId: string) {
		this.restService.get<string>('/payment/stripe/open-plan-payment-page/' + priceId).subscribe(
			(url) => {
				window.open(url);
			},
			(error) => {
				this.notificationsService.error(`Unexpected error: ${error?.error.detail}`, 'Error', error);
			}
		);
	}

	getPercentageDone() {
		const now = new Date().getTime();
		const userCreated = (this._usersRepository.connectedUser$$.value?.timeCreation ?? 0) * 1000;
		const launchEnds = launchDate + sevenDays;
		const trialEnds = userCreated + sevenDays;
		const deadline = Math.max(launchEnds, trialEnds);
		const beginningOfCountdown = Math.min(userCreated, launchDate);
		const totalTime = deadline - beginningOfCountdown;
		return Math.round(((now - beginningOfCountdown) / totalTime) * 100);
	}

	getTimeLeft(customTime?: number) {
		const now = new Date().getTime();
		const userCreated = customTime ?? (this._usersRepository.connectedUser$$.value?.timeCreation ?? 0) * 1000;
		const launchEnds = launchDate + sevenDays;
		const trialEnds = userCreated + sevenDays;
		const deadline = Math.max(launchEnds, trialEnds);
		const timeLeft = deadline - now;
		return timeLeft;
	}

	getTimeLeftAStr(customTime?: number) {
		const timeLeft = this.getTimeLeft(customTime);
		if (timeLeft < 0) {
			return 'Time is up!';
		}
		const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
		const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

		if (days > 0) {
			return `${days} days, ${hours} hours`;
		}
		if (hours > 0) {
			return `${hours} hours, ${minutes} minutes`;
		}
		if (minutes > 0) {
			return `${minutes} minutes, ${seconds} seconds`;
		}
		return `${seconds} seconds left`;
		// return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds left`;
		// 125 494 834
	}

	noNeedForSubscription() {
		const users_exception = [
			'*@rumble.studio',
			'bob@example.com',
			'hans@conversationdesigninstitute.com',
			'*@biocodex.fr',
			'*@pitchloop.io',
			'*@wilco-startup.com',
			'*@havas.com',
			'*@voicebot.ai',
			'lyle@netflix.com',
			'lyle@troxell.com',
			'philippe.chapot@gmail.com',
		];
		const userEmail = this._usersRepository.connectedUser$$.value?.email;
		if (!userEmail) return false;

		let theMatch = undefined;

		const match = users_exception.some((pattern) => {
			const patternMatching = minimatch(userEmail, pattern, {
				nocase: true,
				debug: false,
			});
			if (patternMatching) {
				theMatch = pattern;
			}
			return patternMatching;
		});
		if (match) console.log('Matching with', userEmail, theMatch);

		return match;
	}
}
