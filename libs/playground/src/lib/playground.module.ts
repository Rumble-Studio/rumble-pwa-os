import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TestStorageComponent } from './elements/test-storage/test-storage.component';
import { TestListPageComponent } from './pages/test-list-page/test-list-page.component';

const routes = [
	{
		path: '',
		component: TestListPageComponent,
	},
	// {
	// 	path: '**',
	// 	component: TestListPageComponent,
	// 	// redirectTo: '',
	// },
];

@NgModule({
	imports: [CommonModule, RouterModule.forChild(routes)],
	declarations: [TestStorageComponent, TestListPageComponent],
})
export class PlaygroundModule {}
