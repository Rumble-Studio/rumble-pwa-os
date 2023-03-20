import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CanBeDebugged, CanCheck, HasLayoutService, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { Upgrade } from '@rumble-pwa/upgrade/models';
import { tap } from 'rxjs/operators';
import { UpgradeDialogComponent } from '../upgrade-dialog/upgrade-dialog.component';
import { UpgradeService } from '../upgrade.service';

@UntilDestroy()
@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'upgrade',
	templateUrl: './upgrade.component.html',
	standalone: true,
	imports: [MatTooltipModule, MatButtonModule, UpgradeDialogComponent, CommonModule],
	styleUrls: ['./upgrade.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeComponent extends LayoutSizeAndCheck implements HasLayoutService, CanCheck, CanBeDebugged {
	private _upgrade?: Upgrade;
	public get upgrade() {
		return this._upgrade;
	}
	@Input()
	public set upgrade(value) {
		// console.log({ upgradeCmp: value });

		if (value) {
			if (!value.id.startsWith('upgrade:')) {
				throw new Error('Upgrade id must start with "upgrade:"');
			}
		}
		this._upgrade = value;

		this._upgradeService
			.checkGrantsAndPermissionsState$(value)
			.pipe(
				untilDestroyed(this),
				tap((state) => {
					this.hasGrantsAndPermissions = state;
					this._checkAndUpdate();
				})
			)
			.subscribe();

		this._checkAndUpdate();
	}
	private _display = false;

	// Indicates if user has all grants required
	hasGrantsAndPermissions = true;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _router: Router,
		private _upgradeService: UpgradeService,
		private _matDialog: MatDialog,
		protected sanitizer: DomSanitizer,
		protected el: ElementRef<HTMLElement>
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	/**
	 * Updates display boolean and markForCheck()
	 */
	private _checkAndUpdate() {
		this._updateHiddenState();
		this._check();
	}

	/**
	 * Updates display property of the upgrade HTML (ie. displays or not the crown)
	 */
	private _updateHiddenState() {
		if (this.upgrade) this._display = !!this.upgrade.alwaysShow || !this.hasGrantsAndPermissions;
		this.el.nativeElement.style.display = this._display ? '' : 'none';
	}

	/**
	 * Redirects to the billing page or closes the dialog
	 */
	doAction() {
		if (!this.upgrade) {
			return;
		}
		const coord = this.el.nativeElement.getBoundingClientRect();
		this._openDialog(coord.left + 10, coord.top + 10).subscribe((goBilling) => {
			if (goBilling) this._router.navigate([this.upgrade?.route ?? '/billing']);
		});
	}

	/**
	 * Opens dialog with 'Later' and 'See plans' choices
	 */
	protected _openDialog(left: number, top: number) {
		return this._matDialog
			.open<
				UpgradeDialogComponent,
				{
					upgrade: Upgrade | undefined;
				},
				string | undefined
			>(UpgradeDialogComponent, {
				width: '90%',
				maxWidth: '500px',
				data: { upgrade: this.upgrade },
				backdropClass: 'upgradeDialogBackDrop',
				panelClass: 'upgradeDialogPanel',
				closeOnNavigation: true,
			})
			.afterClosed();
	}
}
