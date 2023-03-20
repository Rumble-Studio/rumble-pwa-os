import { Component, ElementRef, Inject, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GrantsManagementService, GroupsManagementService } from '@rumble-pwa/groups-system';
import { BehaviorSubject, Observable } from 'rxjs';
import { PermissionsManagementService } from '@rumble-pwa/groups-system';
import { v4 as uuidv4 } from 'uuid';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { map, startWith, tap } from 'rxjs/operators';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { Grant, Group, Permission } from '@rumble-pwa/mega-store';
@UntilDestroy()
@Component({
	selector: 'rumble-pwa-add-grant',
	templateUrl: './add-grant.component.html',
	styleUrls: ['./add-grant.component.scss'],
})
export class AddGrantComponent {
	grantForm: UntypedFormGroup;
	methods: string[] = [];
	groups$$: BehaviorSubject<Group[]>;
	permissions$$: BehaviorSubject<Permission[]>;

	groupsId: string[] = [];
	newGroupsId: string[] = [];
	// groupControl = new FormControl();
	// filteredGroups: Observable<string[]>;

	sharedWith: string[] = [];

	// groupsControls = new FormControl();

	allAvailableGroups: Group[] = [];

	separatorKeysCodes: number[] = [ENTER, COMMA];
	groupCtrl = new UntypedFormControl();
	filteredGroups: Observable<Group[]>;

	private _selectedGroups: Group[] = [];
	public get selectedGroups(): Group[] {
		return this._selectedGroups;
	}
	public set selectedGroups(newSelectedGroups: Group[]) {
		if (this._selectedGroups == newSelectedGroups) return;
		this.newGroupsId = newSelectedGroups.map((group) => group.id);
		this._selectedGroups = newSelectedGroups;
	}

	@ViewChild('groupInput') groupInput?: ElementRef<HTMLInputElement>;

	@ViewChild(MatAutocompleteTrigger) autoTrigger!: MatAutocompleteTrigger;

	constructor(
		private dialogRef: MatDialogRef<AddGrantComponent>,
		private formBuilder: UntypedFormBuilder,
		private grantsManagementService: GrantsManagementService,
		private groupsManagementService: GroupsManagementService,
		private notificationsService: NotificationsService,
		private permissionsManagementService: PermissionsManagementService,
		private cdr: ChangeDetectorRef,
		@Inject(MAT_DIALOG_DATA) public data?: { grant: Grant }
	) {
		this.filteredGroups = this.groupCtrl.valueChanges.pipe(
			startWith(null),
			map((searchTerm: string | null) => (searchTerm ? this._filter(searchTerm) : this._filter('')))
		);
		const permissionId = data?.grant.permissionId;
		let permissionKey;
		if (permissionId) {
			permissionKey = this.permissionsManagementService.get(permissionId)?.key;
		}

		this.grantForm = this.formBuilder.group({
			methodName: new UntypedFormControl(data?.grant.methodName),
			parameters: new UntypedFormControl(data?.grant.parameters),
			group: new UntypedFormControl([data?.grant.groupId], Validators.required),
			permission: new UntypedFormControl(permissionKey, Validators.required),
		});
		this.grantsManagementService.getMethods$().subscribe((methods: string[]) => {
			this.methods = methods;
		});
		this.groups$$ = this.groupsManagementService.groups$$;
		this.groupsManagementService.groups$$
			.pipe(
				untilDestroyed(this),
				tap((groups) => {
					// fill toppingList with groups
					this.allAvailableGroups = groups;
					const groupAtStart = groups.find((group) => group.id === data?.grant.groupId);
					if (groupAtStart) this.selectedGroups.push(groupAtStart);
					this.check();

					// this.groupsControls.setValue(groups.map((group) => group.name).join(', '));
				})
			)
			.subscribe();

		this.permissions$$ = this.permissionsManagementService.permissions$$;

		this.grantForm.controls.group.valueChanges.pipe(untilDestroyed(this)).subscribe((groupsControls) => {
			// console.log({ groupsControls });
			this.newGroupsId = groupsControls;
			// this.updateSharedGroups(groupsControls);
			this.check();
		});

		this.groupsId = this.groupsManagementService.groups$$.value.map((group) => group.id);
	}

	save() {
		console.log(this.selectedGroups);
		if (!this.grantForm.valid) {
			this.grantForm.controls['methodName'].markAsTouched();
			this.grantForm.controls['parameters'].markAsTouched();
			this.grantForm.controls['group'].markAsTouched();
			this.grantForm.controls['permission'].markAsTouched();
			return;
		}
		this.selectedGroups.forEach((group) => {
			if (this.data && this.selectedGroups.length === 1) {
				this.updateGrant(group.id);
			} else {
				if (this.data?.grant.groupId === group.id) {
					this.updateGrant(group.id);
				} else {
					this.createGrant(group.id);
				}
			}
		});
		this.dialogRef.close();
	}

	createGrant(groupId: string) {
		const grant: Grant = {
			id: uuidv4(),
			permissionId: this.grantForm.get('permission')?.value,
			groupId: groupId,
			parameters: this.grantForm.get('parameters')?.value,
			methodName: this.grantForm.get('methodName')?.value,
		};
		console.log({ grant });
		this.grantsManagementService.add(grant);
	}

	updateGrant(groupId: string) {
		if (!this.data) return;
		const updatedGrant: Partial<Grant> = {
			permissionId: this.grantForm.get('permission')?.value,
			groupId: groupId,
			parameters: this.grantForm.get('parameters')?.value,
			methodName: this.grantForm.get('methodName')?.value,
		};
		console.log({ updatedGrant });
		this.grantsManagementService.update(this.data.grant.id, updatedGrant);
	}

	dismiss() {
		this.dialogRef.close();
	}
	delete() {
		if (this.data) {
			this.grantsManagementService.delete(this.data.grant.id);
		}
		this.dialogRef.close();
	}

	private _filter(value: string | Group): Group[] {
		if (typeof value === 'string') {
			const filterValue = value.toLowerCase();
			return this.allAvailableGroups
				.filter((group) => !this.selectedGroups.map((selectedGroup) => selectedGroup.name).includes(group.name))
				.filter((group) =>
					this.groupsManagementService.getGroupAsSearchableTerm(group.id).toLowerCase().includes(filterValue)
				);
		}
		return [value];
	}

	check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}

	removeGroup(group: Group): void {
		if (group.id === this.data?.grant.groupId) return; // we need to keep at least one group
		const index = this.selectedGroups.indexOf(group);
		if (index >= 0) {
			const newSelectedGroups = this.selectedGroups.slice();
			newSelectedGroups.splice(index, 1);
			this.selectedGroups = newSelectedGroups;
		}
		this.groupCtrl.setValue(null);
		this.check();
	}

	addGroupWithInput(): void {
		this.notificationsService.warning('Group not found.');
	}

	selectGroup(event: any): void {
		console.log({ event });
		this.selectedGroups = [...this.selectedGroups, event.option.value];
		if (this.groupInput) this.groupInput.nativeElement.value = '';
		this.groupCtrl.setValue('');
		this.openGroupSelectionPanel();
		this.check();
	}

	openGroupSelectionPanel(): void {
		setTimeout(() => {
			this.autoTrigger.openPanel();
		}, 1);
	}
}
