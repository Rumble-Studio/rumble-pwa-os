import { Todo } from '@rumble-pwa/todo';
import { Upgrade } from '@rumble-pwa/upgrade/models';

// export type LinkTarget = 'dash' | 'creation' | 'materials' | 'org' | 'billing' | 'infos' | 'admin' | 'top' | 'bottom';
export type LinkTarget =
	| 'dash'
	| 'creation'
	| 'editing'
	| 'filesexports'
	| 'brandteams'
	| 'helproadmap'
	| 'billing'
	| 'admin'
	| 'top'
	| 'bottom';

export interface LinkCategory {
	displayedTitle: string;
	target: LinkTarget;
	collapsible?: boolean;
	collapsed?: boolean;
}

export interface SideNavLink {
	name: string;
	shortName: string;
	description: string;
	matIcon?: string;
	matIconSuffix?: string;
	imageUrl?: string;
	path?: string;
	/** displayIn is mandatory to force explicit listing */
	displayIn: LinkCategory['target'][];
	superUserOnly?: boolean;
	supportUserAccess?: boolean;
	permissionDetails?: { permissionKey: string };
	todo?: Todo;
	upgrade?: Upgrade;
	callback?: any;
}
