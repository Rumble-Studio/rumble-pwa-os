import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { filter, startWith, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsService } from '@rumble-pwa/client-notifications';

const TAB_MANAGER_STORAGE_KEY = '__rs_tab';
const debug = false;

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class TabManagerService {
	tabs$$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
	activeTab$$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);

	tabId: string;

	constructor(private notificationsService: NotificationsService) {
		this.tabId = uuidv4();
		if (debug)
			console.log('%c[TabManager](constructor)', 'color:green', {
				tabId: this.tabId,
			});
		fromEvent<StorageEvent>(window, 'storage')
			.pipe(
				untilDestroyed(this),
				startWith({
					key: TAB_MANAGER_STORAGE_KEY,
					oldValue: null,
					newValue: '[]',
				}),
				filter((evt) => evt.key === TAB_MANAGER_STORAGE_KEY),
				tap((evt) => {
					if (evt.newValue) {
						const actions = JSON.parse(evt.newValue);

						if (actions.length > 0) {
							if (actions[0].lastActiveTab === this.tabId) {
								if (debug) console.log('This tab is the main tab.');
								this.updateMainTab(this.tabId);
							} else {
								if (debug) console.log('This tab is not the main tab.');
								this.updateMainTab(actions[0].lastActiveTab);
							}
						}
					}
				})
			)
			.subscribe();

		this.setAsMaintab();
	}

	updateTabs(tabs: string[]) {
		this.tabs$$.next(tabs);
	}

	updateMainTab(tab: string) {
		this.activeTab$$.next(tab);
	}

	setAsMaintab() {
		if (!document.hidden) {
			if (debug)
				console.log('%c[TabManager](setAsMainTab)', 'color:green', {
					tabId: this.tabId,
				});
			// get the current actions from local storage
			const storedActions = window.localStorage.getItem(TAB_MANAGER_STORAGE_KEY);
			// parse the actions as an array
			const actions = storedActions ? JSON.parse(storedActions) : [];
			// add the new action as first item to the actions array
			const newActions = [{ lastActiveTab: this.tabId }, ...actions.slice(0, 4)];
			// serialize the new array and update local storage
			window.localStorage.setItem(TAB_MANAGER_STORAGE_KEY, JSON.stringify(newActions));
			this.updateMainTab(this.tabId);
		}
	}
}
