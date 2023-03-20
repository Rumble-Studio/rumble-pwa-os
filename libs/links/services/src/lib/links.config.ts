import { LinkCategory } from '@rumble-pwa/links/models';

export const LINK_CATEGORIES: LinkCategory[] = [
	{
		displayedTitle: '',
		target: 'dash',
		collapsible: false,
	},
	{
		displayedTitle: 'Creation',
		target: 'creation',
		collapsible: true,
		collapsed: false,
	},
	{
		displayedTitle: 'Editing',
		target: 'editing',
		collapsible: true,
		collapsed: true,
	},
	{
		displayedTitle: 'Files & Exports',
		target: 'filesexports',
		collapsible: true,
		collapsed: true,
	},
	{
		displayedTitle: 'Branding & teams',
		target: 'brandteams',
		collapsible: true,
		collapsed: true,
	},
	{
		displayedTitle: 'Billing',
		target: 'billing',
		collapsible: true,
		collapsed: true,
	},
	{
		displayedTitle: 'Help & Roadmap',
		target: 'helproadmap',
		collapsible: true,
		collapsed: true,
	},
	{
		displayedTitle: 'Admin',
		target: 'admin',
		collapsible: true,
		collapsed: true,
	},
	{
		displayedTitle: '',
		target: 'top',
	},
	{
		displayedTitle: '',
		target: 'bottom',
	},
];
