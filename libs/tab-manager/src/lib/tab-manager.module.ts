import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiTabWarningComponent } from './elements/multi-tab-warning/multi-tab-warning.component';
import { DesignSystemModule } from '@rumble-pwa/design-system';
@NgModule({
	imports: [CommonModule, DesignSystemModule],
	declarations: [MultiTabWarningComponent],
	exports: [MultiTabWarningComponent],
})
export class TabManagerModule {}
