import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-filetag-list',
	standalone: true,
	imports: [
		//
		CommonModule,
	],
	templateUrl: './filetag-list.component.html',
	styleUrls: ['./filetag-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiletagListComponent {}
