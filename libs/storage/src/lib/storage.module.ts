import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { StorageService } from './storage.service';
// import { persistState, akitaConfig } from '@datorama/akita';
// import { debounceTime, delay, take, tap } from 'rxjs/operators';
// akitaConfig({ resettable: true });

@NgModule({
	imports: [CommonModule],
})
export class StorageModule {
	// constructor(private storageService: StorageService) {}
	// activatePersistence() {
	//   // console.log(
	//   //   '%c[StorageModule](constructor) activating Akita persistence',
	//   //   'color:darkgreen'
	//   // );
	//   // this persistState is used by all stores
	//   persistState({
	//     key: 'rs-akita',
	//     storage: this.storageService,
	//     // preStorageUpdateOperator: () => {
	//     //   return (obs$) => {
	//     //     return obs$.pipe(
	//     //       tap(() => {
	//     //         console.log('Saving to disk...');
	//     //       }),
	//     //       debounceTime(3000),
	//     //       tap((data) => {
	//     //         console.log('Saved to disk!');
	//     //         console.log({ data });
	//     //       })
	//     //     );
	//     //   };
	//     // },
	//   });
	// }
}
