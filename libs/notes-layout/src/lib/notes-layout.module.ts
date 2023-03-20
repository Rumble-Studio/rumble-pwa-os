import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FormsElementsModule } from '@rumble-pwa/forms-layout';
import { GlobalPlayerModule } from '@rumble-pwa/global-player';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { NoteItemPageComponent } from './pages/note-item-page/note-item-page.component';
import { NotesListPageComponent } from './pages/notes-list-page/notes-list-page.component';

const routes = [
	{
		path: '',
		component: NotesListPageComponent,
	},
	{
		path: ':noteId',
		component: NoteItemPageComponent,
	},
];

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(routes),
		DesignSystemModule,
		GlobalPlayerModule,
		FormsElementsModule,
		ObjectListComponent,
		ObjectColumnComponent,
		TrackClickDirective,
	],
	declarations: [NotesListPageComponent, NoteItemPageComponent],
})
export class NotesLayoutModule {}
