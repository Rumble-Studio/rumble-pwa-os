import { CommonModule } from '@angular/common';
import { Component, forwardRef, Injector, Input, OnInit, Type, ViewContainerRef } from '@angular/core';
import { ControlValueAccessor, NgControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TrackClickDirective } from '@rumble-pwa/monitoring-system';

@Component({
	selector: 'rumble-pwa-form-control-outlet',
	standalone: true,
	imports: [
		//
		CommonModule,
		TrackClickDirective,
	],
	template: '',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => FormControlOutletComponent),
			multi: true,
		},
	],
})
export class FormControlOutletComponent implements OnInit {
	// inspired from: https://stackoverflow.com/questions/44181152/how-to-dynamically-add-ng-value-accessor-component-to-reactive-form

	@Input() component?: Type<any & ControlValueAccessor>;
	@Input() propertiesMapping?: { [key: string]: any } = {};

	constructor(public injector: Injector, private viewContainerRef: ViewContainerRef) {}

	public ngOnInit(): void {
		const ngControl = this.injector.get(NgControl);
		if (!this.component) {
			throw 'You are using FormControlOutletComponent without a component input';
		}
		const componentRef = this.viewContainerRef.createComponent(this.component);

		for (const customPropertyName in this.propertiesMapping) {
			componentRef.instance[customPropertyName] = this.propertiesMapping[customPropertyName];
		}

		ngControl.valueAccessor = componentRef.instance;
	}
}
