export interface StripePrice {
	id: string; // price name is amount_currency and value is stripe price id}
	amount: number;
	currency: string;
	recurring?: {
		interval: string;
		interval_count: number;
	};
	metadata: { [key: string]: string };
}
export interface StripePlan {
	id: string;
	name: string;
	description: string;
	prices: StripePrice[];
	metadata: { [key: string]: string };
}

export interface StripeSubscriptions {
	data: StripeSubscriptionsData[];
}

export interface StripeSubscriptionsData {
	id?: string;
	object?: string;
	application?: any | null;
	application_fee_percent?: null;
	automatic_tax?: {
		enabled?: boolean;
	};
	billing_cycle_anchor?: number;
	billing_thresholds?: any | null;
	cancel_at?: any | null;
	cancel_at_period_end?: boolean;
	canceled_at?: any | null;
	collection_method?: string;
	created?: number;
	current_period_end?: number;
	current_period_start?: number;
	customer: string;
	days_until_due?: any | null;
	default_payment_method?: string;
	default_source?: any | null;
	default_tax_rates?: any[];
	description?: any | null;
	discount?: any | null;
	ended_at?: any | null;
	latest_invoice?: string;
	livemode?: boolean;
	metadata?: {
		order_id?: number;
	};
	next_pending_invoice_item_invoice?: any | null;
	pause_collection?: any | null;
	payment_settings?: {
		payment_method_options?: any | null;
		payment_method_types?: any | null;
	};
	pending_invoice_item_interval?: any | null;
	pending_setup_intent?: any | null;
	pending_update?: any | null;
	plan?: {
		active?: boolean;
		aggregate_usage?: any | null;
		amount?: number;
		amount_decimal?: number;
		billing_scheme?: string;
		created?: number;
		currency?: string;
		id?: string;
		interval?: string;
		interval_count?: number;
		livemode?: boolean;
		metadata?: {
			displayInApp?: boolean;
		};
		nickname?: any | null;
		object?: string;
		product?: string;
		tiers_mode?: any | null;
		transform_usage?: any | null;
		trial_period_days?: any | null;
		usage_type?: string;
	};
	quantity?: number;
	schedule?: any | null;
	start_date?: number;
	status?: string;
	test_clock?: any | null;
	transfer_data?: any | null;
	trial_end?: number;
	trial_start?: number;
	items?: {
		object?: string;
		data?: [
			{
				id?: string;
				object?: string;
				billing_thresholds?: any | null;
				created?: number;
				metadata?: any;
				price?: {
					id?: string;
					object?: string;
					active?: boolean;
					billing_scheme?: string;
					created?: number;
					currency?: string;
					livemode?: boolean;
					lookup_key?: any | null;
					metadata?: {
						charset?: string;
						content?: string;
					};
					nickname?: any | null;
					product?: string;
					recurring?: {
						aggregate_usage?: any | null;
						interval?: string;
						interval_count?: number;
						usage_type?: string;
					};
					tax_behavior?: string;
					tiers_mode?: any | null;
					transform_quantity?: any | null;
					type?: string;
					unit_amount?: number;
					unit_amount_decimal?: number;
				};
				quantity?: number;
				subscription?: string;
				tax_rates?: any[];
			}
		];
		has_more?: boolean;
		url?: string;
	};
}

export interface StripeMatchingUserSubscription {
	price: StripePrice;
	plan: StripePlan;
	status: string;
	cancelAt: number | null;
	currentPeriodEnd: number | null;
}
