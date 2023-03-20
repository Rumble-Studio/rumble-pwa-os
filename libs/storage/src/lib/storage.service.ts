import { Injectable } from '@angular/core';
import localforage from 'localforage';
import { from, Observable } from 'rxjs';
// import sessionStorageWrapper from './sessionStorageWrapper';

@Injectable({ providedIn: 'root' })
export class LocalforageStorageService implements StorageService {
	// small map to keep few objects in memory
	public cache: { [key: string]: any } = {};

	// db: any;
	private db = localforage.createInstance({
		name: 'RumbleStudio',
		version: 1.0,
		storeName: 'defaultStorage',
		// driver: localforage.INDEXEDDB,
		// driver: localforage.WEBSQL,
		// driver: [localforage.INDEXEDDB, localforage.WEBSQL, sessionStorageWrapper, localforage.LOCALSTORAGE],
	});

	constructor() {
		// console.log('%c[LocalforageStorageService](constructor)', 'color:green');
		// this.db
		//   .keys()
		//   .then(function (keys) {
		//     // An array of all the key names.
		//     console.log(keys);
		//   })
		//   .catch(function (err) {
		//     // This code runs if there were any errors
		//     console.log(err);
		//   });
		// localforage.defineDriver(sessionStorageWrapper)
		//   return localforage.setDriver(sessionStorageWrapper._driver);
		// this.db.setDriver([localforage.INDEXEDDB, localforage.WEBSQL, sessionStorageWrapper._driver, localforage.LOCALSTORAGE]);
		this.db
			.ready()
			.then(function () {
				// This code runs once localforage
				// has fully initialized the selected driver.
				// console.log('%c[LocalforageStorageService](constructor.db)', 'color:green', 'ready', localforage.driver());
				// console.log(localforage.driver()); // LocalStorage
			})
			.catch(function (e) {
				console.error(e); // `No available storage method found.`
				// One of the cases that `ready()` rejects,
				// is when no usable storage driver is found
			});
	}

	async getItem<T>(key: string): Promise<T | null> {
		// console.log('[LocalforageStorageService](getItem)', key);
		return this.db.getItem(key);
	}

	getItem$<T>(key: string) {
		return from(this.getItem<T>(key));
	}

	async setItem<T>(key: string, value: T): Promise<T> {
		// throw new Error('Fake error setItem.');
		// console.log('[LocalforageStorageService](setItem)', { key, value });
		return this.db.setItem<T>(key, value);
	}

	async removeItem(key: string): Promise<void> {
		return this.db.removeItem(key);
	}

	async clear() {
		try {
			// different way of cleaning to handle safari firefox and chrome
			await this.db.clear();
			await localforage.clear();
			await this.db
				.removeItem('rs-akita')
				.then(function () {
					// Run this code once the key has been removed.
					// console.log('%cDatabase is now empty.', 'color:pink');
				})
				.catch(function (err) {
					// This code runs if there were any errors
					console.log(err);
				});

			// this.persistStorage.clearStore();
		} catch (error) {
			console.error(error);
		}
	}
}

@Injectable({ providedIn: 'root', useClass: LocalforageStorageService })
export abstract class StorageService {
	public cache: { [key: string]: any } = {};

	constructor() {
		console.log('%c[StorageService](constructor)', 'color:lightgreen');
	}
	abstract getItem<T>(key: string): Promise<T | null>;
	abstract getItem$<T>(key: string): Observable<T | null>;
	abstract setItem<T>(key: string, value: T): Promise<T>;
	abstract clear(): void;
	abstract removeItem(key: string): Promise<void>;
}
