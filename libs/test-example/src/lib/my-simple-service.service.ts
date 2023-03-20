import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class MySimpleServiceService {
	constructor() {}

	mySimpleMethod() {
		return 'pesto';
	}
	mySimpleMethodWithArgs(person: { name: string; age: number }) {
		return `${person.name} is ${person.age} years old`;
	}
}
