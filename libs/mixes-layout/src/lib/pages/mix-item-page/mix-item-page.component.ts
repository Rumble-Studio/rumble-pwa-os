import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Location } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	TemplateRef,
	ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DEFAULT_DIALOG_CONFIG } from '@rumble-pwa/atomic-system';
import { BrokerService, BROKE_OPTIONS } from '@rumble-pwa/broker-system';
import { NotificationsService } from '@rumble-pwa/client-notifications';
import { VirtualExportRequestData, VirtualExportResult } from '@rumble-pwa/exports/models';
import { ExportsRepository } from '@rumble-pwa/exports/state';
import { VirtualExportRequesterPromptComponent } from '@rumble-pwa/exports/ui';
import { convertEntityFileToUrl, EntityFile } from '@rumble-pwa/files/models';
import { FilesRepository } from '@rumble-pwa/files/state';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_ITEM } from '@rumble-pwa/layout/state';
import { Mix, MixData, MixDetails } from '@rumble-pwa/mega-store';
import { MixesManagementService, NewMixData } from '@rumble-pwa/mixes-system';
import { MixEditorPromptComponent } from '@rumble-pwa/mixes/ui';
import {
	FileForVirtualTrack,
	VirtualPlayerService,
	VirtualPlaylist,
	VirtualPlaylistWithStreamStates,
	VirtualTrack,
} from '@rumble-pwa/player/services';
import { UsersRepository } from '@rumble-pwa/users/state';
import {
	CanBeDebugged,
	CanCheck,
	DataObsViaId,
	getRouteParam$,
	getRouteQueryParam$,
	HasLayoutSize,
	LayoutService,
	LayoutSizeAndCheck,
} from '@rumble-pwa/utils';
import { cloneDeep, flatten } from 'lodash';
import { combineLatest, of, Subject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { MixExportsPromptComponent } from '../../elements/mix-exports-prompt/mix-exports-prompt.component';

type PageAction = 'mix' | 'export' | null;
type MenuToShow = 'sources' | 'other' | 'settings' | null;
type MenuToShow2 = 'interviews' | 'favorites' | 'files' | 'jingles' | 'brands' | null;

const virtualPlaylistIdPrefix = 'mix-';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-mix-item-page',
	templateUrl: './mix-item-page.component.html',
	styleUrls: ['./mix-item-page.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MixItemPageComponent extends LayoutSizeAndCheck implements OnDestroy, CanCheck, CanBeDebugged, HasLayoutSize {
	// for drawers and menu
	menuToShow: MenuToShow = 'sources';
	previousMenuToShow: MenuToShow = null;
	menu2ToShow: MenuToShow2 = 'interviews';
	previousMenu2ToShow: MenuToShow2 = null;
	selectedAction: PageAction = 'mix';
	selected2Action: PageAction = 'mix';

	// mix data for main mix
	public mix$$$ = new DataObsViaId<Mix>((mix: string) => this._mixesManagementService.get$(mix));
	private _virtualPlaylistIdentifier?: string;

	// for main mix virtual playlist (filled by mix$$$ data2 vp id)
	public connectDropTo: string[] = [];

	// for top menu
	public availableMixes: Mix[] = [];

	// input of main virtual playlist
	public playlistState: VirtualPlaylistWithStreamStates | null = null;

	// used to clear virtual playlist on destroy

	// if playlistItems[] detected in mix.data
	public displayOldVersionMessage = false;

	private _destroy$ = new Subject();

	// empty trigger to open menu on segment click
	@ViewChild('otherItemMenuTrigger') otherItemMenuTrigger?: MatMenuTrigger;

	private _centralTemplate?: TemplateRef<HTMLElement> | undefined;
	public get centralTemplate(): TemplateRef<HTMLElement> | undefined {
		return this._centralTemplate;
	}
	@ViewChild('centralTemplate')
	public set centralTemplate(value: TemplateRef<HTMLElement> | undefined) {
		this._centralTemplate = value;
		this._layoutRepository.centralTemplate = value;
	}

	constructor(
		_cdr: ChangeDetectorRef,
		_layoutService: LayoutService,
		_activatedRoute: ActivatedRoute,
		private _dialog: MatDialog,
		private _notificationsService: NotificationsService,
		private _usersRepository: UsersRepository,
		private _mixesManagementService: MixesManagementService,
		private _router: Router,
		private _location: Location,
		private _brokerService: BrokerService,
		private _virtualPlayerService: VirtualPlayerService,
		private _ExportsRepository: ExportsRepository, // for export preloading
		private _layoutRepository: LayoutRepository,
		private _filesRepository: FilesRepository
	) {
		super(_cdr, _layoutService, _activatedRoute);

		// get all mixes for top list
		this._mixesManagementService
			.getAll$()
			.pipe(
				untilDestroyed(this),
				tap((mixes) => {
					this.availableMixes = mixes;
					this._check();
				})
			)
			.subscribe();

		// subscribe to the selected mix
		this.mix$$$.$.pipe(
			untilDestroyed(this),
			tap(() => {
				this._check();
			})
		).subscribe();

		// Process mix.data2.virtualPlaylist to fill virtual player service and get virtual playlist state
		this.mix$$$.$.pipe(
			untilDestroyed(this),
			switchMap((mix) => {
				if (!mix) {
					return of(null);
				}

				this._virtualPlaylistIdentifier = virtualPlaylistIdPrefix + mix.id;
				this.connectDropTo = [this._virtualPlaylistIdentifier];

				// Handle old mix version
				const defaultMixData: MixData = []; // Same type as PlaylistItem[]
				const mixData: MixData = mix.data ? JSON.parse(mix.data) : defaultMixData;
				if (mixData.length > 0) {
					this.displayOldVersionMessage = true;
					this._notificationsService.warning(
						'This mix has been created with an older version of Rumble Studio. Please create a new mix to continue.',
						'Previous version detected',
						undefined,
						undefined,
						20000
					);
					return of(null);
				}
				const virtualPlaylist = this._getVirtualPlaylistFromMix(mix);

				if (virtualPlaylist) {
					// upsert existing virtual playlist to virtual player service
					console.log('upserting existing virtual playlist');
					return this._virtualPlayerService.upsertVirtualPlaylist$(virtualPlaylist, this._destroy$);
				}
				// create empty virtual playlist if it doesn't exist
				const newVirtualPlaylist: VirtualPlaylist = {
					id: virtualPlaylistIdPrefix + mix.id,
					virtualTracks: [],
				};
				console.log('creating new virtual playlist');
				return this._virtualPlayerService.upsertVirtualPlaylist$(newVirtualPlaylist, this._destroy$);
			}),
			tap((playlistState) => {
				this.playlistState = cloneDeep(playlistState);
				this._check();
			})
		).subscribe();

		// check if all fileSrc are matching fileRepo
		this.mix$$$.$.pipe(
			untilDestroyed(this),
			switchMap((mix) => {
				if (!mix) {
					return of(null);
				}

				const virtualPlaylist = this._getVirtualPlaylistFromMix(mix);
				if (!virtualPlaylist) return of(null);

				const virtualTracks: VirtualTrack[] = virtualPlaylist.virtualTracks;
				const filesForVirtualTrack: FileForVirtualTrack[] = flatten(virtualTracks.map((vt) => vt.files));

				return of(filesForVirtualTrack);
			}),
			switchMap((filesForVirtualTrack) => {
				if (!filesForVirtualTrack) return of([]);
				const filesWithSrcStatus = filesForVirtualTrack.map((fvt) =>
					this._filesRepository.get$(fvt.fileId).pipe(
						map((entityFile) => {
							return { fileId: fvt.fileId, fileSrcUpToDate: convertEntityFileToUrl(entityFile) == fvt.fileSrc };
						})
					)
				);
				return combineLatest(filesWithSrcStatus);
			}),
			tap((filesWithSrcStatus) => {
				if (!filesWithSrcStatus.every((fwss) => fwss.fileSrcUpToDate)) {
					const mix = this.mix$$$.value;
					if (mix) {
						this._refreshVirtualTrackUrls(mix);
					}
				}
			})
		).subscribe();

		// read mixId param from route to select a mix
		getRouteParam$(this._activatedRoute, 'mixId')
			.pipe(
				untilDestroyed(this),
				tap((mixId) => {
					this.mix$$$.id = mixId;
					this._check();
				})
			)
			.subscribe();

		// get drawer from url to re-open it on refresh
		getRouteQueryParam$(this._activatedRoute, 'drawer')
			.pipe(
				untilDestroyed(this),
				tap((drawer) => {
					this.menuToShow = (drawer as MenuToShow) ?? 'sources';
					this._check();
				})
			)
			.subscribe();

		// get drawer2 from url to re-open it on refresh
		getRouteQueryParam$(this._activatedRoute, 'drawer2')
			.pipe(
				untilDestroyed(this),
				tap((drawer) => {
					this.menu2ToShow = (drawer as MenuToShow2) ?? null;
					this._check();
				})
			)
			.subscribe();

		// get action from url to re-open it on refresh
		getRouteQueryParam$(this._activatedRoute, 'action')
			.pipe(
				untilDestroyed(this),
				tap((action) => {
					this.selectedAction = (action as PageAction) ?? 'mix';
					this._updateMenuDisplay(this.selectedAction);
					this._check();
				})
			)
			.subscribe();

		// we should open the export modal when click from notification or email link
		getRouteQueryParam$(this._activatedRoute, 'exportId')
			.pipe(
				untilDestroyed(this),
				tap((exportId) => {
					if (exportId) this.openExportModal(exportId ?? undefined);
				})
			)
			.subscribe();

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_ITEM,
		});
		this.mix$$$.$.pipe(
			untilDestroyed(this),
			tap((mix) => {
				if (mix) {
					this._layoutRepository.setLayoutProps({
						...LAYOUT_FOR_ITEM,
						pageSegments: [
							HOME_SEGMENT,
							{
								title: 'Mixes',
								link: '/mixes',
							},
							{
								title: '/<span class="material-icons-outlined"> arrow_drop_down </span>',
								eventName: 'display-other-mixes-menu',
							},
							{
								title: mix.name + ' ' + '<span class="material-icons-outlined"> edit </span>',
								eventName: 'open-mix-editor',
								tooltip: 'Edit mix properties',
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
					const mixId = this.mix$$$.id;
					if (event === 'open-mix-editor' && mixId) {
						this.openMixPropertiesPrompt(mixId);
					} else if (event === 'display-other-mixes-menu') {
						this.otherItemMenuTrigger?.openMenu();
					}
				})
			)
			.subscribe();
	}

	@HostListener('window:beforeunload', ['$event'])
	public preventWindowClosing(event: BeforeUnloadEvent) {
		if (this.mix$$$.value?.toSync !== false) event.returnValue = 'Your mix is not yet synced!';
	}

	public openMixPropertiesPrompt(mixId: string) {
		const mix = this._mixesManagementService.get(mixId);
		this._dialog.open(MixEditorPromptComponent, {
			height: '800px',
			maxHeight: '90%',
			minWidth: '300px',
			width: '800px',
			maxWidth: '90%',
			data: { mix },
		});
	}

	// DRAWER
	public closeDrawer() {
		this.close2ndDrawer();
		this.previousMenuToShow = this.menuToShow;
		this.menuToShow = null;
		this.saveMenuParams();
	}
	openDrawer(menu: MenuToShow) {
		if (this.menuToShow === menu) {
			this.closeDrawer();
			return;
		}
		this.menuToShow = menu;
		if (menu === 'sources') {
			this.open2ndDrawer(this.previousMenu2ToShow);
		} else {
			this.close2ndDrawer();
		}
		this.selectedAction = 'mix';
		this.saveMenuParams();
	}
	public close2ndDrawer() {
		this.previousMenu2ToShow = this.menu2ToShow;
		this.menu2ToShow = null;
		this.saveMenuParams();
	}
	open2ndDrawer(menu: MenuToShow2) {
		if (this.menu2ToShow === menu) {
			this.close2ndDrawer();
			return;
		}
		this.menu2ToShow = menu;
		this.selected2Action = 'mix';
		this.saveMenuParams();
	}
	saveMenuParams() {
		this.updateQueryParams({
			drawer: this.menuToShow,
			drawer2: this.menu2ToShow,
			action: this.selectedAction,
			action2: this.selected2Action,
		});
	}
	updateQueryParams(queryParams: Params) {
		const url = this._router
			.createUrlTree([], {
				// relativeTo: this.activatedRoute,
				queryParams,
				queryParamsHandling: 'merge',
			})
			.toString();
		this._location.go(url);
	}
	private _updateMenuDisplay(value: string) {
		if (value !== 'mix') {
			setTimeout(() => {
				this.menuToShow = null;
				this._check();
			}, 100);

			if (this.selectedAction === 'mix') {
				this.previousMenuToShow = this.menuToShow ?? 'sources';
			}
		}
		// if going back to create mode, restore the previous menu
		if (this.selectedAction !== 'mix' && value === 'mix') {
			this.menuToShow = this.previousMenuToShow ?? 'sources';
		}

		this._brokerService.broke(BROKE_OPTIONS.preloadSongs);
	}

	selectMix(mixId: string) {
		this._router.navigate(['/dashboard', 'mixes', mixId], {
			queryParams: {
				drawer: this.menuToShow,
				drawer2: this.menu2ToShow,
				action: this.selectedAction,
				action2: this.selected2Action,
			},
		});
	}

	openExportModal(exportId?: string) {
		// do not create zip but only file and send no mail
		// open prompt after doing a request listing the exports and their tasks status. we may need to change the task behaviour or create a variant of the existing one.
		const mixId = this.mix$$$.id;
		if (mixId)
			this._dialog.open<MixExportsPromptComponent, MixDetails>(MixExportsPromptComponent, {
				height: '800px',
				maxHeight: '90%',
				minWidth: '300px',
				width: '800px',
				maxWidth: '90%',
				data: { mixId, exportId },
			});
	}

	openRequestExportModal() {
		const mix = this.mix$$$.value;
		if (!mix) return;
		const mixVirtualPlaylist: VirtualPlaylist | undefined = this._getVirtualPlaylistFromMix(mix);
		const virtualTracks: VirtualTrack[] = mixVirtualPlaylist?.virtualTracks ?? [];
		if (!mixVirtualPlaylist || virtualTracks.length < 1) {
			this._notificationsService.info('There is nothing to export.');
			return;
		}

		const now = new Date();
		this._dialog
			.open<VirtualExportRequesterPromptComponent, VirtualExportRequestData, VirtualExportResult>(
				VirtualExportRequesterPromptComponent,
				{
					...DEFAULT_DIALOG_CONFIG,
					data: {
						virtualPlaylists: [mixVirtualPlaylist],
						exportName: mix.name + ' ' + now.toLocaleDateString(),
						exportSource: {
							id: mix.id,
							kind: 'mix',
							details: 'manual export from mix',
							displayNameAtExportTime: mix.name,
						},
						estimatedExportDuration: this.playlistState?.representativeState.duration,
					},
				}
			)
			.afterClosed()
			.pipe(
				tap((result) => {
					console.log('result virtual export prompt: ', result);
				})
			)
			.subscribe();
	}

	insertVirtualTracks(virtualTracks: VirtualTrack[]) {
		const mix = this.mix$$$.value;
		if (!mix || !this._virtualPlaylistIdentifier) return;
		let newVirtualTracks = cloneDeep(this._getVirtualPlaylistFromMix(mix)?.virtualTracks ?? []);
		newVirtualTracks.push(...virtualTracks);
		// update index to avoid same track id twice
		newVirtualTracks = newVirtualTracks.map((virtualTrack, virtualTrackIndex) => {
			const updatedVirtualTracks: VirtualTrack = {
				...virtualTrack,
				id: virtualTrackIndex.toString(),
			};
			return updatedVirtualTracks;
		});

		this._updateVirtualTracksOfMix(mix, newVirtualTracks);
	}

	processDropTackEvent(event: CdkDragDrop<VirtualTrack[], VirtualTrack[], VirtualTrack>) {
		const mix = this.mix$$$.value;
		if (!mix || !this._virtualPlaylistIdentifier) return;
		const virtualTracks = cloneDeep(this._getVirtualPlaylistFromMix(mix)?.virtualTracks ?? []);
		console.log('processDropTackEvent BEFORE', virtualTracks);
		console.log({ event });

		if (
			event.item.data &&
			Object.keys(event.item.data).includes('fileSize') &&
			Object.keys(event.item.data).includes('id')
		) {
			const entityFileDropped = event.item.data as unknown as EntityFile;
			const newTrack = this._filesRepository.convertFileIdToVirtualTrack(entityFileDropped.id);
			// const newTrack: VirtualTrack = {
			// 	id: uuidv4(),
			// 	active: true,
			// 	files: [
			// 		{
			// 			fileId: event.item.data.id,
			// 			fileSrc: convertEntityFileToUrl(entityFileDropped),
			// 		},
			// 	],
			// };

			if (newTrack) virtualTracks.splice(event.currentIndex, 0, newTrack);
			else {
				return;
			}
		} else if (event.previousContainer === event.container) {
			// can only happen if in the main virtual playlist of mix item page
			moveItemInArray(virtualTracks, event.previousIndex, event.currentIndex);
		} else {
			// it was drop in the virtual playlist of the mix item page from another virtual playlist
			const newTrack: VirtualTrack = { ...event.previousContainer.data[event.previousIndex], id: uuidv4() };

			virtualTracks.splice(event.currentIndex, 0, newTrack);
		}

		console.log('processDropTackEvent AFTER', virtualTracks);
		this._updateVirtualTracksOfMix(mix, virtualTracks);
		this._virtualPlayerService.seekTrackByIndex(this._virtualPlaylistIdentifier, event.currentIndex);
	}

	/**
	 * Parse `mix.data2` to get the stringified virtual playlist from the `mix`
	 * This function is used everywhere to get last version of the virtual playlist when
	 * doing some operations on tracks (like toggling track active state)
	 * @param mix
	 * @returns
	 */
	private _getVirtualPlaylistFromMix(mix: Mix) {
		console.log('_getVirtualPlaylistFromMix');

		const defaultMixdata2: NewMixData = { virtualPlaylist: { id: virtualPlaylistIdPrefix + mix.id, virtualTracks: [] } };
		const mixData2: NewMixData = mix.data2 ? JSON.parse(mix.data2) : defaultMixdata2;
		const virtualPlaylist: VirtualPlaylist | undefined = mixData2.virtualPlaylist;
		if (!virtualPlaylist) return undefined;
		virtualPlaylist.details = {
			...virtualPlaylist.details,
			title: mix.name,
			description: mix.description,
		};
		return virtualPlaylist;
	}

	private _updateVirtualTracksOfMix(mix: Mix, virtualTracks: VirtualTrack[]) {
		console.log('_updateVirtualTracksOfMix');

		const data2AsStr = mix.data2;
		const data2: NewMixData = data2AsStr ? JSON.parse(data2AsStr) : {};
		data2.virtualPlaylist = {
			id: virtualPlaylistIdPrefix + mix.id,
			virtualTracks,
		};
		this._mixesManagementService.update(mix.id, {
			data2: JSON.stringify(data2),
		});
	}

	/**
	 *
	 * @param mix
	 * @param virtualTracks
	 */
	private _refreshVirtualTrackUrls(mix: Mix, virtualTracks?: VirtualTrack[]) {
		console.log('_REFRESHING URLS');

		const defaultNewMixData: NewMixData = { virtualPlaylist: undefined };
		const data2: NewMixData = mix.data2 ? JSON.parse(mix.data2) : defaultNewMixData;
		const virtualTracksToUse: VirtualTrack[] = virtualTracks ?? data2.virtualPlaylist?.virtualTracks ?? [];
		data2.virtualPlaylist = {
			id: virtualPlaylistIdPrefix + mix.id,
			virtualTracks: virtualTracksToUse?.map((virtualTrack) => ({
				...virtualTrack,
				files: virtualTrack.files.map((FileForVirtualTrack) => ({
					...FileForVirtualTrack,
					fileSrc: convertEntityFileToUrl(this._filesRepository.get(FileForVirtualTrack.fileId)),
				})),
			})),
		};
		this._mixesManagementService.update(mix.id, {
			data2: JSON.stringify(data2),
		});
	}

	public processToggleActiveTrackEvent(virtualTrack: VirtualTrack) {
		const mix = this.mix$$$.value;
		if (!mix) return;
		const virtualTracks = cloneDeep(this._getVirtualPlaylistFromMix(mix)?.virtualTracks ?? []);
		const trackIndex = virtualTracks.findIndex((t) => t.id === virtualTrack.id);
		if (trackIndex === -1) return;
		virtualTracks[trackIndex].active = !virtualTracks[trackIndex].active;
		this._updateVirtualTracksOfMix(mix, virtualTracks);
	}

	public processDeleteTrackEvent(virtualTrack: VirtualTrack) {
		const mix = this.mix$$$.value;
		if (!mix) return;
		const virtualTracks = cloneDeep(this._getVirtualPlaylistFromMix(mix)?.virtualTracks ?? []);
		const trackIndex = virtualTracks.findIndex((t) => t.id === virtualTrack.id);
		if (trackIndex === -1) return;
		virtualTracks.splice(trackIndex, 1);
		this._updateVirtualTracksOfMix(mix, virtualTracks);
	}

	ngOnDestroy() {
		this._layoutRepository.centralTemplate = undefined;
		this._destroy$.next();
		this._destroy$.complete();
		if (this._virtualPlaylistIdentifier) this._virtualPlayerService.clearVirtualPlaylist(this._virtualPlaylistIdentifier);
	}
}
