import { Injectable } from '@angular/core';
import { createStore, propsFactory } from '@ngneat/elf';

import {
	addEntities,
	getAllEntities,
	getEntity,
	selectActiveEntities,
	selectActiveEntity,
	selectAllEntities,
	selectAllEntitiesApply,
	selectEntity,
	setActiveId,
	setEntities,
	toggleActiveIds,
	UIEntitiesRef,
	updateEntities,
	upsertEntities,
	withActiveId,
	withActiveIds,
	withEntities,
	withUIEntities,
} from '@ngneat/elf-entities';
import { localStorageStrategy, persistState } from '@ngneat/elf-persist-state';
import { Subscription } from '@rumble-pwa/mega-store';
import { ObjectPromptService } from '@rumble-pwa/objects/prompt';
import { RestService } from '@rumble-pwa/requests';
import { SubscriptionsManagementService } from '@rumble-pwa/subscriptions-system';
import { UsersRepository } from '@rumble-pwa/users/state';
import { ElfSyncable, prepEntityForCreation, prepEntityForRefresh, prepEntityForUpdate } from '@rumble-pwa/utils';
import { Observable } from 'rxjs';
import { debounceTime, map, shareReplay, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const storeName = 'domains';
const storePropsName = 'domainProps';

export interface Domain extends ElfSyncable {
	name?: string;
	description?: string;
	url: string;
	hostname?: string;
	data?: string;
	txtRecordValue?: string;
	txtRecordName?: string;
	subscriptionId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DomainData {}

export interface DomainUI {
	id: Domain['id'];
}
export interface DomainProps {
	something?: string;
}

export const DEFAULT_FORM_PROPS: DomainProps = {
	something: '',
};

export const DOMAIN_PROPS_PIPES = propsFactory(storePropsName, { initialValue: DEFAULT_FORM_PROPS });

// CUSTOM INTERFACES

const DOMAINS_TO_IGNORE: (string | undefined)[] = [
	'gmail.com',
	'yahoo.com',
	'hotmail.com',
	'yopmail.com',
	'yahoo.fr',
	'msn.com',
	'email.com',
];

@Injectable({ providedIn: 'root' })
export class DomainsRepository {
	// ---------------------------------------------------//
	//                                                    //
	//                   STORE PROPERTIES                 //
	//                                                    //
	// ---------------------------------------------------//
	public domains$: Observable<Domain[]>;
	private _domainsToSync$: Observable<Domain[]>;
	public domainUIs$: Observable<DomainUI[]>;
	public activeDomains$: Observable<Domain[]>;
	public activeDomain$: Observable<Domain | undefined>;
	public domainProps$: Observable<DomainProps>;
	private _persist;
	private _store$$;

	// ---------------------------------------------------//
	//                                                    //
	//                   CUSTOM PROPERTIES                //
	//                                                    //
	// ---------------------------------------------------//

	/** Subscriptions are used for prompt opening */
	subscriptions: Subscription[] = [];

	constructor(
		//
		private _restService: RestService,
		private _objectPromptService: ObjectPromptService,
		private _subscriptionsManagementService: SubscriptionsManagementService, // to get subs,
		private _usersRepository: UsersRepository // to auto fill domain in prompt
	) {
		// -------------------//
		//      ELF LOGIC     //
		// -------------------//

		this._store$$ = this._createStore();
		this._persist = persistState(this._store$$, {
			key: storeName,
			storage: localStorageStrategy,
		});
		this.domains$ = this._store$$.pipe(selectAllEntities(), shareReplay({ refCount: true }));
		this._domainsToSync$ = this._store$$.pipe(
			selectAllEntitiesApply({
				filterEntity: (e) => e.toSync === true,
			})
		);
		this.domainUIs$ = this._store$$.pipe(selectAllEntities({ ref: UIEntitiesRef }), shareReplay({ refCount: true }));
		this.activeDomain$ = this._store$$.pipe(selectActiveEntity(), shareReplay({ refCount: true }));
		this.activeDomains$ = this._store$$.pipe(selectActiveEntities(), shareReplay({ refCount: true }));
		this.domainProps$ = this._store$$.pipe(DOMAIN_PROPS_PIPES.selectDomainProps());

		// -------------------//
		//    SERVER LOGIC    //
		// -------------------//

		// fetch data each time logged in status change
		this._usersRepository.isConnected$$.subscribe((isLoggedIn) => {
			if (isLoggedIn) {
				this.fetchFromServer(true);
			} else {
				this._store$$.reset();
			}
		});

		// build object to sync $
		this._domainsToSync$.pipe(debounceTime(500)).subscribe((domainsToSync) => {
			domainsToSync.forEach((domain) => {
				if (domain?.operation === 'creation') {
					this._postToServer(domain);
				} else if (domain?.operation === 'update') this._putToServer(domain);
			});
		});

		// -------------------//
		//    CUSTOM LOGIC    //
		// -------------------//

		// get all subscriptions
		this._subscriptionsManagementService
			.getAll$()
			.pipe(
				tap((subscriptions) => {
					this.subscriptions = [...subscriptions];
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                SERVER SYNC METHODS                 //
	//                                                    //
	// ---------------------------------------------------//

	private _postToServer(domain: Domain) {
		return this._restService
			.post<Domain>('/domains', domain)
			.pipe(
				tap((r) => {
					this._refreshDomain(r);
				})
			)
			.subscribe();
	}

	private _putToServer(domain: Domain) {
		return this._restService
			.put<Domain>(`/domains/${domain.id}`, domain)
			.pipe(
				tap((r) => {
					this._refreshDomain(r);
				})
			)
			.subscribe();
	}

	public fetchFromServer(replace = false) {
		this._restService
			.get<Domain[]>('/domains')
			.pipe(
				tap((domains) => {
					if (replace) {
						this._store$$.update(upsertEntities(domains));
					} else {
						domains.forEach((domain) => {
							this._refreshDomain(domain);
						});
					}
				})
			)
			.subscribe();
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   ENTITY METHODS                   //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Replace current collection with the provided collection
	 * @param domains
	 */
	public setDomains(domains: Domain[]) {
		this._store$$.update(setEntities(domains));
	}

	/**
	 * Add a new domain to the collection
	 * @param domain
	 */
	public addDomain(domain: Domain) {
		const syncableDomain = prepEntityForCreation<Domain>(domain);
		this._store$$.update(addEntities(syncableDomain));
	}

	/**
	 * Update an existing domain in the collection
	 * @param id
	 * @param domainUpdate (partial)
	 */
	public updateDomain(id: Domain['id'] | undefined, domainUpdate: Partial<Domain>) {
		const idToUse = id ?? domainUpdate.id;
		if (!idToUse) {
			throw new Error('Cannot update domain without an id');
		}

		const previousDomain = this._store$$.query(getEntity(idToUse));
		if (!previousDomain) {
			throw new Error(`Domain with id ${idToUse} not found`);
		}
		const updatedDomain: Domain = {
			...previousDomain,
			...domainUpdate,
		};
		const syncableDomain = prepEntityForUpdate<Domain>(updatedDomain, previousDomain);
		this._store$$.update(updateEntities(idToUse, syncableDomain));
	}

	private _refreshDomain(domain: Domain) {
		const previousDomain = this._store$$.query(getEntity(domain.id));
		const syncableDomain = prepEntityForRefresh<Domain>(domain, previousDomain);
		this._store$$.update(upsertEntities([syncableDomain]));
	}

	// public deleteDomain(id: Domain['id']) {
	// 	this._store.update(deleteEntities(id));
	// }

	/**
	 * Subscribe to a domain
	 * @param id
	 * @returns
	 */
	public get$(id: string): Observable<Domain | undefined> {
		return this._store$$.pipe(selectEntity(id));
	}

	public get(id: string): Domain | undefined {
		return this._store$$.query(getEntity(id));
	}

	public getAll(): Domain[] {
		return this._store$$.query(getAllEntities());
	}

	// ---------------------------------------------------//
	//                                                    //
	//                     UI METHODS                     //
	//                                                    //
	// ---------------------------------------------------//

	public setActiveId(id: Domain['id']) {
		this._store$$.update(setActiveId(id));
	}

	public toggleActiveIds(ids: Array<Domain['id']>) {
		this._store$$.update(toggleActiveIds(ids));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   PROPS METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	public setDomainProps(domainProps: Partial<DomainProps>) {
		this._store$$.update(DOMAIN_PROPS_PIPES.updateDomainProps(domainProps));
	}

	// ---------------------------------------------------//
	//                                                    //
	//                   STORE METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	private _createStore(): typeof store {
		const store = createStore(
			{ name: storeName },
			withEntities<Domain>(),
			withUIEntities<DomainUI>(),
			DOMAIN_PROPS_PIPES.withDomainProps(),
			withActiveId(),
			withActiveIds()
		);

		return store;
	}

	// ---------------------------------------------------//
	//                                                    //
	//                  CUSTOM METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	// ---------------------------------------------------//
	//                                                    //
	//                  CUSTOM METHODS                    //
	//                                                    //
	// ---------------------------------------------------//

	/**
	 * Open the object prompt to create/edit the domain
	 */
	public openObjectPrompt(options?: { domainId?: string; domain?: Domain; modalTitle?: string; modalSubmitText?: string }) {
		type ExtendedDomain = Partial<Domain> & {
			groups?: string[];
		};

		const emptyDomainData: DomainData = {};
		const domainData: DomainData = options?.domain?.data ? JSON.parse(options.domain.data) : emptyDomainData;

		let defaultDomain = this._usersRepository.connectedUser$$.value?.email.split('@')[1];

		if (DOMAINS_TO_IGNORE.includes(defaultDomain)) defaultDomain = undefined;
		defaultDomain = defaultDomain ? 'https://participate.' + defaultDomain : 'https://';

		return this._objectPromptService
			.openObjectPromptModal$<ExtendedDomain>(
				//
				{
					modalTitle: options?.modalTitle ?? 'Edit your domain',
					modalDescription:
						'📙 Find the related help article here: <a href="https://help.rumble.studio/hc/how-to-use-your-domain-with-rumble-studio" target="_blank">Use your domain with Rumble</a>',
					modalSubmitText: options?.modalSubmitText ?? 'Save',
					objectId: options?.domainId,
					attributes: [
						{
							name: 'name',
							HTMLlabel: 'Internal name',
							placeholder: 'my website',
							required: true,
							HTMLhint: 'This name is only for you.',
						},
						{
							name: 'description',
							HTMLlabel: 'Internal description',
							placeholder: 'This domain is used for...',
							HTMLhint: 'This description is only for you.',
						},
						{
							name: 'url',
							HTMLlabel: 'Full URL (with subdomain)',
							defaultValue: defaultDomain,
							placeholder: 'https://my-interviews.example.com',
							HTMLInputSubtype: 'url',
							HTMLpattern: 'https://.*',
							required: true,
							HTMLhint:
								'You must include the subdomain if you have one (participate.example.com, interview.example.com, message.example.com, voicemail.example.com, ....) ',
							editCallBack: (value: string) => {
								// nothing if already starts with https
								if (value.substring(0, 8) == 'https://') return value;

								// replace with https if shorter/equal length but incorrect
								if (value.length <= 7 && value !== 'https://') {
									return 'https://';
								}

								// replace http with https
								if (value.substring(0, 7) == 'http://') return 'https://' + value.substring(7);

								// whatever: let the user do the job
								return value;
							},
						},

						{
							name: 'subscriptionId',
							HTMLlabel: 'Select a subscription',
							attributeType: 'select',
							required: true,
							extra: {
								options: this.subscriptions.map((subscription) => {
									const displayedSubscriptionName =
										(subscription.name ?? subscription.id.substring(0, 8)) +
										'  ( used domains: ' +
										(subscription.usedDomains ?? 0) +
										'/' +
										(subscription.maxAvailableDomains ?? 0) +
										' )';

									return {
										name: displayedSubscriptionName,
										value: subscription.id,
										disabled: (subscription.usedDomains ?? 0) >= (subscription.maxAvailableDomains ?? 0),
									};
								}),
							},
							defaultValue: this.subscriptions.find(
								(subscription) => (subscription.usedDomains ?? 0) < (subscription.maxAvailableDomains ?? 0)
							)?.id,
						},
					],
					object: options?.domain,
				}
			)
			.pipe(
				map((result: Partial<ExtendedDomain> | undefined) => {
					if (!result) return undefined;
					if (!result.url) return;

					// domainData.something = result.something;

					if (options?.domain) {
						const updatedDomain: Domain = {
							...options.domain,
							name: result.name ?? options.domain.name,
							description: result.description,
							url: result.url,
							hostname: options.domain.hostname, // can't be updated
							txtRecordValue: options.domain.txtRecordValue, // can't be updated
							txtRecordName: options.domain.txtRecordName, // can't be updated
							subscriptionId: result.subscriptionId,
							data: JSON.stringify(domainData),
						};
						this.updateDomain(options.domain.id, updatedDomain);
						return updatedDomain;
					} else {
						const ownerId = this._usersRepository.connectedUser$$.getValue()?.id;
						if (!ownerId) return undefined;
						const newDomain: Domain = {
							id: options?.domainId ?? uuidv4(),
							name: result.name ?? 'Untitled domain',
							description: result.description,
							url: result.url,
							// hostname: will come form server,
							// txtRecordValue: will come form server,
							// txtRecordName: will come form server,
							subscriptionId: result.subscriptionId,
							data: JSON.stringify(domainData),
						};
						this.addDomain(newDomain);
						return newDomain;
					}
				})
			);
	}
}
