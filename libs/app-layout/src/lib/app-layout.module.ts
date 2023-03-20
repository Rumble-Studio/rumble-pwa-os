import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { ResizableModule } from '@rumble-pwa/atomic-system';
import { ClientNotificationsModule } from '@rumble-pwa/client-notifications';
import { CollectionPageComponent } from '@rumble-pwa/collections/pages';
import { DesignSystemModule } from '@rumble-pwa/design-system';
import { FileUploadPopupComponent } from '@rumble-pwa/files/services';
import { FormsElementsModule } from '@rumble-pwa/forms-layout';
import { FormListComponent } from '@rumble-pwa/forms/ui';
import { GlobalPlayerModule } from '@rumble-pwa/global-player';
import { GroupItemGenericComponent } from '@rumble-pwa/groups/ui';
import { MenuBottomNavComponent, MenuSideNavComponent } from '@rumble-pwa/links/ui';
import { MixesElementsModule } from '@rumble-pwa/mixes-layout';
import { NotificationsElementsModule } from '@rumble-pwa/notifications-layout';
import { ObjectPromptComponent } from '@rumble-pwa/objects/prompt';
import { ObjectColumnComponent, ObjectListComponent } from '@rumble-pwa/objects/ui';
import { TodoComponent, TodoListComponent, TodoOpenComponent } from '@rumble-pwa/todo';
import { UpgradeComponent } from '@rumble-pwa/upgrade/ui';
import { UtilsModule } from '@rumble-pwa/utils';
import { AppLayoutRoutingModule } from './app-layout-routing.module';
import { CatchAllPatchComponent } from './pages/catch-all-patch/catch-all-patch.component';
import { DashComponent } from './pages/dash/dash.component';
import { DashboardAnonymousComponent } from './pages/dashboard-anonymous/dashboard-anonymous.component';
import { DashboardGuestComponent } from './pages/dashboard-guest/dashboard-guest.component';
import { DashboardWelcomeComponent } from './pages/dashboard-welcome/dashboard-welcome.component';
import { DashboardWlComponent } from './pages/dashboard-wl/dashboard-wl.component';
import { HelpComponent } from './pages/help/help.component';
import { PageNotReadyComponent } from './pages/page-not-ready/page-not-ready.component';
import { RoadmapComponent } from './pages/roadmap/roadmap.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';

@NgModule({
	imports: [
		CommonModule,
		AppLayoutRoutingModule,
		DesignSystemModule,
		GlobalPlayerModule,
		FormsElementsModule,
		MixesElementsModule,
		ClientNotificationsModule,
		RouterModule,
		NotificationsElementsModule,
		UtilsModule,
		// standalone components
		ObjectListComponent,
		ObjectColumnComponent,
		ResizableModule,
		UpgradeComponent,
		MenuSideNavComponent,
		TodoComponent,
		TodoOpenComponent,
		MenuBottomNavComponent,
		GroupItemGenericComponent,
		FormListComponent,
		FileUploadPopupComponent,
		CollectionPageComponent,
		PageNotReadyComponent,
		ObjectPromptComponent,
		TodoListComponent,
		TranslocoModule,
	],
	declarations: [
		DashboardWelcomeComponent,
		WelcomeComponent,
		DashComponent,

		RoadmapComponent,
		HelpComponent,
		DashboardGuestComponent,
		DashboardAnonymousComponent,
		DashboardWlComponent,
		CatchAllPatchComponent,
	],
	exports: [DashComponent],
})
export class AppLayoutModule {
	static injector: Injector;
	constructor(injector: Injector) {
		AppLayoutModule.injector = injector;
	}
}
