import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BillingService } from '@rumble-pwa/billing-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { StripeMatchingUserSubscription, StripePlan, StripePrice } from '@rumble-pwa/mega-store';
import { UsersRepository } from '@rumble-pwa/users/state';
import { RestService } from '@rumble-pwa/requests';
import { tap } from 'rxjs/operators';
import { User } from '@rumble-pwa/users/models';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-billing-page',
	templateUrl: './billing-page.component.html',
	styleUrls: ['./billing-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingPageComponent {
	public profile: User | null = null;

	// userData: any = {};
	// plans: StripePlan[] = [];
	userSubscriptions: StripeMatchingUserSubscription[] = [];

	// pricingLoading = true;
	// subscriptionLoading = false;
	// hasActiveSubscription = false;

	plans: StripePlan[] = [];

	public get matchingUserSubscription() {
		return this.billingService.matchingUserSubscription;
	}

	constructor(
		private usersRepository: UsersRepository,
		private cdr: ChangeDetectorRef,
		private restService: RestService,
		private notificationsService: NotificationsService,
		private billingService: BillingService,
		private router: Router,
		private _layoutRepository: LayoutRepository
	) {
		// profile for email validation state
		this.usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((profile) => {
					this.profile = profile;
					this.check();
				})
			)
			.subscribe();

		this.billingService.plans$$
			.pipe(
				untilDestroyed(this),
				tap((plans) => {
					this.plans = plans;
					this.check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Payment',
					link: undefined,
				},
			],
		});
		//
	}

	openStripePortal(): void {
		this.billingService.openStripePortal();
	}

	goToPlanPaymentPage(priceId: string) {
		console.log('open plan page');
		this.restService.get<string>('/payment/stripe/open-plan-payment-page/' + priceId).subscribe(
			(url) => {
				window.open(url);
			},
			(error) => {
				this.notificationsService.error(`Unexpected error: ${error?.error.detail}`, 'Error', error);
			}
		);
	}

	// needed to get a subscription
	sendValidationEmail() {
		console.log('send validation email', this.profile);
		const currentUrl = this.router.url;
		this.usersRepository.sendEmailValidation(undefined, currentUrl);
	}

	// convert Price model to displayable price
	displayPrice(price: StripePrice) {
		const currencyMap: { [currencyString: string]: string } = {
			usd: '$',
			eur: '€',
			// GBP: '£',
			// JPY: '¥',
		};

		if (price.recurring) {
			const recurrence =
				price.recurring.interval === 'month' && price.recurring.interval_count === 1
					? '/month'
					: price.recurring.interval_count + ' ' + price.recurring.interval;

			return `${price.amount} ${currencyMap[price.currency]}/${price.recurring.interval}`;
		}
		return `${price.amount} ${currencyMap[price.currency]}`;
	}

	matchSubscriptionAndPrice(priceId: StripePrice['id']) {
		return this.matchingUserSubscription.some(
			(subscription) => subscription.price.id === priceId && subscription.status === 'active'
		);
	}
	matchSubscriptionAndPlan(planId: StripePlan['id']) {
		return this.matchingUserSubscription.some(
			(subscription) => subscription.plan.id === planId && subscription.status === 'active'
		);
	}

	private check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
