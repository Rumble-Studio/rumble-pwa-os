/* eslint-disable @angular-eslint/component-selector */
/* eslint-disable @typescript-eslint/no-inferrable-types */

import { Component, Input, TemplateRef } from '@angular/core';

@Component({
	selector: 'object-column',
	template: '',
	standalone: true,
})
export class ObjectColumnComponent {
	@Input() header: string = '';
	@Input() headerTemplate?: TemplateRef<HTMLElement>;
	@Input() columnId!: string; // used by cellDef and DisplayColumn
	@Input() objectProperty: string | undefined; // if undefined then it's columnId
	@Input() template?: TemplateRef<HTMLElement>;
	@Input() sortable: boolean = true;
	@Input() flex?: number;
}
