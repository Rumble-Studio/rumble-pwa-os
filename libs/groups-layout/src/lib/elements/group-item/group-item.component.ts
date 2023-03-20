/* eslint-disable sort-imports */
import { NestedTreeControl } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Brand, BrandData, BrandsRepository } from '@rumble-pwa/brands/state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { FilesRepository } from '@rumble-pwa/files/state';
import { FormsManagementService } from '@rumble-pwa/forms-system';
import { GrantsManagementService, GroupsManagementService } from '@rumble-pwa/groups-system';
import { Form, FormData, Grant, Group } from '@rumble-pwa/mega-store';
import { User } from '@rumble-pwa/users/models';
import { UsersRepository } from '@rumble-pwa/users/state';
import { CanCheck, DataObsViaId, deepEqual, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { combineLatest, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { GroupPropertiesPromptComponent } from '../group-properties-prompt/group-properties-prompt.component';
import { InviteMemberPromptComponent } from '../invite-member-prompt/invite-member-prompt.component';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-group-item',
	templateUrl: './group-item.component.html',
	styleUrls: ['./group-item.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupItemComponent extends LayoutSizeAndCheck implements CanCheck {
	treeControl = new NestedTreeControl<Group>((node) => node.children);
	dataSource: Group[] = [];
	scriptIds: string[] = [];
	group$$$ = new DataObsViaId<Group>(this._groupsManagementService.get$, this._groupsManagementService);

	public get groupId() {
		return this.group$$$.id;
	}
	@Input()
	public set groupId(value) {
		this.group$$$.id = value;
	}

	layoutSize = 0;

	groupTargets$: Observable<Group[]>;

	sharedForms?: Form[] | undefined;
	sharedBrands?: Brand[] | undefined;

	profile: User | null = null;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _groupsManagementService: GroupsManagementService,
		public dialog: MatDialog,
		private _grantsManagementService: GrantsManagementService,
		private _filesRepository: FilesRepository,
		private _formsManagementService: FormsManagementService,
		private _notificationsService: NotificationsService,
		private _brandsRepository: BrandsRepository,
		private _usersRepository: UsersRepository,
		private _notificationService: NotificationsService,
		private _router: Router
	) {
		super(_cdr, _layoutService, _activatedRoute);

		this._groupsManagementService.groups$$
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this._check();
				})
			)
			.subscribe();

		this.groupTargets$ = this._groupsManagementService.groups$$.pipe(
			untilDestroyed(this),
			map((groups) => {
				return groups
					.filter((group) => group.kind === 'team')
					.sort((prev, curr) =>
						(prev.timeCreation || 0) < (curr.timeCreation || 0)
							? 1
							: (curr.timeCreation || 0) < (prev.timeCreation || 0)
							? -1
							: 0
					);
			})
		);

		// get user profile
		this._usersRepository.connectedUser$$
			.pipe(
				untilDestroyed(this),
				tap((user) => {
					this.profile = user;
				})
			)
			.subscribe();

		// pull groups and grants data
		combineLatest([this._formsManagementService.sharedForms$, this._brandsRepository.sharedBrands$])
			.pipe(
				untilDestroyed(this),
				tap(() => {
					// to update list of children when adding a child to a group
					this._groupsManagementService.pullDataOnce();
					// to update list of virtual children when sharing an object with a group
					this._grantsManagementService.pullDataOnce();
				})
			)
			.subscribe();

		// filling the forms
		combineLatest([this._formsManagementService.sharedForms$, this.group$$$.$])
			.pipe(
				untilDestroyed(this),
				map(([sharedForms, _group]) => {
					this.sharedForms = sharedForms.filter((sharedForm) => sharedForm.state === 'default');
				})
			)
			.subscribe();

		// filling the brands
		combineLatest([this._brandsRepository.sharedBrands$, this.group$$$.$])
			.pipe(
				untilDestroyed(this),
				tap(([sharedBrands, _group]) => {
					this.sharedBrands = sharedBrands.filter((sharedBrand) => sharedBrand.state === 'default');
				})
			)
			.subscribe();

		// update cdk tree datasource with recursively filled group
		combineLatest([this._groupsManagementService.groups$$, this.group$$$.$])
			.pipe(
				untilDestroyed(this),
				map(([_, group]) => {
					return group
						? this._groupsManagementService.fillChildrenRecursively(
								group.id,
								undefined,
								undefined,
								undefined,
								undefined,
								true
						  )
						: undefined;
				}),
				tap((groupWithRecursiveChildren) => {
					this.dataSource = groupWithRecursiveChildren ? [groupWithRecursiveChildren] : [];
					this.treeControl.dataNodes = groupWithRecursiveChildren ? [groupWithRecursiveChildren] : [];
					this.treeControl.expandAll();
				})
			)
			.subscribe();

		this._layoutService.layoutSize$.pipe(untilDestroyed(this)).subscribe((layoutSize) => {
			this.layoutSize = layoutSize;
			this._check();
		});
	}

	hasChildren(_: number, node: Group) {
		if (node.kind === 'user') return false;
		return !!(node.children?.length || node.grants?.length);
		// !!node.children && node.children.length > 0;
	}

	getGroup(id: string) {
		return this._groupsManagementService.get(id);
	}

	openGroupPropertiesDialog(group: Group) {
		this.dialog.open(GroupPropertiesPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { group },
		});
	}

	editGroup(group: Group) {
		this.dialog.open(GroupPropertiesPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { group },
		});
	}

	/**
	 * Delete a group and redirect to group list page if no parent
	 * @param group group to delete
	 */
	deleteGroup(group: Group) {
		// looking for parents (if parent we don't want to redirect)
		const parents: Group[] = this._groupsManagementService.showableParents(group.id);

		this._notificationService
			.confirm(`Are you sure you want to delete the group: ${group.name} ?`)
			.subscribe((result: boolean) => {
				if (result) {
					this._groupsManagementService.delete(group.id);
					if (parents.length === 0) this._router.navigate(['groups']);
				}
			});
	}

	removeGroupFromParent(child: Group, parent: Group) {
		this._groupsManagementService.removeChildFromParent(child.id, parent.id);
	}

	createNewFolder(parent: Group) {
		this.dialog.open(GroupPropertiesPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { group: undefined, kind: 'folder', parent },
		});
	}

	createNewTeam(parent: Group) {
		this.dialog.open(GroupPropertiesPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { group: undefined, kind: 'team', parent },
		});
	}

	inviteUserPerEmailForGroup(parent: Group) {
		this.dialog.open(InviteMemberPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: parent,
		});
	}

	moveGroupToTarget(child: Group, target: Group) {
		console.log('You want to move this group:', child.name, 'to this group:', target.name);
	}

	addChildToParent(childGroup: Group, parentGroup: Group) {
		console.log('You want to add this group:', childGroup.name, 'to this group:', parentGroup.name);

		this._groupsManagementService.addChildToParent(childGroup.id, parentGroup.id);
	}
	getTeamCandidates(groupParent: Group): Group[] {
		return this._groupsManagementService
			.getAll()
			.filter((group) => group.kind === 'team' && !groupParent.children?.map((cg) => cg.id).includes(group.id));
	}
	getCandidates(groupParent: Group): Group[] {
		return this._groupsManagementService
			.getAll()
			.filter((group) => group.kind === 'user' && !groupParent.children?.map((cg) => cg.id).includes(group.id));
	}
	getFolderCandidates(groupParent: Group): Group[] {
		return this._groupsManagementService
			.getAll()
			.filter((group) => group.kind === 'folder')
			.filter((group) => !groupParent.children?.map((cg) => cg.id).includes(group.id))
			.filter((group) => group.id !== groupParent.id);
	}

	getFileCandidates(groupParent: Group): Group[] {
		// TODO: make it reactive
		return this._groupsManagementService
			.getAll()
			.filter((group) => group.kind === 'file')
			.filter((group) => {
				const entityFile = this._filesRepository.get(group.id);
				if (!entityFile) return false;
				return true;
			})
			.filter((group) => !groupParent.children?.map((cg) => cg.id).includes(group.id))
			.filter((group) => group.id !== groupParent.id);
	}

	getGrantParameter(grant: Grant, parameterKey: string) {
		const parameters = JSON.parse(grant.parameters || '{}');
		return parameters[parameterKey];
	}

	getTargetStateFromGrant$(grant: Grant) {
		switch (grant.permissionId) {
			case 'script-read': {
				const formId = this.getGrantParameter(grant, 'scriptId');
				return this._formsManagementService.get$(formId).pipe(
					untilDestroyed(this),
					map((form) => form?.state)
				);
			}
			case 'brand-read': {
				const brandId = this.getGrantParameter(grant, 'brandId');
				return this._brandsRepository.get$(brandId).pipe(
					untilDestroyed(this),
					map((brand) => brand?.state)
				);
			}
			default:
				return undefined;
		}
	}

	/**
	 *
	 * @param form form you want to be shared
	 * @param group group you want the form shared with
	 * @returns
	 */
	shareFormFromGroup(form: Form, group: Group) {
		if (!group.childIds) return;
		if (this.profile?.id !== form.ownerId) {
			this._notificationsService.warning('You are not the owner of this interview');
			return;
		}
		const formData: FormData = JSON.parse(form.data || '{}');
		const formSharedWithIds = formData.sharedWith || [];
		const newSharedWithIds = [...group.childIds, group.id];

		if (deepEqual(newSharedWithIds, formSharedWithIds)) {
			this._notificationsService.info('This interview is already shared.');
			return;
		}

		formData.sharedWith = newSharedWithIds;
		this._formsManagementService.update(form.id, {
			data: JSON.stringify(formData),
		});
	}

	/**
	 *
	 * @param brand brand you want to be shared
	 * @param group group you want the brand shared with
	 * @returns
	 */
	shareBrandFromGroup(brand: Brand, group: Group) {
		if (!group.childIds) return;
		if (this.profile?.id !== brand.ownerId) {
			this._notificationsService.warning('You are not the owner of this brand');
			return;
		}
		const brandData: BrandData = JSON.parse(brand.data || '{}');
		const brandSharedWithIds = brandData.sharedWith || [];
		const newSharedWithIds = [...group.childIds, group.id];

		if (deepEqual(newSharedWithIds, brandSharedWithIds)) {
			this._notificationsService.info('This brand is already shared.');
			return;
		}

		brandData.sharedWith = newSharedWithIds;
		this._brandsRepository.updateBrand(brand.id, {
			data: JSON.stringify(brandData),
		});
	}

	/**
	 *
	 * @param grant grant containing the permissionId to remove
	 * @returns
	 */
	removeFromGroup(grant: Grant) {
		switch (grant.permissionId) {
			case 'script-read': {
				const formId = this.getGrantParameter(grant, 'scriptId');
				if (!formId) return;
				const group = this.group$$$.value;
				if (!group || !group.childIds) return;

				const form = this._formsManagementService.get(formId);
				if (!form) return;
				if (this.profile?.id !== form.ownerId) {
					this._notificationsService.warning('You are not the owner of this interview');
					return;
				}
				const formData: FormData = JSON.parse(form.data || '{}');
				const formSharedWithIds = formData.sharedWith || [];

				if (formSharedWithIds.indexOf(group.id) < 0) {
					this._notificationsService.info('This interview is not shared with this group.');
					return;
				}

				const newSharedWithIds = [...formSharedWithIds.filter((id) => id !== group.id)];

				formData.sharedWith = newSharedWithIds;
				this._formsManagementService.update(form.id, {
					data: JSON.stringify(formData),
				});
				this._grantsManagementService.archive(grant.id);
				break;
			}
			case 'brand-read': {
				const brandId = this.getGrantParameter(grant, 'brandId');
				if (!brandId) return;
				const group = this.group$$$.value;
				if (!group || !group.childIds) return;

				const brand = this._brandsRepository.get(brandId);
				if (!brand) return;

				if (this.profile?.id !== brand.ownerId) {
					this._notificationsService.warning('You are not the owner of this brand');
					return;
				}
				const brandData: BrandData = JSON.parse(brand.data || '{}');
				const brandSharedWithIds: string[] = brandData.sharedWith || [];

				if (brandSharedWithIds.indexOf(group.id) < 0) {
					this._notificationsService.info('This brand is not shared with this group.');
					return;
				}
				const newSharedWithIds = [...brandSharedWithIds.filter((id) => id !== group.id)];

				brandData.sharedWith = newSharedWithIds;
				this._brandsRepository.updateBrand(brand.id, {
					data: JSON.stringify(brandData),
				});
				this._grantsManagementService.archive(grant.id);
				break;
			}
			default:
				break;
		}
	}
}
