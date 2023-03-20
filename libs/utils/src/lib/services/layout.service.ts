import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class LayoutService {
	layoutSize$$: BehaviorSubject<number> = new BehaviorSubject(2);
	layoutSize$: Observable<number> = this.layoutSize$$.asObservable().pipe(shareReplay({ refCount: true }));

	constructor(private breakpointObserver: BreakpointObserver) {
		this.observeLayoutSizeChanges();
		// this.injectFont();
	}

	observeLayoutSizeChanges(): void {
		this.breakpointObserver
			.observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
			.subscribe((result) => {
				if (result.breakpoints[Breakpoints.XSmall]) {
					this.layoutSize$$.next(0); //'XSmall';
				} else if (result.breakpoints[Breakpoints.Small]) {
					this.layoutSize$$.next(1); //'Small';
				} else if (result.breakpoints[Breakpoints.Medium]) {
					this.layoutSize$$.next(2); //'Medium';
				} else if (result.breakpoints[Breakpoints.Large]) {
					this.layoutSize$$.next(3); //'Large';
				} else if (result.breakpoints[Breakpoints.XLarge]) {
					this.layoutSize$$.next(4); //'XLarge';
				}
			});
	}

	// 	injectFont() {
	// 		const fontUrl = 'https://fonts.googleapis.com/css2?family=Oleo+Script+Swash+Caps:wght@700&display=swap';

	// 		const node = document.createElement('style');
	// 		node.innerHTML = `
	// @font-face {
	//   font-family: 'font1';
	//   src: url('${fontUrl}') format('woff');
	// }
	// body {
	//   font-family: font1, sans-serif;
	// }`;
	// 		document.head.appendChild(node);
	// 	}
}
