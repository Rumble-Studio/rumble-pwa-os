// import { Injectable } from '@angular/core';
// import { QueryEntity } from '@datorama/akita';
// import { isEqual } from 'lodash';
// import { BehaviorSubject, Observable } from 'rxjs';
// import { debounceTime, filter, shareReplay, tap } from 'rxjs/operators';
// import { User } from './user.model';
// import { UsersStore, UsersState } from './users.store';

// @Injectable({ providedIn: 'root' })
// export class UsersQuery extends QueryEntity<UsersState> {
// 	users: User[] = [];

// 	users$: Observable<User[]> = this.selectAll().pipe(
// 		filter((users) => !isEqual(this.users, users)),
// 		tap((users) => {
// 			this.users = users;
// 		}),
// 		shareReplay()
// 	);
// 	users$$: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
// 	usersToSync$: Observable<User[]> = this.selectAll({
// 		filterBy: (entity) => entity.toSync === true,
// 	}).pipe(debounceTime(300));
// 	constructor(protected store: UsersStore) {
// 		super(store);
// 		this.users$.subscribe(this.users$$);
// 	}
// }
