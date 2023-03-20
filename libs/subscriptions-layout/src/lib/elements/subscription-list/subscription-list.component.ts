import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GroupPropertiesPromptComponent } from '@rumble-pwa/groups-layout';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Group, Subscription } from '@rumble-pwa/mega-store';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { useObsUntilDestroyed } from '@rumble-pwa/utils';
import { filter, take, tap } from 'rxjs/operators';
import { SubscriptionDeletePromptComponent } from '../../elements/subscription-delete-prompt/subscription-delete-prompt.component';
import { SubscriptionEditorComponent } from '../../elements/subscription-editor/subscription-editor.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-subscription-list',
	templateUrl: './subscription-list.component.html',
	styleUrls: ['./subscription-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionListComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, AfterViewInit
{
	displayedColumns: string[] = ['name', 'description', 'owner', 'beneficiary', 'seats', 'minutes', 'more'];

	expandedElement: Subscription | null | undefined;

	dataSource: MatTableDataSource<Subscription> = new MatTableDataSource([] as Subscription[]);

	private _subscriptions: Subscription[] = [];
	public get subscriptions(): Subscription[] {
		return this._subscriptions;
	}
	@Input()
	public set subscriptions(value: Subscription[]) {
		this._subscriptions = value;
		this.dataSource = new MatTableDataSource(value);
		this.setDataSourceParameters();
	}

	_paginator!: MatPaginator;
	@ViewChild(MatPaginator)
	set paginator(newPaginator: MatPaginator) {
		if (newPaginator === this._paginator) return;
		this._paginator = newPaginator;
		this.setDataSourceParameters();
	}
	get paginator() {
		return this._paginator;
	}

	_sort!: MatSort;
	@ViewChild(MatSort)
	set sort(newSort: MatSort) {
		if (newSort == this._sort) return;
		this._sort = newSort;
		this.setDataSourceParameters();
	}
	get sort() {
		return this._sort;
	}

	profile: User | null = null;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private subscriptionsManagementService: SubscriptionsManagementService,
		private dialog: MatDialog,
		private groupsManagementService: GroupsManagementService,
		private usersRepository: UsersRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		useObsUntilDestroyed(this.usersRepository.connectedUser$$, (p) => (this.profile = p), this);
	}

	ngAfterViewInit() {
		this.setDataSourceParameters();
	}

	applyFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	setDataSourceParameters() {
		// paginator
		this.dataSource.paginator = this.paginator;

		// sort
		this.dataSource.sort = this.sort;

		// filter predicate
		this.dataSource.filterPredicate = (subscription: Subscription, filter: string) =>
			((subscription.name ?? '').toLowerCase() + subscription.description?.toLowerCase()).indexOf(filter.toLowerCase()) !=
			-1;

		// sorting accessor
		this.dataSource.sortingDataAccessor = (subscription: Subscription, propertyNameAsString: string) => {
			const propertyName = propertyNameAsString as keyof Subscription;

			if (typeof subscription[propertyName] === 'string') {
				return (subscription[propertyName] as string).toLowerCase();
			}

			return subscription[propertyName] ? 1 : 0;
		};
		this._check();
	}

	getPotentialBeneficiaries(subscription: Subscription): Group[] {
		// list all group that could be a beneficiary (teams or users)
		return this.groupsManagementService
			.getAll()
			.filter((group) => (group.kind === 'user' || group.kind === 'team') && subscription.beneficiaryId != group.id);
	}
	updateBeneficiary(potentialBeneficiary: Group, subscription: Subscription) {
		this.subscriptionsManagementService.addBeneficiaryToSubscription(subscription.id, potentialBeneficiary.id);
		// this.subscriptionsManagementService.update(subscription.id, {
		// 	beneficiaryId: potentialBeneficiary.id,
		// });
	}

	createTeamAndUpdateBeneficiary(subscription: Subscription) {
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
							if (group) this.updateBeneficiary(group, subscription);
						})
					)
					.subscribe();
			});
	}

	editSubscription(subscription: Subscription) {
		this.dialog.open(SubscriptionEditorComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { subscription },
		});
	}

	deleteSubscription(subscription: Subscription) {
		this.dialog.open(SubscriptionDeletePromptComponent, {
			maxHeight: '90%',
			minWidth: '300px',
			maxWidth: '90%',
			data: subscription,
		});
	}
}
