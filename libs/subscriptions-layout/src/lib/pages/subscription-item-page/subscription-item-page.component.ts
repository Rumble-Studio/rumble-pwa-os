import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GroupPropertiesPromptComponent } from '@rumble-pwa/groups-layout';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { Group, Subscription } from '@rumble-pwa/mega-store';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
	useObsUntilDestroyed,
} from '@rumble-pwa/utils';
import { filter, take, tap } from 'rxjs/operators';
import { SubscriptionEditorComponent } from '../../elements/subscription-editor/subscription-editor.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-subscription-item-page',
	templateUrl: './subscription-item-page.component.html',
	styleUrls: ['./subscription-item-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionItemPageComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	beneficiary$$$ = new DataObsViaId<Group>((beneficiaryId: string) => this.groupsManagementService.get$(beneficiaryId));
	subscription$$$ = new DataObsViaId<Subscription>((subscriptionId: string) =>
		this.subscriptionsManagementService.get$(subscriptionId)
	);

	subscriptions: Subscription[] = [];

	profile: User | null = null;

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;
	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private subscriptionsManagementService: SubscriptionsManagementService,
		private groupsManagementService: GroupsManagementService,
		private dialog: MatDialog,
		private usersRepository: UsersRepository,
		private _layoutRepository: LayoutRepository,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		useObsUntilDestroyed(this.usersRepository.connectedUser$$, (p) => (this.profile = p), this);

		getRouteParam$(this._activatedRoute, 'subscriptionId')
			.pipe(
				untilDestroyed(this),
				tap((subscriptionId) => {
					this.subscription$$$.id = subscriptionId;
					this._check();
				})
			)
			.subscribe();

		this.subscription$$$.$.pipe(
			untilDestroyed(this),
			tap((subscription: Subscription | undefined) => {
				if (subscription) {
					this.beneficiary$$$.id = subscription.beneficiaryId;
				}
			})
		).subscribe();

		// get all subscriptions for top list
		this.subscriptionsManagementService.subscriptions$$
			.pipe(
				untilDestroyed(this),
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
					this._check();
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.subscription$$$.$.pipe(
			untilDestroyed(this),
			tap((subscription) => {
				if (subscription) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Subscription',
								link: '/subscriptions',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-subscriptions-menu',
							},
							{
								title: subscription.name ?? 'Your subscription',
							},
						],
					});
				}
			})
		).subscribe();

		this._layoutRepository.eventPublisher$
			.pipe(
				untilDestroyed(this),
				tap((event) => {
					if (event === 'display-other-subscriptions-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	updateBeneficiary(potentialBeneficiary: Group) {
		const subscription = this.subscription$$$.value;
		if (!subscription) return;
		this.subscriptionsManagementService.addBeneficiaryToSubscription(subscription.id, potentialBeneficiary.id);
	}

	createTeamAndUpdateBeneficiary() {
		this.dialog
			.open(GroupPropertiesPromptComponent, {
				height: '800px',
				maxHeight: '90%',
				minWidth: '300px',
				width: '800px',
				maxWidth: '90%',
				data: { group: undefined, kind: 'team', preventRedirect: true },
			})
			.afterClosed()
			.subscribe((group) => {
				this.groupsManagementService
					.get$(group.id)
					.pipe(
						untilDestroyed(this),
						filter((group) => group?.toSync === false),
						take(1),
						tap((group) => {
							if (group) this.updateBeneficiary(group);
						})
					)
					.subscribe();
			});
	}

	getPotentialBeneficiaries(): Group[] {
		// list all group that could be a beneficiary (teams or users)
		const subscription = this.subscription$$$.value;
		return this.groupsManagementService
			.getAll()
			.filter((group) => (group.kind === 'user' || group.kind === 'team') && subscription?.beneficiaryId != group.id);
	}

	editSubscription() {
		this.dialog.open(SubscriptionEditorComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { subscription: this.subscription$$$.value },
		});
	}
	selectSubscription(domainId: string) {
		this._router.navigate(['/subscriptions', domainId]);
	}
}
