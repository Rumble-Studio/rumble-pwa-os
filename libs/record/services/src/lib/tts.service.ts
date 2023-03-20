import { Injectable } from '@angular/core';
import { RestService } from '@rumble-pwa/requests';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class TtsService {
	constructor(private restService: RestService) {}

	textToSpeech(text: string, voice: string): Observable<any> {
		return this.restService.post('/files/tts', { text, voice });
	}
}
