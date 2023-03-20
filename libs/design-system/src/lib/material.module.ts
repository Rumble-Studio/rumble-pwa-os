import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
// import { MatIconComponent } from './elements/atoms/mat-icon/mat-icon.component';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

const materialElements = [
	MatBadgeModule,
	MatButtonModule,
	MatButtonToggleModule,
	MatMenuModule,
	MatIconModule, // default mat icon angular material module
	MatCardModule,
	MatSliderModule,
	MatProgressBarModule,
	MatAutocompleteModule,
	MatInputModule,
	MatGridListModule,
	MatSnackBarModule,
	MatProgressSpinnerModule,
	MatTooltipModule,
	MatListModule,
	MatDialogModule,
	MatToolbarModule,
	ScrollingModule,
	MatFormFieldModule,
	MatSelectModule,
	MatCheckboxModule,
	MatExpansionModule,
	MatTableModule,
	MatPaginatorModule,
	MatTabsModule,
	MatChipsModule,
	DragDropModule,
	MatStepperModule,
	MatRadioModule,
	MatSidenavModule,
	CdkStepperModule,
	MatSortModule,
	MatSlideToggleModule,
	ClipboardModule,
	MatRippleModule,
];

@NgModule({
	// default module properties
	imports: materialElements,
	exports: [...materialElements],
	declarations: [],

	// when working offline: this replace the mat Icon with "@"
	// imports: materialElements,
	// exports: [...materialElements, MatIconComponent],
	// declarations: [MatIconComponent],
})
export class MaterialModule {}
