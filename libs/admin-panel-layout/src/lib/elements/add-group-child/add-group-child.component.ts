import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { GroupsManagementService } from '@rumble-pwa/groups-system';
import { Group } from '@rumble-pwa/mega-store';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-add-child-parent',
	templateUrl: './add-group-child.component.html',
	styleUrls: ['./add-group-child.component.scss'],
})
export class AddGroupChildComponent {
	groupsId: string[] = [];
	newGroupsId: string[] = [];
	// groupControl = new FormControl();
	// filteredGroups: Observable<string[]>;

	sharedWith: string[] = [];

	groupsControls = new UntypedFormControl();

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
		private dialogRef: MatDialogRef<AddGroupChildComponent>,
		private groupsManagementService: GroupsManagementService,
		private notificationsService: NotificationsService,
		@Inject(MAT_DIALOG_DATA)
		public data: {
			group: Group;
		},
		private cdr: ChangeDetectorRef
	) {
		this.filteredGroups = this.groupCtrl.valueChanges.pipe(
			startWith(null),
			map((searchTerm: string | null) => (searchTerm ? this._filter(searchTerm) : this._filter('')))
		);

		this.groupsManagementService.groups$$
			.pipe(
				untilDestroyed(this),
				tap((groups) => {
					// fill toppingList with groups
					this.allAvailableGroups = groups;
					this.check();

					// this.groupsControls.setValue(groups.map((group) => group.name).join(', '));
				})
			)
			.subscribe();

		this.groupsControls.valueChanges.pipe(untilDestroyed(this)).subscribe((groupsControls) => {
			// console.log({ groupsControls });
			this.newGroupsId = groupsControls;
			// this.updateSharedGroups(groupsControls);
			this.check();
		});
		this.groupsId = this.groupsManagementService.groups$$.value
			.map((group) => group.id)
			.filter((groupsId) => groupsId !== this.data.group.id)
			.filter((groupsId) => {
				return !this.data.group.children?.find((child) => child.id === groupsId);
			});

		// this.filteredGroups = this.groupControl.valueChanges.pipe(
		//   startWith(''),
		//   map((value) => this._filter(value))
		// );
	}

	// private _filter(value: string): string[] {
	//   const filterValue = value.toLowerCase();

	//   return this.groupsId.filter((group) =>
	//     group.toLowerCase().includes(filterValue)
	//   );
	// }
	save() {
		// const groupIdTarget = this.groupControl.value;

		for (const groupIdTarget of this.newGroupsId) {
			if (!this.groupsId.includes(groupIdTarget)) {
				this.notificationsService.error('Could not match group ID');
				return;
			}

			this.groupsManagementService.addChildToParent(groupIdTarget, this.data.group.id);

			console.log('Child: ' + groupIdTarget + ' added to: ' + this.data.group.id);
		}
		this.dialogRef.close({ updated: true });
	}
	dismiss() {
		this.dialogRef.close({ updated: false });
	}

	addGroupWithInput(): void {
		this.notificationsService.warning('Group not found.');
	}

	removeGroup(group: Group): void {
		const index = this.selectedGroups.indexOf(group);
		if (index >= 0) {
			const newSelectedGroups = this.selectedGroups.slice();
			newSelectedGroups.splice(index, 1);
			this.selectedGroups = newSelectedGroups;
		}
		this.groupCtrl.setValue(null);
		this.check();
	}

	selectGroup(event: any): void {
		console.log({ event });
		this.selectedGroups = [...this.selectedGroups, event.option.value];
		if (this.groupInput) this.groupInput.nativeElement.value = '';
		this.groupCtrl.setValue('');
		this.openGroupSelectionPanel();
		this.check();
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

	openGroupSelectionPanel(): void {
		setTimeout(() => {
			this.autoTrigger.openPanel();
		}, 1);
	}

	check() {
		setTimeout(() => {
			this.cdr.detectChanges();
		});
	}
}
