import { Component, OnInit } from '@angular/core';
import { MyFailingServiceService } from '../my-failing-service.service';
import { MySimpleServiceService } from '../my-simple-service.service';

@Component({
	selector: 'rumble-pwa-my-parent-component',
	templateUrl: './my-parent-component.component.html',
	styleUrls: ['./my-parent-component.component.scss'],
})
export class MyParentComponentComponent implements OnInit {
	constructor(private aServiceIneed: MySimpleServiceService, private anotherServiceIneed: MyFailingServiceService) {
		this.aServiceIneed.mySimpleMethod();
		console.log('a random number:', this.anotherServiceIneed.randomNumber());
	}

	ngOnInit(): void {}
}
