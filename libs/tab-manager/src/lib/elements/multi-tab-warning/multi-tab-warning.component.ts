import { ChangeDetectorRef, Component } from '@angular/core';
import { TabManagerService } from '../../tab-manager.service';

@Component({
	selector: 'rumble-pwa-multi-tab-warning',
	templateUrl: './multi-tab-warning.component.html',
	styleUrls: ['./multi-tab-warning.component.scss'],
})
export class MultiTabWarningComponent {
	tabs$$;
	activeTab$$;
	currentTab;

	constructor(private cdr: ChangeDetectorRef, private tabManagerService: TabManagerService) {
		this.tabs$$ = this.tabManagerService.tabs$$;
		this.activeTab$$ = this.tabManagerService.activeTab$$;
		this.currentTab = this.tabManagerService.tabId;
	}

	useThisTab() {
		this.tabManagerService.setAsMaintab();
	}
}
