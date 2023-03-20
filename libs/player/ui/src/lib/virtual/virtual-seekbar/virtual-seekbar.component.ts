/* eslint-disable @typescript-eslint/no-inferrable-types */
import { CommonModule } from '@angular/common';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { FormCustomisationDetails } from '@rumble-pwa/mega-store';
import { MultiSeekEvent } from '@rumble-pwa/player/services';
import { cumSum, UtilsModule } from '@rumble-pwa/utils';
import { isEqual } from 'lodash';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-virtual-seekbar',
	standalone: true,
	imports: [
		//
		CommonModule,
		UtilsModule,
		TrackClickDirective,
	],
	templateUrl: './virtual-seekbar.component.html',
	styleUrls: ['./virtual-seekbar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualSeekbarComponent
	extends LayoutSizeAndCheck
	implements CanCheck, HasLayoutSize, CanBeDebugged, AfterViewInit
{
	@Input()
	hideTimes = false;

	@ViewChild('progressBar', { static: true })
	progressBarRef!: ElementRef<HTMLDivElement>;
	@ViewChild('playBar', { static: true })
	playBarRef!: ElementRef<HTMLDivElement>;

	@Input()
	showMultiBar = true;

	position?: number = undefined;

	_percentage = 0;
	set percentage(newPercentage: number) {
		if (this._percentage == newPercentage) return;
		this._percentage = newPercentage;
		if (this.playBarRef) {
			this.playBarRef.nativeElement.style.width = '' + 100 * this._percentage + '%';
		}
		this.position = this.totalDuration ? this.totalDuration * this._percentage : undefined;
		// console.log('%c percentage received in vs', 'color: purple; font-weight: bold;', newPercentage);
		this._check();
	}
	get percentage() {
		return this._percentage;
	}

	totalDuration?: number = undefined;
	cumulativeDurations: number[] = [];
	durationsToUse: number[] = [];
	_durations: number[] = [];
	@Input()
	set durations(newDurations: number[]) {
		if (isEqual(this._durations, newDurations)) {
			return;
		}
		this._durations = newDurations;

		this.totalDuration = newDurations.reduce((a, b) => a + (b > 0 ? b : 0), 0);

		// console.log('%c durations received in vs', 'color: purple; font-weight: bold;', new);
		this.generateVirtualCumulativeDurations(newDurations);
		this._detechChanges();
	}
	get durations() {
		return this._durations;
	}

	_indexBeingPlayed: number = 0;
	@Input()
	set indexBeingPlayed(newIndexBeingPlayed) {
		this._indexBeingPlayed = newIndexBeingPlayed;
		this._updatePercentage();
	}
	get indexBeingPlayed() {
		return this._indexBeingPlayed;
	}

	_percentageOfCurrentSong: number = 0;
	@Input()
	set percentageOfCurrentSong(newPercentageOfCurrentSong) {
		this._percentageOfCurrentSong = newPercentageOfCurrentSong;

		this._updatePercentage();
	}
	get percentageOfCurrentSong() {
		return this._percentageOfCurrentSong;
	}

	@Output() seekMultiEvent: EventEmitter<MultiSeekEvent> = new EventEmitter<MultiSeekEvent>();

	@Input()
	lightColor = '#fceeb6';
	@Input()
	darkColor = '#f5ca1b';

	private _formCustomisationDetails?: FormCustomisationDetails;
	public get formCustomisationDetails() {
		return this._formCustomisationDetails;
	}
	@Input()
	public set formCustomisationDetails(value) {
		this._formCustomisationDetails = value;
		if (value?.playbarColor) {
			this.darkColor = value.playbarColor;
			this.lightColor = value.playbarColor + '80';
		}
	}

	constructor(_cdr: ChangeDetectorRef, _layoutService: LayoutService, _activateRoute: ActivatedRoute) {
		super(_cdr, _layoutService, _activateRoute);
	}

	ngAfterViewInit() {
		this.progressBarRef.nativeElement.addEventListener('click', (event) => {
			this.seek(event);
		});
		this.progressBarRef.nativeElement.addEventListener('dblclick', (event) => {
			this.seek(event, true);
		});
		this._check();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seek(e: any, dblclick = false, updateDirectly = false) {
		const percent = e.offsetX / this.progressBarRef.nativeElement.offsetWidth;
		if (updateDirectly) this.percentage = percent;

		const indexToSeek = this.cumulativeDurations.findIndex((d) => d > percent);

		const songComputedDuration = percent - (indexToSeek > 0 ? this.cumulativeDurations[indexToSeek - 1] : 0);

		const percentageOfSongToSeek = songComputedDuration / this.durationsToUse[indexToSeek];

		this.seekMultiEvent.emit({
			indexToSeek,
			percentageOfSongToSeek,
			play: dblclick,
			pause: false,
		});
	}
	generateVirtualCumulativeDurations(newDurations: number[]) {
		// convert real duration (invalid or negative) to
		// a new list for visual representation

		const virtualDurationsArray = newDurations;

		const minSize = 10;
		const maxRatio = 3;

		// longest real duration
		const currentMaxSize = virtualDurationsArray.some((d) => d > 0) ? Math.max(...virtualDurationsArray) : minSize;

		// virtual representation of the longest duration
		const maxSizeToUse = currentMaxSize > maxRatio * minSize ? maxRatio * minSize : currentMaxSize;

		// if negative values: get minimal size for representation
		// if duration bigger than max virtual, then max virtual, else duration directly
		let durationsToUse = virtualDurationsArray
			.map((d) => (d <= 0 ? (d < -1 ? 0 : minSize) : d))
			.map((d) => (d > maxSizeToUse ? maxSizeToUse : d));

		let totalVirtualDuration = 0;
		for (const number of durationsToUse) {
			totalVirtualDuration += number;
		}

		// we normalise duration by the total
		durationsToUse = durationsToUse.map((d) => d / totalVirtualDuration);

		this.durationsToUse = durationsToUse;
		this.cumulativeDurations = cumSum(durationsToUse).map((d) => Math.round(d * 100) / 100);
	}

	private _updatePercentage() {
		if (this.indexBeingPlayed == 0)
			this.percentage = this.percentageOfCurrentSong * this.durationsToUse[this.indexBeingPlayed];

		if (this.indexBeingPlayed > 0)
			this.percentage =
				this.cumulativeDurations[this.indexBeingPlayed - 1] +
				this.percentageOfCurrentSong * this.durationsToUse[this.indexBeingPlayed];
	}
}
