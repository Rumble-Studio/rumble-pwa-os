/* eslint-disable prefer-rest-params */
import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { HOME_SEGMENT, LayoutRepository, LAYOUT_FOR_LIST } from '@rumble-pwa/layout/state';
import { RestService } from '@rumble-pwa/requests';
import { CanCheck, Check, JavascriptService } from '@rumble-pwa/utils';

declare let Canny: any;

const BOARD_TOKEN_FEATURE_REQUESTS = '61800d03-0e9b-b0b8-4aca-d54d9ccca97d';
const BOARD_TOKEN_BUGS = '8161b28a-abde-cea3-f916-6d90efad54a5';
const BOARD_TOKEN_INTEGRATION_REQUESTS = 'b07c7332-e8d3-92cb-9552-462bf0a06458';
const BOARD_TOKEN_LANGUAGE_REQUESTS = 'dd79d1ec-2db7-0879-1655-48f8b542f27e';

@Component({
	selector: 'rumble-pwa-roadmap',
	templateUrl: './roadmap.component.html',
	styleUrls: ['./roadmap.component.scss'],
})
export class RoadmapComponent extends Check implements AfterViewInit, CanCheck {
	containerId = 'canny-container-yo';
	jsSrc = 'https://canny.io/sdk.js';

	cannySsoTokenLoaded = false;
	roadmapScriptLoaded = false;

	userCannyToken?: string;

	tokens = {
		featureRequests: BOARD_TOKEN_FEATURE_REQUESTS,
		bugs: BOARD_TOKEN_BUGS,
		integrationRequests: BOARD_TOKEN_INTEGRATION_REQUESTS,
		languageRequests: BOARD_TOKEN_LANGUAGE_REQUESTS,
	};

	@ViewChild('cannyContainer') cannyContainer?: HTMLDivElement;

	private _selectedBoardToken = BOARD_TOKEN_FEATURE_REQUESTS;
	public get selectedBoardToken() {
		return this._selectedBoardToken;
	}
	public set selectedBoardToken(newBoardToken) {
		this._selectedBoardToken = newBoardToken;
		if (!this.cannySsoTokenLoaded || !this.userCannyToken || !this.roadmapScriptLoaded) {
			return;
		}

		const cannyIframe = document.getElementById('canny-iframe');
		if (cannyIframe) {
			cannyIframe.remove();
		}
		this._renderCanny(newBoardToken);
	}

	constructor(
		_cdr: ChangeDetectorRef,
		private _javascriptService: JavascriptService,
		private _layoutRepository: LayoutRepository,
		private _restService: RestService
	) {
		super(_cdr);

		// layout repository
		this._layoutRepository.setLayoutProps({
			...LAYOUT_FOR_LIST,
			pageSegments: [
				HOME_SEGMENT,
				{
					title: 'Roadmap',
					link: undefined,
				},
			],
		});
	}

	ngAfterViewInit() {
		console.log('%c roadmap component loading...', 'background: #222; color: #baa');

		this._restService.get<string>('/users/get-canny-token').subscribe((cannyToken) => {
			this.cannySsoTokenLoaded = true;
			this._check();
			this.userCannyToken = cannyToken;

			this._javascriptService.loadScript(this.containerId, this.jsSrc, () => {
				this.roadmapScriptLoaded = true;
				this._check();
				this._renderCanny();
			});
		});
	}

	_renderCanny(boardToken?: string) {
		if (this.cannySsoTokenLoaded && this.userCannyToken && this.roadmapScriptLoaded) {
			Canny('render', {
				boardToken: boardToken ?? this.selectedBoardToken,
				basePath: '/roadmap',
				ssoToken: this.userCannyToken,
			});
		}
		this._check();
	}
}
