import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class MyFailingServiceService {
	constructor() {
		throw new Error('This failure was inevitable');
	}

	randomNumber(): number {
		return Math.random();
	}
}
