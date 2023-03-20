import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyParentComponentComponent } from './my-parent-component/my-parent-component.component';
import { MyChildComponentComponent } from './my-child-component/my-child-component.component';

@NgModule({
	imports: [CommonModule],
	declarations: [MyParentComponentComponent, MyChildComponentComponent],
})
export class TestExampleModule {}
