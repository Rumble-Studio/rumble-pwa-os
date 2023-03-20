import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { ExplanationComponent, ImageComponent } from '@rumble-pwa/atomic-system';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { GlobalPlayerModule } from '@rumble-pwa/global-player';
import { GroupsElementsModule } from '@rumble-pwa/groups-layout';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { scopeLoader } from '@rumble-pwa/i18n';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { PlaylistPlayerComponent } from '@rumble-pwa/player/specialised';
import { VirtualPlaylistRecorderComponent } from '@rumble-pwa/record/ui';
import { TodoComponent, TodoOpenComponent } from '@rumble-pwa/todo';
import { UpgradeComponent } from '@rumble-pwa/upgrade/ui';
import { GenericFavoriteComponent } from '@rumble-pwa/users/ui';
import { UtilsModule } from '@rumble-pwa/utils';
import { ExportPdfPromptComponent } from './elements/export-pdf-prompt/export-pdf-prompt.component';
import { FormCustomisationComponent } from './elements/form-customisation/form-customisation.component';
import { FormEditableStepComponent } from './elements/form-editable-step/form-editable-step.component';
import { FormOpenerPromptComponent } from './elements/form-opener-prompt/form-opener-prompt.component';
import { FormProviderComponent } from './elements/form-provider/form-provider.component';
import { FormSourceStepComponent } from './elements/form-source-step/form-source-step.component';
import { FormStepperComponent } from './elements/form-stepper/form-stepper.component';
import { FormComponent } from './elements/form/form.component';
import { GuestGenericComponent } from './elements/guest-steps/guest-generic/guest-generic.component';
import { GuestWelcomeStepComponent } from './elements/guest-steps/guest-welcome-step/guest-welcome-step.component';
import { MultiQuestionsPromptComponent } from './elements/multi-questions-prompt/multi-questions-prompt.component';
import { RecordingSessionCanvasItemComponent } from './elements/recording-session-canvas-item/recording-session-canvas-item.component';
import { RecordingSessionCanvasComponent } from './elements/recording-session-canvas/recording-session-canvas.component';
import { RecordingSessionListComponent } from './elements/recording-session-list/recording-session-list.component';
import { RecordingSessionShortPreviewComponent } from './elements/recording-session-short-preview/recording-session-short-preview.component';
import { RsBrowserComponent } from './elements/rs-browser/rs-browser.component';
import { SessionSelectorComponent } from './elements/session-selector/session-selector.component';
import { StepComponent } from './elements/step/step.component';
import { TextListConsumerComponent } from './elements/text-list-consumer/text-list-consumer.component';
import { TextListEditorComponent } from './elements/text-list-editor/text-list-editor.component';
import { FormsExportModule } from './forms-export.module';

const COMPONENTS = [
	StepComponent,
	FormComponent,
	FormStepperComponent,
	SessionSelectorComponent,
	RecordingSessionListComponent,
	RecordingSessionShortPreviewComponent,
	FormSourceStepComponent,
	TextListEditorComponent,
	TextListConsumerComponent,
	FormProviderComponent,
	FormEditableStepComponent,
	GuestGenericComponent,
	RsBrowserComponent,
	GuestWelcomeStepComponent,
	FormCustomisationComponent,
	RecordingSessionCanvasComponent,
	RecordingSessionCanvasItemComponent,
	ExportPdfPromptComponent,
	MultiQuestionsPromptComponent,
	FormOpenerPromptComponent,
];

@NgModule({
	imports: [
		CommonModule,
		DesignSystemModule,
		RouterModule,
		FormsExportModule,
		GlobalPlayerModule, // play recording session as playlist
		GroupsElementsModule, // group generic item
		UtilsModule,
		TodoOpenComponent,
		TodoComponent,
		ObjectListComponent,
		ObjectColumnComponent,
		GroupItemGenericComponent,
		VirtualPlaylistRecorderComponent,
		PlaylistPlayerComponent,
		ExplanationComponent,
		UpgradeComponent,
		GenericFavoriteComponent,
		ImageComponent,
		TrackClickDirective,
		TranslocoModule,
	],
	declarations: [...COMPONENTS],
	exports: [...COMPONENTS, FormsExportModule],
	providers: [
		{
			provide: TRANSLOCO_SCOPE,
			useValue: {
				// this 2 lines are basically
				// saying "please load the json file into ABC namespace."
				// HTML will need to use at least "profileLayout." to use its content.
				scope: 'formsLayout',
				loader: scopeLoader((lang: string) => {
					console.log('[FormsElementsModule](scopeLoader)', lang);
					return import(`./i18n/${lang}.json`);
				}),
			},
		},
	],
})
export class FormsElementsModule {
	constructor() {
		console.log('[FormsElementModule](constructor)');
	}
}
