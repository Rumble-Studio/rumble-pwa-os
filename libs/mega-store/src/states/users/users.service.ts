// import { Injectable } from '@angular/core';

// import { User } from './user.model';
// import { UsersStore } from './users.store';

// @Injectable({ providedIn: 'root' })
// export class UsersService {
// 	constructor(private usersStore: UsersStore) {}

// 	add(user: User) {
// 		this.usersStore.add(user);
// 	}

// 	update(id: string, user: Partial<User>) {
// 		this.usersStore.update(id, user);
// 	}

// 	upsert(user: User) {
// 		this.usersStore.upsert(user.id, user);
// 	}

// 	upsertMany(users: User[]) {
// 		this.usersStore.upsertMany(users);
// 	}

// 	set(users: User[]) {
// 		this.usersStore.set(users);
// 	}

// 	removeAll() {
// 		this.usersStore.remove();
// 	}

// 	remove(id: string) {
// 		this.usersStore.remove(id);
// 	}
// }
