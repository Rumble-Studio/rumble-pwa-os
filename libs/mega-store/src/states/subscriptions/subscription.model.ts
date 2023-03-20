import { Syncable } from '../../others/types';

export interface Plan {
	grantMapping: string;
	name: string;
	description: string;
	priceLine: any;
	features: { name: string; unit: string | undefined; available: boolean }[];
}

/**
 * @description This interface is used to represent a Rumble Studio subscription. Contains the number of seats, the source (appSumo, Stripe, ...).
 */
export interface Subscription extends Syncable {
	id: string;
	ownerId: string; // group id
	beneficiaryId: string; // group id

	name?: string;
	description?: string;
	source?: 'appsumo' | 'trial' | 'exception' | 'custom' | 'stripe'; // # stripe | pennylane | appsumo | gocardless | custom
	sourceId?: string; // id for source
	data?: string; // json string
	grantMapping?: string; // # basic, creator, pro, team, all, beta or uuidv4

	// exports
	durationExported?: number; // in seconds
	maxDurationExported?: number; // in seconds

	// seats
	usedSeats?: number;
	maxAvailableSeats?: number;

	// branding kits
	maxAvailableBrandingKits?: number;
	usedBrandingKits?: number;

	// domains
	maxAvailableDomains?: number;
	usedDomains?: number;

	// pages
	maxAvailablePages?: number;
	usedPages?: number;
}

export interface AppSumoOperation {
	invoiceItemUuid: string;
	action: string;
}

// after JSON parsing of data property
export interface SubscriptionData {
	operations?: {
		[timeStampKeys: string]: AppSumoOperation;
	};
	userCreatedTs: number;
}

// for editor prompt
export interface SubscriptionDetails {
	subscription?: Subscription;
	fromStep?: boolean;
}

export function createSubscription(params?: Partial<Subscription>) {
	return {
		...params,
	} as Subscription;
}
