import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
	providedIn: 'root',
})
export class LoadingService {
	loading$$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	load() {
		this.loading$$.next(true);
	}

	stop() {
		this.loading$$.next(false);
	}
}
