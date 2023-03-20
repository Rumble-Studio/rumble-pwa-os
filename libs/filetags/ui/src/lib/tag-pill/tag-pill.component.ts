import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PillComponent } from '@rumble-pwa/atomic-system';
import { Filetag } from '@rumble-pwa/files/models';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'tag-pill',
	standalone: true,
	imports: [
		//
		CommonModule,
		PillComponent,
		MatTooltipModule,
		MatIconModule,
		TrackClickDirective,
	],
	templateUrl: './tag-pill.component.html',
	styleUrls: ['./tag-pill.component.scss'],
})
export class TagPillComponent {
	@Input() filetag?: Filetag;
	@Input() displayRemoveBtn = false;
	@Output() removeBtnClickEvent = new EventEmitter<boolean>();

	constructor() {
		// private graphqlService: GraphqlService // private filetagsRepository: FiletagsRepository,
		// this.filetagsRepository.filetags$
		// 	.pipe(
		// 		untilDestroyed(this),
		// 		tap((filetags) => {
		// 			console.log('filetags', filetags);
		// 		})
		// 	)
		// 	.subscribe();
	}

	processRemoveBtnClickEvent() {
		this.removeBtnClickEvent.emit(true);
	}

	// requeryGraphql() {
	// 	this.graphqlService.mainQuery().subscribe((res) => {
	// 		console.log('GRAPHQL filetags', res);
	// 	});
	// }
}
