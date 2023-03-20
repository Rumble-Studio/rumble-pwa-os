import { Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FileUploadService } from '@rumble-pwa/files/services';
// import { MacroFileKind } from '@rumble-pwa/mega-store';
import { UsersRepository } from '@rumble-pwa/users/state';
import { combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-test-storage',
	templateUrl: './test-storage.component.html',
	styleUrls: ['./test-storage.component.scss'],
})
export class TestStorageComponent {
	constructor(private _fileUploadService: FileUploadService, private _usersRepository: UsersRepository) {}
	//

	onFileChange(event: any) {
		console.log(event);
		// loop over files item
		// for (let i = 0; i < event.target.files.length; i++) {
		// 	const file = event.target.files[i];
		// 	if (file) this._openFileUploadService.pleaseUploadThisFile$(file);
		// }
		// if (event.target['files'].item(0)) {
		// 	const fileObject = <File>event.target['files'].item(0);
		// 	this._openFileUploadService.pleaseUploadThisFile(fileObject, 'my-key', 'myFileName');
		// }
		// event.target.value = '';
		const userId = this._usersRepository.connectedUser$$.getValue()?.id;
		if (!userId) return;
		if (event.target.files.length > 0) {
			const files: File[] = Array.from(event.target.files);
			combineLatest(
				files.map((file, fileIndex) =>
					this._fileUploadService.pleaseUploadThisFile$(file, userId, 'some file ' + fileIndex).$.pipe(
						tap((uploadingFile) => {
							console.log('uploadingFile', uploadingFile);
						})
					)
				)
			).subscribe();
		}
	}

	reload() {
		location.reload();
	}

	// openUploadGeneric(macroFileKind?: MacroFileKind) {
	// 	let uploadDetails: UploadDetails = MEDIA_UPLOAD_DETAILS;
	// 	if (macroFileKind === 'image') uploadDetails = IMAGE_UPLOAD_DETAILS;
	// 	if (macroFileKind === 'audio') uploadDetails = AUDIO_UPLOAD_DETAILS;
	// 	if (macroFileKind === 'video') uploadDetails = VIDEO_UPLOAD_DETAILS;

	// 	this._openFileUploadService
	// 		.openUploadModal(uploadDetails)
	// 		.pipe(
	// 			// tap((uploadResult: UploadResult) => {
	// 			// 	console.log(uploadDetails);
	// 			// })
	// 			untilDestroyed(this),
	// 			tap((stuff: any) => {
	// 				console.log({ stuff });
	// 			})
	// 		)
	// 		.subscribe();
	// }
}
