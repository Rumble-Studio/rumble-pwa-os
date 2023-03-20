import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { PlaylistPlayerComponent } from '@rumble-pwa/player/specialised';
import { ExportAudioStepComponent } from './elements/export-steps/export-audio-step/export-audio-step.component';
import { ExportCallToActionStepComponent } from './elements/export-steps/export-call-to-action-step/export-call-to-action-step.component';
import { ExportCustomImageComponent } from './elements/export-steps/export-custom-image/export-custom-image.component';
import { ExportDocumentStepComponent } from './elements/export-steps/export-document-step/export-document-step.component';
import { ExportGuestInformationsStepComponent } from './elements/export-steps/export-guest-informations/export-guest-informations-step.component';
import { ExportJingleComponent } from './elements/export-steps/export-jingle/export-jingle.component';
import { ExportMcqStepComponent } from './elements/export-steps/export-mcq-step/export-mcq-step.component';
import { ExportMessageStepComponent } from './elements/export-steps/export-message-step/export-message-step.component';
import { ExportNumberStepComponent } from './elements/export-steps/export-number-step/export-number-step.component';
import { ExportParagraphStepComponent } from './elements/export-steps/export-paragraph-step/export-paragraph-step.component';
import { ExportPictureStepComponent } from './elements/export-steps/export-picture-step/export-picture-step.component';
import { ExportPrivateAudioComponent } from './elements/export-steps/export-private-audio/export-private-audio.component';
import { ExportRecordingInstructionsStepComponent } from './elements/export-steps/export-recording-instructions-step/export-recording-instructions-step.component';
import { ExportShareThisFormStepComponent } from './elements/export-steps/export-share-this-form-step/export-share-this-form-step.component';
import { ExportSliderStepComponent } from './elements/export-steps/export-slider-step/export-slider-step.component';
import { ExportTextStepComponent } from './elements/export-steps/export-text-step/export-text-step.component';
import { ExportVideoStepComponent } from './elements/export-steps/export-video-step/export-video-step.component';
import { ExportWelcomeStepComponent } from './elements/export-steps/export-welcome-step/export-welcome-step.component';

const COMPONENTS = [
	ExportTextStepComponent,
	ExportAudioStepComponent,
	ExportPictureStepComponent,
	ExportGuestInformationsStepComponent,
	ExportCallToActionStepComponent,
	ExportWelcomeStepComponent,
	ExportRecordingInstructionsStepComponent,
	ExportShareThisFormStepComponent,
	ExportMessageStepComponent,
	ExportVideoStepComponent,
	ExportJingleComponent,
	ExportPrivateAudioComponent,
	ExportCustomImageComponent,
	ExportNumberStepComponent,
	ExportMcqStepComponent,
	ExportSliderStepComponent,
	ExportParagraphStepComponent,
	ExportDocumentStepComponent,
];
@NgModule({
	imports: [
		//
		CommonModule,
		RouterModule,
		DesignSystemModule,
		PlaylistPlayerComponent,
		TrackClickDirective,
	],
	declarations: COMPONENTS,
	exports: COMPONENTS,
})
export class FormsExportModule {}
