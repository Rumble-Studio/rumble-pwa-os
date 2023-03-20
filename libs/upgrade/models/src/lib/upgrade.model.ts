export interface Upgrade {
	id: string;
	title: string;
	description: string;
	route?: string;
	priority?: number;
	tooltip?: string;
	grantsRequired?: string[];
	permissionsRequired?: string[];
	customCondition?: boolean;
	alwaysShow?: boolean;
	confirmTerm?: string; // button to dismiss, default: "Upgrade"
}
