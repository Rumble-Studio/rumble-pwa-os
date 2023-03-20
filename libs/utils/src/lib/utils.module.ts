import { NgModule } from '@angular/core';
import { AutofocusDirective } from './directives/autofocus.directive';
import { DateAsAgoPipe } from './pipes/date-as-ago.pipe';
import { DurationPipe } from './pipes/duration.pipe';

const ELEMENTS = [AutofocusDirective, DateAsAgoPipe, DurationPipe];

@NgModule({
	imports: [],
	declarations: ELEMENTS,
	exports: ELEMENTS,
})
export class UtilsModule {}
