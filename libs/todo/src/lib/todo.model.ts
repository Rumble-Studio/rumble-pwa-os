export interface Todo {
	id: string;
	title: string;
	description: string;
	// action?: string;
	doAction?: (todo: Todo) => any; // to be called when clicking "Do it"
	actionTitle?: string; // button doing action
	route?: string;
	priority?: number;
	tooltip?: string;
	displayConditions?: string[]; // some prefedined values that the todo service knows how to handle, all conditions must be met
	toDisplay?: (todo: Todo) => boolean; // to be called to know if we should display it
	// doneConditions?: string[];
	isDone?: (todo: Todo) => boolean; // to be called to assess if already done
	img?: string;
	youtubeVideo?: string;
	alwaysShow?: boolean;
	confirmTerm?: string; // button to dismiss, default: "Got it"
}
