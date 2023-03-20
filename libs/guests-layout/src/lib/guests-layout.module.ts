import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuestListComponent } from './pages/guest-list/guest-list.component';
import { GuestEditorComponent } from './pages/guest-editor/guest-editor.component';
import { GuestsLayoutComponent } from './pages/guests-layout/guests-layout.component';
import { RouterModule } from '@angular/router';

const routes = [
	{
		path: '',
		component: GuestsLayoutComponent,
	},
];

@NgModule({
	imports: [CommonModule, RouterModule.forChild(routes)],
	declarations: [GuestListComponent, GuestEditorComponent, GuestsLayoutComponent],
})
export class GuestsLayoutModule {}
