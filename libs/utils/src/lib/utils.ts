/* eslint-disable @typescript-eslint/no-explicit-any */
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';
import { isEqual, merge } from 'lodash';
import { asyncScheduler, BehaviorSubject, defer, iif, Observable, of, SchedulerLike, throwError, timer } from 'rxjs';
import { concatMap, expand, filter, map, mapTo, retryWhen, shareReplay, switchMap, tap } from 'rxjs/operators';

export type AttrElement = string[] | string | number | boolean | undefined | null;

export type Attr = {
	[key: string]: AttrElement;
};

export function sleepFor(sleepDuration: number) {
	// this function is CPU busy: not to be used in production
	const now = new Date().getTime();
	while (new Date().getTime() < now + sleepDuration) {
		/* Do nothing */
	}
}

export function getRouteParam$(activatedRoute: ActivatedRoute, key: string): Observable<string | undefined> {
	return activatedRoute.params.pipe(
		map((params) => {
			if (params[key] && params[key].length) {
				return params[key] as string;
			} else {
				return undefined;
			}
		}),
		shareReplay()
		// tap((value) => {
		//   console.log(`[param$](${key})`, value);
		// })
	);
}

export function getRouteQueryParam$(activatedRoute: ActivatedRoute, key: string): Observable<string | null> {
	return activatedRoute.queryParamMap.pipe(
		map((paramMap) => paramMap.get(key)),
		shareReplay()
		// tap((value) => {
		//   console.log(`[QueryParamMap](${key})`, value);
		// })
	);
}

/**
 * Return all query parameters matching the same key (`https://path/?key=value1&key=value2` will give` [value1,value2]`)
 * @param activatedRoute
 * @param key
 * @returns
 */
export function getRouteQueryParamAll$(activatedRoute: ActivatedRoute, key: string): Observable<string[]> {
	return activatedRoute.queryParamMap.pipe(
		map((paramMap) => paramMap.getAll(key)),
		shareReplay({ refCount: true }),
		tap((values) => {
			console.log(`[paramMap All$](${key})`, values);
		})
	);
}

/**
 * Creates an almost-like-observable object with 3 properties: `id`,`value`,`$`.
 *
 * @param `getById$` should be a method mapping `id` to an observable of `T`.
 * @param `that` {optional} if `this` is used in `getById$`, it will be bind to it.
 * @param `title` {optional} allow to log the data.
 * @method`id` identifies the item (can be undefined). Can be directly set with `obj.id = '<my-id>'`.
 * @method `$` is an observable that emits the item and share replays
 * @method`value` allows direct access to the data (undefined or `T`)
 */
export class DataObsViaId<T> {
	public id$$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);
	public id$ = this.id$$.asObservable();

	public set id(newId: string | undefined) {
		if (this.id$$.value === newId) return;
		this.id$$.next(newId);
	}
	public get id(): string | undefined {
		return this.id$$.value;
	}

	$: Observable<T | undefined>;
	value: T | undefined;

	constructor(getById$: (id: string) => Observable<T | undefined>, that?: any, title?: string) {
		this.$ = this.id$$.pipe(
			switchMap((id) => {
				if (id) {
					return getById$.bind(that ?? this)(id);
				} else {
					return of(undefined);
				}
			}),
			filter((newValue) => !isEqual(this.value, newValue)),
			tap((value) => {
				if (title) console.log('[DataObsViaId]', '(' + title + ')', value);
				this.value = value;
			}),
			shareReplay()
		);
	}
}

export class DataObs<T> extends DataObsViaId<T> {
	constructor(id: string, getById$: (id: string) => Observable<T | undefined>, that?: any, title?: string) {
		super(getById$, that, title);
		this.id = id;
	}
}

export class Bs$$<T> {
	public $$: BehaviorSubject<T | null> = new BehaviorSubject<T | null>(null);
	public $ = this.$$.asObservable().pipe(shareReplay());

	public set value(newValue) {
		if (this.$$.value === newValue) return;
		this.$$.next(newValue);
	}
	public get value() {
		return this.$$.value;
	}
}

export function useObsUntilDestroyed<
	T,
	U extends {
		_check(): void;
	}
>(sourceObservable$: Observable<T | null>, cb: (arg: T | null) => void, ref: U) {
	sourceObservable$
		.pipe(
			untilDestroyed(ref),
			tap((newValue) => {
				cb(newValue);
			})
			// finalize(() => {
			// 	console.log('%cFinalized', 'color:pink');
			// })
		)
		.subscribe();
}

/**
 * Reacts almost like a behavior subject
 * Same as Bs$$ but with can't be null
 * @param initialValue
 * To update value:
 * - set value with `Bss$$.value = newValue`
 * - get value with `Bss$$.value`
 * - subscribe to `Bss$$.$` to get the new value
 * - subscribe to `Bss$$.$$` to get the BehaviorSubject
 */
export class Bss$$<T> {
	public $$: BehaviorSubject<T>;
	public $: Observable<T>;

	constructor(initialValue: T) {
		this.$$ = new BehaviorSubject(initialValue);
		this.$ = this.$$.asObservable();
	}

	public set value(newValue) {
		if (this.$$.value === newValue) return;
		this.$$.next(newValue);
	}
	public get value() {
		return this.$$.value;
	}
}

export class StuffList<T extends { id: string }> {
	private _keysToIgnore: string[];
	private _title?: string;

	public stuffs$$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
	public stuffs$ = this.stuffs$$.asObservable();

	private _stuffs: T[] = [];
	public set stuffs(newStuffs: T[]) {
		updateInPlace(this._stuffs, newStuffs, this._keysToIgnore, this._title);
		this.stuffs$$.next(this._stuffs);
	}
	public get stuffs(): T[] {
		return this._stuffs;
	}

	constructor(keysToIgnore: string[] = [], title?: string) {
		this._keysToIgnore = keysToIgnore;
		this._title = title;
	}
}

export function getObjectDiff(obj1: any, obj2: any) {
	const diff = Object.keys(obj1).reduce((result, key) => {
		if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
			result.push(key);
		} else if (isEqual(obj1[key], obj2[key])) {
			const resultKeyIndex = result.indexOf(key);
			result.splice(resultKeyIndex, 1);
		}
		return result;
	}, Object.keys(obj2));

	return diff;
}

export function deepEqual(object1: any, object2: any, keysToIgnore: string[] = [], label: string = ''): boolean {
	if (!(object1 && object2)) {
		if (label)
			console.log('%c(deepEqual-' + label + ') undefined object', 'color:grey', {
				object1,
				object2,
			});
		return false;
	}
	const keys1 = Object.keys(object1)
		.filter((key) => keysToIgnore.indexOf(key) == -1)
		.sort();
	const keys2 = Object.keys(object2)
		.filter((key) => keysToIgnore.indexOf(key) == -1)
		.sort();

	if (keys1.length !== keys2.length) {
		if (label)
			console.log('%c(deepEqual-' + label + ') Not same number of key', 'color:grey', getObjectDiff(object1, object2), {
				keys1,
				keys2,
				object1,
				object2,
			});
		return false;
	}

	for (const key of keys1) {
		if (keysToIgnore.includes(key)) {
			continue;
		}
		const val1 = object1[key];
		const val2 = object2[key];
		const areObjects = isObject(val1) && isObject(val2);
		if ((areObjects && !deepEqual(val1, val2, keysToIgnore, label)) || (!areObjects && val1 !== val2)) {
			if (label)
				console.log(
					'%c(deepEqual-' + label + ') Not same property (' + key + '):',
					'color:grey',
					getObjectDiff(object1, object2),
					{ val1, val2 },
					object1[key],
					object2[key]
				);
			return false;
		}
	}

	return true;
}

function isObject(object: unknown) {
	return object != null && typeof object === 'object';
}

function customizer(value: any, srcValue: any, key: string, object: any, source: any) {
	if (srcValue === value) {
		return value;
	}
	if (key === 'operation') {
		// console.log({ key, value, srcValue, object, source });
		return value;
	} else if (key === 'timeUpdate') {
		// console.log({ key, value, srcValue, object, source });
		return srcValue * 1;
	} else if (key === 'data') {
		// console.log({ key, value, srcValue, object, source });
		return srcValue;
		// return value;
	}
}

export function updateInPlace(
	formerArray: (unknown & { id: string })[],
	newArray: (unknown & { id: string })[],
	keysToIgnore: string[] = [],
	title: string = ''
): boolean {
	const formerIds: string[] = formerArray.map((m) => m.id);
	const newdIds: string[] = newArray.map((m) => m.id);
	const idsToRemove: string[] = formerIds.filter((id: string) => !(newdIds.indexOf(id) >= 0));
	const idsToKeep: string[] = formerIds.filter((id: string) => newdIds.indexOf(id) >= 0);
	const idsToAdd: string[] = newdIds.filter((id: string) => !(formerIds.indexOf(id) >= 0));
	const idsToUpdate: string[] = idsToKeep.filter(
		(id: string) => !deepEqual(formerArray[formerIds.indexOf(id)], newArray[newdIds.indexOf(id)], keysToIgnore, title)
	);

	// 1/ remove
	const indexesToRemove = idsToRemove
		.map((id: string) => formerIds.indexOf(id))
		.sort(function (a, b) {
			return b - a;
		});
	indexesToRemove.forEach((indexToRemove: number) => {
		if (title)
			console.log(
				'%c ' + (title ? '[' + title + ']' : '') + ' Removing',
				'color:blue',
				indexToRemove,
				'(' + formerArray[indexToRemove].id.substring(0, 6) + ')'
			);
		formerArray.splice(indexToRemove, 1);
	});

	// 2/ add new
	idsToAdd.forEach((id: string) => {
		const indexToCopy = newdIds.indexOf(id);
		if (title)
			console.log('%c ' + (title ? '[' + title + ']' : '') + ' Adding', 'color:blue', '(' + id.substring(0, 6) + ')');
		formerArray.push(newArray[indexToCopy]);
	});

	// 3/ update previous
	idsToUpdate.forEach((id: string) => {
		const indexToUpdate = formerIds.indexOf(id);
		const indexToCopy = newdIds.indexOf(id);
		if (title)
			console.log('%c ' + (title ? '[' + title + ']' : '') + ' Updating', 'color:blue', '(' + id.substring(0, 6) + ')');
		try {
			// mergeWith(formerArray[indexToUpdate], newArray[indexToCopy], customizer);
			merge(formerArray[indexToUpdate], newArray[indexToCopy]);
		} catch (e) {
			// console.warn(
			//   "Can't mergeWith",
			//   newArray[indexToCopy],
			//   'into',
			//   formerArray[indexToUpdate],
			//   e
			// );
			formerArray[indexToUpdate] = newArray[indexToCopy];
		}
	});

	// 4/ reorder in case previous where not with same order
	let wasReordered = false;
	for (const [newElementIndex, newElement] of newArray.entries()) {
		const updatedFormerIds: string[] = formerArray.map((m) => m.id);
		const formerElementIndex = updatedFormerIds.indexOf(newElement.id);
		if (formerElementIndex != newElementIndex) {
			wasReordered = true;
			if (title)
				console.log(
					'%c' + (title ? '[' + title + ']' : '') + ' Reorder',
					'color:blue',
					formerElementIndex,
					'->',
					newElementIndex,
					'(' + newElement.id.substring(0, 6) + ')'
				);
			moveItemInArray(formerArray, formerElementIndex, newElementIndex);
		}
	}
	// if (title) {
	//   console.log(
	//     '%c' + (title ? '[' + title + ']' : '') + ' Result:',
	//     'color:blue',
	//     formerArray
	//   );
	// }

	return wasReordered || idsToUpdate.length + idsToAdd.length + idsToRemove.length > 0;
}

export function inIframe() {
	try {
		return window.self !== window.top;
	} catch (e) {
		return true;
	}
}

export function cumSum(a: number[]) {
	const result = [a[0]];

	for (let i = 1; i < a.length; i++) {
		result[i] = result[i - 1] + a[i];
	}

	return result;
}

export type NestedPartial<T> = {
	[P in keyof T]?: NestedPartial<T[P]>;
};
export type PartialExcept<T, K extends keyof T> = NestedPartial<T> & Pick<T, K>;

export function checkEmail(email: string) {
	const regex =
		"^((([!#$%&'*+\\-/=?^_`{|}~\\w])|([!#$%&'*+\\-/=?^_`{|}~\\w][!#$%&'*+\\-/=?^_`{|}~\\.\\w]{0,}[!#$%&'*+\\-/=?^_`{|}~\\w]))[@](www.|[a-zA-Z0-9].)[a-zA-Z0-9\\-\\.]+\\.[a-zA-Z]{2,6}(\\:[0-9]{1,5})*(/($|[a-zA-Z0-9\\.\\,\\;\\?'\\\\+&amp;%\\$#\\=~_\\-]+))*$)$";
	return new RegExp(regex).test(email);
}

/** Calculates the actual delay which can be limited by maxInterval */
export function getDelay(backoffDelay: number, maxInterval: number) {
	return Math.min(backoffDelay, maxInterval);
}

/** Exponential backoff delay */
export function exponentialBackoffDelay(iteration: number, initialInterval: number) {
	return Math.pow(2, iteration) * initialInterval;
}

export interface RetryBackoffConfig {
	// Initial interval. It will eventually go as high as maxInterval.
	initialInterval: number;
	// Maximum number of retry attempts.
	maxRetries?: number;
	// Maximum delay between retries.
	maxInterval?: number;
	// When set to `true` every successful emission will reset the delay and the
	// error count.
	resetOnSuccess?: boolean;
	// Conditional retry.
	shouldRetry?: (error: any) => boolean;
	backoffDelay?: (iteration: number, initialInterval: number) => number;
}

/**
 * Returns an Observable that mirrors the source Observable except with an error.
 * If the source Observable calls error, rather than propagating
 * the error call this method will resubscribe to the source Observable with
 * exponentially increasing interval and up to a maximum of count
 * re-subscriptions (if provided). Retrying can be cancelled at any point if
 * shouldRetry returns false.
 */
export function retryBackoff(config: number | RetryBackoffConfig): <T>(source: Observable<T>) => Observable<T> {
	const {
		initialInterval,
		maxRetries = Infinity,
		maxInterval = Infinity,
		shouldRetry = () => true,
		resetOnSuccess = false,
		backoffDelay = exponentialBackoffDelay,
	} = typeof config === 'number' ? { initialInterval: config } : config;
	return <T>(source: Observable<T>) =>
		defer(() => {
			let index = 0;
			return source.pipe(
				retryWhen<T>((errors) =>
					errors.pipe(
						concatMap((error) => {
							const attempt = index++;
							return iif(
								() => attempt < maxRetries && shouldRetry(error),
								timer(getDelay(backoffDelay(attempt, initialInterval), maxInterval)),
								throwError(error)
							);
						})
					)
				),
				tap(() => {
					if (resetOnSuccess) {
						index = 0;
					}
				})
			);
		});
}

export interface IntervalBackoffConfig {
	initialInterval: number;
	maxInterval?: number;
	backoffDelay?: (iteration: number, initialInterval: number) => number;
}
/**
 * Creates an Observable that emits sequential numbers with by default
 * exponentially increasing interval of time.
 */
export function intervalBackoff(
	config: number | IntervalBackoffConfig,
	scheduler: SchedulerLike = asyncScheduler
): Observable<number> {
	let initialInterval = Infinity;
	let maxInterval = Infinity;
	let backoffDelay = exponentialBackoffDelay;
	// typeof config === 'number' ? { initialInterval: config } : config;
	if (typeof config === 'number') {
		initialInterval = config;
	} else {
		initialInterval = config.initialInterval;
		maxInterval = config.maxInterval ?? maxInterval;
		backoffDelay = config.backoffDelay ?? backoffDelay;
	}
	initialInterval = initialInterval < 0 ? 0 : initialInterval;
	return of(0, scheduler).pipe(
		// Expend starts with number 1 and then recursively
		// projects each value to new Observable and puts it back in.
		expand((iteration: number) =>
			timer(getDelay(backoffDelay(iteration, initialInterval), maxInterval))
				// Once timer is complete, iteration is increased
				.pipe(mapTo(iteration + 1))
		)
	);
}

/**
 * Test if in webview and for browser.
 */
const rules = [
	// if it says it's a webview, let's go with that
	'WebView',
	// iOS webview will be the same as safari but missing "Safari"
	'(iPhone|iPod|iPad)(?!.*Safari)',
	// Android Lollipop and Above: webview will be the same as native but it will contain "wv"
	// Android KitKat to lollipop webview will put {version}.0.0.0
	'Android.*(wv|.0.0.0)',
	// old chrome android webview agent
	'Linux; U; Android',
];
const webviewRegExp = new RegExp('(' + rules.join('|') + ')', 'ig');
export function isWebview(ua: string) {
	return !!ua.match(webviewRegExp);
}

export function slugify(string: string) {
	const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıİłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
	const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
	const p = new RegExp(a.split('').join('|'), 'g');

	return string
		.toString()
		.toLowerCase()
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
		.replace(/&/g, '-and-') // Replace & with 'and'
		.replace(/[^\w-]+/g, '') // Remove all non-word characters
		.replace(/--+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, ''); // Trim - from start of text
	// .replace(/-+$/, ''); // Trim - from end of text
}

export function slugifyKeepStar(string: string) {
	const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıİłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
	const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
	const p = new RegExp(a.split('').join('|'), 'g');

	return string
		.toString()
		.toLowerCase()
		.replace(/\*/g, 'A') // Replace * with 'A'
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
		.replace(/&/g, '-and-') // Replace & with 'and'
		.replace(/[^\w-]+/g, '') // Remove all non-word characters
		.replace(/--+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/A/g, '*'); // Replace back 'A' with '*'

	// .replace(/-+$/, ''); // Trim - from end of text
}
