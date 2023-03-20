import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AudioPack, AudioPackItem } from '@rumble-pwa/brands/state';
import { FileTableComponent, FileWithOwner } from '@rumble-pwa/files/display';
import { FilesRepository } from '@rumble-pwa/files/state';
import { CanBeDebugged, CanCheck, HasLayoutSize, LayoutService, LayoutSizeAndCheck } from '@rumble-pwa/utils';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { UsersRepository } from '@rumble-pwa/users/state';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	standalone: true,
	selector: 'rumble-pwa-audio-packs-list',
	templateUrl: './audio-packs-list.component.html',
	styleUrls: ['./audio-packs-list.component.scss'],
	imports: [
		CommonModule,
		ObjectColumnComponent,
		ObjectListComponent,
		MatButtonModule,
		MatIconModule,
		MatMenuModule,
		FileTableComponent,
	],
})
export class AudioPacksListComponent extends LayoutSizeAndCheck implements CanCheck, HasLayoutSize, CanBeDebugged {
	_audioPacks: AudioPack[] = [];

	@Input()
	public set audioPacks(newAudioPacks) {
		this._audioPacks = newAudioPacks;
		this.audioPacksWithFiles$ = newAudioPacks.map((newAudioPack) => {
			return {
				audioPack: newAudioPack,
				files: this.getAudioPackItemsAsFilesWithOwner$(newAudioPack),
			};
		});
		this._check();
	}
	public get audioPacks() {
		return this._audioPacks;
	}

	audioPacksWithFiles$?: { audioPack: AudioPack; files: Observable<FileWithOwner[]> }[];

	audioPackItemsColumnsHidden = ['preview', 'publicName', 'owner', 'timeCreation', 'favorite'];

	@Output()
	deleteAudioPackEvent = new EventEmitter<number>();

	@Output()
	updatedAudioPackEvent = new EventEmitter<AudioPack>();

	@Output()
	openAudioPackPromptEvent = new EventEmitter<AudioPack | undefined>();

	@Output()
	deleteAudioPackItemEvent = new EventEmitter<{ audioPack: AudioPack; audioPackItem: AudioPackItem }>();

	@Output()
	openAudioPackItemPromptEvent = new EventEmitter<{ audioPack: AudioPack; audioPackItem: AudioPackItem | undefined }>();

	editMode = false;

	@Input() canYouEdit?: boolean;

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _filesRepository: FilesRepository,
		private _usersRepository: UsersRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);
	}

	openAddAudioPackPrompt(audioPack?: AudioPack) {
		this.openAudioPackPromptEvent.emit(audioPack);
	}

	deleteAudioPack(audioPack: AudioPack) {
		this.deleteAudioPackEvent.emit(this.audioPacks.indexOf(audioPack));
	}

	updateAudioPack(audioPack: AudioPack) {
		this.updatedAudioPackEvent.emit(audioPack);
	}

	deleteAudioPackItem(audioPack: AudioPack, audioPackItemId: string) {
		const audioPackItem = audioPack.audioPackItems.find((a) => a.id === audioPackItemId);
		if (!audioPackItem) return;
		this.deleteAudioPackItemEvent.emit({ audioPack, audioPackItem });
	}

	openAudioPackItemPrompt(audioPack: AudioPack, audioPackItemId?: string) {
		const audioPackItem = audioPack.audioPackItems.find((a) => a.id === audioPackItemId);
		this.openAudioPackItemPromptEvent.emit({ audioPack, audioPackItem });
	}

	getAudioPackItemsAsFilesWithOwner$(audioPack: AudioPack): Observable<FileWithOwner[]> {
		const audioPackItems = audioPack.audioPackItems;
		const audioPackItemsAsFilesWithOwner$: Observable<FileWithOwner | undefined>[] = audioPackItems.map((audioPackItem) => {
			const audioPackItemAsFileWithOwner$: Observable<FileWithOwner | undefined> = this._filesRepository
				.get$(audioPackItem.fileId)
				.pipe(
					switchMap((file) => {
						if (!file) return of(undefined);
						return this._usersRepository.get$(file.ownerId).pipe(
							map((owner) => {
								const fileWithOwnerWithExtraData: FileWithOwner = {
									...file,
									owner,
									extraId: audioPackItem.id,
									extraName: audioPackItem.audioTitle,
									extraDescription: audioPackItem.audioDescription,
								};
								return fileWithOwnerWithExtraData;
							})
						);
					})
				);
			return audioPackItemAsFileWithOwner$;
		});
		return combineLatest(audioPackItemsAsFilesWithOwner$).pipe(
			map((audioPackItemsAsFilesWithOwner) =>
				audioPackItemsAsFilesWithOwner.filter(
					(audioPackItemAsFileWithOwner): audioPackItemAsFileWithOwner is FileWithOwner =>
						!!audioPackItemAsFileWithOwner
				)
			)
		);
	}
}
