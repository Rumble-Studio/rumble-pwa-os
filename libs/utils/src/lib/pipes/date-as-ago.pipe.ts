import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
	name: 'dateAsAgo',
})
export class DateAsAgoPipe implements PipeTransform {
	transform(value: number, ...args: unknown[]): unknown {
		if (!value) {
			return '';

			// return 'a long time ago';
		}
		let delta_t_in_seconds = (Date.now() - value) / 1000;
		if (delta_t_in_seconds < 60) {
			return 'just now';
		}
		if (delta_t_in_seconds < 120) {
			return 'a minute ago';
		}
		// if more than 1 day return date
		if (delta_t_in_seconds > 86400) {
			return new Date(value).toLocaleString();
		}

		const divider = [60, 60, 24, 30, 12];
		const string = [' second', ' minute', ' hour', ' day', ' month', ' year'];
		let i;
		for (i = 0; Math.floor(delta_t_in_seconds / divider[i]) > 0; i++) {
			delta_t_in_seconds /= divider[i];
		}
		const plural = Math.floor(delta_t_in_seconds) > 1 ? 's' : '';
		return Math.floor(delta_t_in_seconds) + string[i] + plural + ' ago';
	}
}
