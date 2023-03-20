import { Injectable } from '@angular/core';
import { persistState } from '@datorama/akita';
import { StorageService } from '..';

@Injectable({
	providedIn: 'root',
})
export class PersistenceService {
	constructor(private storageService: StorageService) {}

	activatePersistence() {
		// console.log(
		//   '%c[StorageModule](constructor) activating Akita persistence',
		//   'color:darkgreen'
		// );
		// this persistState is used by all stores
		persistState({
			key: 'rs-akita',
			storage: this.storageService,
			// preStorageUpdateOperator: () => {
			//   return (obs$) => {
			//     return obs$.pipe(
			//       tap(() => {
			//         console.log('Saving to disk...');
			//       }),
			//       debounceTime(3000),
			//       tap((data) => {
			//         console.log('Saved to disk!');
			//         console.log({ data });
			//       })
			//     );
			//   };
			// },
		});
	}
}
