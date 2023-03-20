import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BrandsRepository } from '@rumble-pwa/brands/state';
import { NotificationsService } from '@rumble-pwa/client-notifications';
// import { OpenFileUploadService, IMAGE_UPLOAD_DETAILS } from '@rumble-pwa/files/services';
// import { Brand, BrandData } from '@rumble-pwa/mega-store';
import { Brand, BrandData } from '@rumble-pwa/brands/state';
import { DataObsViaId } from '@rumble-pwa/utils';
import { tap } from 'rxjs/operators';
import { ExportDataToPDFPrompt } from '../form-editor-dad/form-editor-dad.component';
import { DataToPDF, FilesRepository, TextDataToPDF } from '@rumble-pwa/files/state';

@UntilDestroy()
@Component({
	selector: 'rumble-pwa-export-pdf-prompt',
	templateUrl: './export-pdf-prompt.component.html',
	styleUrls: ['./export-pdf-prompt.component.scss'],
})
export class ExportPdfPromptComponent {
	exportForm: UntypedFormGroup;

	brand$$$ = new DataObsViaId<Brand>((brandId: string) => this._brandsRepository.get$(brandId));
	brandData?: BrandData;

	fontFamilyOptions = ['Arial', 'Courier', 'Helvetica', 'Times', 'Symbol'];
	waitForPdfString = false;
	timeOutDelay = 10000;
	hasExportError = false;

	pdfString?: any;

	constructor(
		private dialogRef: MatDialogRef<ExportPdfPromptComponent>,
		private formBuilder: UntypedFormBuilder,
		@Inject(MAT_DIALOG_DATA)
		public data: ExportDataToPDFPrompt,
		private _brandsRepository: BrandsRepository,
		private filesRepository: FilesRepository,
		// private _openFileUploadService: OpenFileUploadService,
		private notificationsService: NotificationsService
	) {
		dialogRef.disableClose = true;
		dialogRef.keydownEvents().subscribe((event) => {
			if (event.key === 'Escape') {
				this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
					if (confirmation) {
						this.dialogRef.close();
					}
				});
			}
		});
		dialogRef.backdropClick().subscribe(() => {
			this.notificationsService.confirm('Are you sure to close this dialog?').subscribe((confirmation) => {
				if (confirmation) {
					this.dialogRef.close();
				}
			});
		});
		this.brand$$$.$.pipe(
			untilDestroyed(this),
			tap((brand) => {
				this.brandData = JSON.parse(brand?.data || '{}');
			})
		).subscribe();

		if (data.form?.brandId) {
			this.brand$$$.id = data.form.brandId;
		}
		this.exportForm = this.formBuilder.group({
			header: new UntypedFormControl(),
			brandName: new UntypedFormControl(this.brand$$$.value?.name),
			formName: new UntypedFormControl(data.form?.title, Validators.required),
			extraText: new UntypedFormControl(),
			footer: new UntypedFormControl(),
			fontFamily: new UntypedFormControl(),
			fontColor: new UntypedFormControl(),
			backgroundColor: new UntypedFormControl(),
			brandImageUrl: new UntypedFormControl(),
		});

		this.exportForm.valueChanges
			.pipe(
				untilDestroyed(this),
				tap(() => {
					this.pdfString = '';
				})
			)
			.subscribe();
	}

	close() {
		this.dialogRef.close({});
	}

	downloadPdf() {
		const now = new Date();
		const pdfFileName =
			(this.exportForm.get('brandName')?.value ?? 'No_brand_name') + '_' + this.exportForm.get('formName')?.value ??
			'No_form_name' + '_' + now.toLocaleDateString().replace('/', '-') + '.pdf';

		console.error('Not implemented');

		// this.filesRepository.saveAs(this.pdfString, pdfFileName);
	}

	changeBrandImage(imageSrc: string | undefined) {
		this.exportForm.patchValue({ brandImageUrl: imageSrc });
	}

	openUploadModal() {
		console.warn('(openUploadModal) Not implemented');
		// this._openFileUploadService.openUploadModal(IMAGE_UPLOAD_DETAILS).subscribe((result) => {
		// 	if (result && result.length > 0) {
		// 		this.exportForm.patchValue({ brandImageId: result[0].fileId });
		// 	}
		// });
	}

	generateTimeOutError() {
		// setTimeout(() => {
		// 	if (!this.pdfString) {
		// 		this.waitForPdfString = false;
		// 		this.hasExportError = true;
		// 		this.notificationsService.error('Error while exporting your PDF, please try again');
		// 	}
		// }, this.timeOutDelay);
	}

	save() {
		this.generateTimeOutError();
		this.hasExportError = false;
		this.waitForPdfString = true;
		const textsToPrint: TextDataToPDF[] = [];

		const headerText = this.exportForm.get('header')?.value ?? '';
		const extraText = this.exportForm.get('extraText')?.value ?? '';
		const footerText = this.exportForm.get('footer')?.value ?? '';
		const fontColor = this.exportForm.get('fontColor')?.value ?? '#000000';
		const backgroundColor = this.exportForm.get('backgroundColor')?.value ?? '#ffffff';

		const qrCode = {
			link: this.data.formUrl,
			fillColorHex: fontColor,
			backColorHex: backgroundColor,
		};

		if (headerText) {
			textsToPrint.push({
				text: headerText,
				type: 'HEADER',
				fontSize: 20,
				align: 'C',
				fontColor,
			});
		}

		if (extraText) {
			textsToPrint.push({
				text: extraText,
				type: 'TITLE',
				fontSize: 16,
				align: 'C',
				fontColor,
			});
		}

		if (footerText) {
			textsToPrint.push({
				text: footerText,
				type: 'FOOTER',
				fontSize: 16,
				fontColor,
			});
		}

		const data: DataToPDF = {
			textsToPrint,
			qrCode,
			backgroundColor,
			images: [],
		};

		let imageId = this.exportForm.get('brandImageUrl')?.value;
		if (typeof imageId === 'string') {
			imageId = imageId.substring(5);
			data.images.push({
				imageId,
				type: 'BRAND_IMAGE',
			});
		}

		console.error('Not implemented');

		this.filesRepository
			.generatePdf(data)
			.pipe(
				untilDestroyed(this),
				tap((pdfString) => {
					this.filesRepository.saveAs(pdfString, 'test.pdf');
				})
			)
			.subscribe();
	}
}
