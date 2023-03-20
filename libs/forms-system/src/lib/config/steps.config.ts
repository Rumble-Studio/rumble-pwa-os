import { Step } from '@rumble-pwa/mega-store';
import { Attr, AttrElement } from '@rumble-pwa/utils';
import { merge, sortBy } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export type DefaultProviderId = 'default-participant' | 'creator';

export interface Provider {
	displayName: string;
	id: DefaultProviderId | string;
	priority: number;
}

export type ButtonTarget = 'welcomeSubmit' | 'celebrate' | 'next' | 'previous' | 'submit' | 'share' | 'openRumbleApp';

//
interface BasicStepAttribute {
	// list form provider available properties
	label?: string;
	placeholder?: string;
	required?: boolean | string;
	hint?: string;
	listeningMessage?: string;
	hidden?: boolean | string;

	dontRefill?: boolean | string;

	// checked (from data)
	// value (from data)
	buttonTarget?: ButtonTarget | string;
	buttonIcon?: string;
	preventEmitting?: boolean;
	multiple?: boolean | string;

	// Attr for slider
	minimumValue?: string;
	maximumValue?: string;
	stepSize?: string;
	vertical?: string | boolean;

	// Attr for recording
	allowVideoRecording?: boolean | string;
	allowAudioRecording?: boolean | string;
	allowUploadRecording?: boolean | string;
}

// component of a stepDetail

/**
 * permissionsNeeded: permission keys needed to access attribute
 */
export interface StepAttribute extends BasicStepAttribute {
	name: string; // for serialization (ex: audio-step)
	providerId: 'creator' | 'participant' | 'host' | 'guest' | string; // Who should provide it? allow for multiple providers on the same form (we can select which one to use with the query parameter)
	kind: // text-like
	| 'shortText' // input with time limit
		| 'text' // input
		| 'textList' // string with ; separated values
		| 'paragraph' // textarea
		| 'url' // input with url validation
		| 'email' // input with email validation
		| 'message' // just a message to display (not editable)

		// number like
		| 'number' // input with regex for Real numbers
		| 'phone' // input with regex for phone numbers (not yet)
		| 'date' // input with type date

		// boolean like
		| 'checkbox' // checkbox

		// choices
		| 'mcq'
		// | 'select' // select
		// | 'checkboxList' // checkbox list
		// | 'radioList' // radio list
		// | 'radio' // radio
		| 'slider' // slider

		// media
		| 'image'
		| 'video'
		| 'audio' // means "playlist"
		| 'document'

		// display a value
		| 'display-title'
		| 'display-paragraph'
		| 'display-audio' // means "playlist"
		| 'display-image'
		| 'display-url'
		| 'display-line'
		| 'display-email-list'

		// button
		| 'button'
		| 'action-button' // does not depend on formControl state=> always clickable
		| 'buttonUrl';

	// VALUES CONSUMED BY FORM PROVIDER
	// title: string; // for display to the provider
	// description?: string; // for display to the provider
	// placeholder?: string; // for display to the provider
	// required?: true | false | string; // is it required by the provider

	default?: AttrElement; // default value

	requestOrder: number; // order in which the provider should answer this
	useForPreview?: boolean; // should this be displayed in the header
	hiddenToProvider?: boolean; // should this be hidden from the provider
	section?: string; // section to display in
	permissionsNeeded?: string[];
}

// everything needed for a step global display (independant of instance)
export interface StepDetail {
	name: string; // ex:'audio-step'
	// title: string; // ex:'Audio step'
	description?: string; // ex:'This is the audio step'
	attributes: StepAttribute[]; // ex: [{name: 'audio-step', provider: 'host', kind: 'audio', label: 'Audio request', description: 'Please provide an audio file', required: true, default: {}}]
	version: string; // '1.0.0', '1.0.1', '1.0.2'...

	menuHint: string;
	menuText: string; // => if not provided, use the title
	keyShortCut?: string;
	icon: string;
	// colors: StepColors;
	isPrivate: boolean;
}

export interface StepCategory {
	id: string;
	name: string;
	priority: number;
}

// object to hold the attributes of a step and to be drag and drop
export interface StepInstance {
	// detail of the step
	stepDetail: StepDetail;
	stepCategory: StepCategory;

	id: string;

	// filled data for the attributes
	attrs: { [key: string]: AttrElement };

	step?: Step;
	// collapsed?: boolean;
	hideInRecordingSessionList?: boolean;
}

export interface StepTemplate {
	stepKind: string;
	stepAttrs?: Attr;
}

export interface FormTemplate {
	id: string;
	stepTemplateList: StepTemplate[];
	templateName: string;
	templateDescription?: string;
}

// FORM TEMPLATES START //

const BLANK_INTERVIEW: FormTemplate = {
	id: 'blank-interview',
	stepTemplateList: [],
	templateName: 'Blank interview',
	templateDescription: 'Start from scratch!',
};

const SIMPLE_AUDIO_INTERVIEW: FormTemplate = {
	id: 'simple-audio-interview',
	stepTemplateList: [
		{ stepKind: 'welcome-step' },
		{
			stepKind: 'audio-step',
		},
		{ stepKind: 'audio-step' },
		{ stepKind: 'termination' },
	],
	templateName: 'Simple audio interview',
	templateDescription: 'Ready to ask 2 audio questions and customise the welcome and closing messages.',
};

const PODCAST_INTERVIEW_EPISODE: FormTemplate = {
	id: 'podcast-interview-episode',
	stepTemplateList: [
		{ stepKind: 'welcome-step' },
		{
			stepKind: 'guest-info',
			stepAttrs: {
				hideTwitterInput: true,
			},
		},
		{ stepKind: 'audio-step' },
		{ stepKind: 'audio-step' },
		{ stepKind: 'termination' },
	],
	templateName: 'Podcast interview episode',
	templateDescription: 'Ask 2 audio questions and guest information.',
};

export const FORM_TEMPLATES: FormTemplate[] = [BLANK_INTERVIEW, SIMPLE_AUDIO_INTERVIEW, PODCAST_INTERVIEW_EPISODE];

// FORM TEMPLATES END //

export const KIND_COPIABLE = [
	// text-like
	'shortText', // input with time limit
	'text', // input
	'textList', // string with ; separated values
	'paragraph', // textarea
	'url', // input with url validation
	'email', // input with email validation

	// number like
	'number', // input with regex for Real numbers
	'phone', // input with regex for phone numbers (not yet)
	'date', // input with type date
	'checkbox', // checkbox

	// media
	'image',

	// 'video', -> recording playlist could interfere with each other
	// 'audio', -> recording playlist could interfere with each other
];

export const STEP_CATEGORIES = {
	'classic-requests': {
		id: 'classic-requests',
		name: 'Standard requests',
		priority: 0,
	},
	'simple-messages': {
		id: 'simple-messages',
		name: 'Messages & advice',
		priority: 1,
	},
	'advanced-requests': {
		id: 'advanced-requests',
		name: 'Advanced requests',
		priority: 2,
	},
	'private-steps': {
		id: 'private-steps',
		name: 'Private elements',
		priority: 3,
	},
	'system-steps': {
		id: 'system-steps',
		name: 'System steps',
		priority: 4,
	},
};

// in order to add StepAttribute for the guest and the one for host missing from the conversion of Spec Attr.

export const DEFAULT_PROVIDERS: Provider[] = [
	{
		displayName: 'Creator',
		id: 'creator',
		priority: 0,
	},
	{
		displayName: 'Participant (preview)',
		id: 'default-participant',
		priority: 1,
	},
];

const UNKNOWN_STEP_INSTANCE_NAME = 'unknown-step';

const _ALL_STEP_INSTANCES: StepInstance[] = [
	// audio-step
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-audio-step',
		stepCategory: STEP_CATEGORIES['classic-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] playlist id
				{
					name: 'playlistid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'audio',
					label: 'Audio message',
					hint: 'Add an audio message to the step for the participant.',

					allowVideoRecording: true,
					allowAudioRecording: true,
					allowUploadRecording: true,
				},

				// [creator] allowAudioRecording
				{
					name: 'allowAudioRecording',
					providerId: 'creator',
					requestOrder: 0.11,
					kind: 'checkbox',
					label: 'Allow audio answer',
					default: true,
				},
				// [creator] allowVideoRecording
				{
					name: 'allowVideoRecording',
					providerId: 'creator',
					requestOrder: 0.12,
					kind: 'checkbox',
					label: 'Allow video answer',
					default: false,
				},
				// [creator] allowVideoRecording
				{
					name: 'allowUploadRecording',
					providerId: 'creator',
					requestOrder: 0.13,
					kind: 'checkbox',
					label: 'Allow uploading files',
					default: true,
				},

				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',
					default: false,
				},

				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] display audio
				{
					name: 'displayAudio',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-audio',
					label: '@creator#playlistid',
					section: 'host',
				},
				// [default-participant] audioWasPlayed (hidden)
				{
					name: 'audioWasPlayed',
					providerId: 'default-participant',
					requestOrder: 1000,
					kind: 'checkbox',
					label: 'Audio was played',
					default: false,
					section: 'guest',
					hiddenToProvider: true,
				},
				// playlistid
				{
					name: 'playlistid',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'audio',
					label: 'Audio answer',
					section: 'guest',
					required: '@creator#required',

					allowVideoRecording: '@creator#allowVideoRecording',
					allowAudioRecording: '@creator#allowAudioRecording',
					allowUploadRecording: '@creator#allowUploadRecording',
				},
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'audio-step',
			menuHint: 'Insert a recording question for the guest',
			menuText: 'Recording request',
			icon: 'record_voice_over',
			isPrivate: false,
		},
	},
	// welcome-step
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-' + 'welcome-step',
		stepCategory: STEP_CATEGORIES['simple-messages'],
		stepDetail: {
			attributes: [
				// [creator] playlistid
				{
					name: 'playlistid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'audio',
					label: 'Audio message',
					hint: 'Add an audio message to welcome the participant.',

					allowVideoRecording: true,
					allowAudioRecording: true,
					allowUploadRecording: true,
				},
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Greeting title',
					hint: 'Add a title at the top of the welcome step.',
					// required: true,
					default: 'Welcome',
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Greeting message',
					hint: 'Add a message on the first page of the interview.',
					default:
						"Thank you for your interest in our show. Please find a quiet place before recording and let's get ready to rumble.",
				},
				// [creator] imageid
				{
					name: 'imageid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'image',
					label: 'Image decoration',
					hint: 'Add an image to decorate your first page.',
				},
				// [creator] force anonymous flow
				{
					name: 'onlyAnonymousFlow',
					providerId: 'creator',
					requestOrder: 1,
					kind: 'checkbox',
					// hidden: '@creator#hideAnonymousFlow',
					label: 'Only anonymous participant option',
					default: false,
					required: false,
				},
				// [creator] allow anonymous flow
				{
					name: 'hideAnonymousFlow',
					providerId: 'creator',
					requestOrder: 2,
					kind: 'checkbox',
					hidden: '@creator#onlyAnonymousFlow',
					label: 'Hide anonymous participant option',
					default: true,
					required: false,
				},

				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] display audio
				{
					name: 'displayAudio',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-audio',
					label: '@creator#playlistid',
					section: 'host',
				},
				// [default-participant] display image
				{
					name: 'displayImage',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'display-image',
					label: '@creator#imageid',
					section: 'host',
				},

				// [default-participant] button "participate anonymously"
				{
					name: 'submitAnonymousBtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'action-button',
					label: 'Participate anonymously',
					section: 'identification',
					buttonTarget: 'welcomeAnonymousSubmit',
					buttonIcon: 'no_accounts',
					// hidden: '@creator#hideAnonymousFlow',
					hidden: '&OR::@creator#hideAnonymousFlow|@creator#onlyAnonymousFlow',

					// hidden: ['@creator#hideAnonymousFlow', '@creator#onlyAnonymousFlow'],
					// hiddenLogicGate: 'OR',
				},

				// [default-participant] button "participate" (only anonymous)
				{
					name: 'submitAnonymousBtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'action-button',
					label: 'Participate',
					section: 'identification',
					buttonTarget: 'welcomeAnonymousSubmit',
					buttonIcon: 'start',
					hidden: '&NOT::@creator#onlyAnonymousFlow',
					// hiddenLogicGate: 'NOT',
				},

				// [default-participant] display line
				{
					name: 'displayLine',
					providerId: 'default-participant',
					requestOrder: 3,
					kind: 'display-line',
					section: 'identification',
					// hidden: '@creator#hideAnonymousFlow',
					hidden: '&OR::@creator#hideAnonymousFlow|@creator#onlyAnonymousFlow',
					// hidden: ['@creator#hideAnonymousFlow', '@creator#onlyAnonymousFlow'],
					// hiddenLogicGate: 'OR',
				},
				// [default-participant] display "or"
				{
					name: 'displayOr',
					providerId: 'default-participant',
					requestOrder: 4,
					kind: 'message',
					label: 'or enter your email to make any rectifications later',
					section: 'identification',
					// hidden: '@creator#hideAnonymousFlow',
					hidden: '&OR::@creator#hideAnonymousFlow|@creator#onlyAnonymousFlow',
					// hidden: ['@creator#hideAnonymousFlow', '@creator#onlyAnonymousFlow'],
					// hiddenLogicGate: 'OR',
				},
				// [default-participant] email
				{
					name: 'participantEmail',
					providerId: 'default-participant',
					requestOrder: 8,
					kind: 'email',
					section: 'identification',
					label: 'Your email',
					placeholder: 'Ex: emile.zola@rougon.com',
					// hint: 'We will send you a simple email (but no marketing material).',
					required: true,
					preventEmitting: true,

					hidden: '@creator#onlyAnonymousFlow',
				},
				// [default-participant] button
				{
					name: 'submitBtn',
					providerId: 'default-participant',
					requestOrder: 9,
					kind: 'button',
					label: "Let's go",
					section: 'identification',
					buttonTarget: 'welcomeSubmit',
					buttonIcon: 'start',

					hidden: '@creator#onlyAnonymousFlow',
				},
			],
			version: '3.0.0',
			name: 'welcome-step',
			menuHint: 'Add a customised message for your guests at the beginning of your interview.',
			menuText: 'Welcome message',
			icon: 'meeting_room',
			isPrivate: false,
		},
		hideInRecordingSessionList: true,
	},
	// cta
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-' + 'call-to-action',
		stepCategory: STEP_CATEGORIES['advanced-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					required: true,

					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] image id
				{
					name: 'imageid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'image',
					label: 'Image decoration',
					hint: 'Add an image to decorate your step.',
				},
				// [creator] button text
				{
					name: 'buttontext',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'shortText',
					label: 'Button text',
					hint: 'Text to be shown within the button.',
					required: true,
					default: 'Click me!',
				},
				// [creator] cta url
				{
					name: 'url',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'url',
					label: 'Website link',
					hint: 'Link to be opened when the button is clicked on by the participant.',
					required: true,
				},

				// [creator] playlist id
				{
					name: 'playlistid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'audio',
					label: 'Audio message',
					hint: 'Add an audio message to the step for the participant.',

					allowVideoRecording: true,
					allowAudioRecording: true,
					allowUploadRecording: true,
				},

				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] display audio
				{
					name: 'displayAudio',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-audio',
					label: '@creator#playlistid',
					section: 'host',
				},
				// [default-participant] display image
				{
					name: 'displayImage',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'display-image',
					label: '@creator#imageid',
					section: 'host',
				},
				// [default-participant] button
				{
					name: 'ctaButton',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'buttonUrl',
					label: '@creator#buttontext',
					// hint: '@creator#url',
					section: 'host',
					buttonTarget: '@creator#url',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 3,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'call-to-action',
			menuHint: 'Add a call to action to make your guest visit a web page or download a file.',
			menuText: 'Call to action',
			icon: 'touch_app',
			isPrivate: false,
		},
	},
	// text-step
	{
		attrs: {}, // empty attributes for sources
		id: 'dad-' + 'text-step',
		stepCategory: STEP_CATEGORIES['classic-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					required: true,
					useForPreview: true,
					// default: 'A nice question',
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] text field settings
				{
					name: 'textField',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'shortText',
					label: 'Text field name',
					hint: 'How is the text field called?',
					required: false,
				},
				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',
					default: false,
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] text field input
				{
					name: 'textanswer', // retro compatibility
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'shortText',
					label: '@creator#textField',
					required: '@creator#required',
					section: 'guest',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'text-step',
			menuHint: 'Ask for a text field (e.g. name, favorite food...)',
			menuText: 'Text request',
			icon: 'rate_review',
			isPrivate: false,
		},
	},

	// paragraph-step
	{
		attrs: {}, // empty attributes for sources
		id: 'dad-' + 'paragraph-step',
		stepCategory: STEP_CATEGORIES['classic-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					required: true,
					useForPreview: true,
					// default: 'A nice question',
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] text field settings
				{
					name: 'textField',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'shortText',
					label: 'Text field name',
					hint: 'How is the paragraph field called?',
					required: false,
				},
				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',
					default: false,
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] text field input
				{
					name: 'textanswer',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'paragraph',
					label: '@creator#textField',
					required: '@creator#required',
					section: 'guest',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'paragraph-step',
			menuHint: 'Ask for a paragraph (e.g. bio, favorite quote...)',
			menuText: 'Paragraph request',
			icon: 'view_headline',
			isPrivate: false,
		},
	},

	// upload-picture
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-' + 'upload-picture',
		stepCategory: STEP_CATEGORIES['classic-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					required: true,
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',
					default: false,
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] upload image
				{
					name: 'imageid',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'image',
					label: 'Upload an image',
					section: 'guest',
					required: '@creator#required',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'upload-picture',
			menuHint: 'Ask your guest for a picture',
			menuText: 'Image request',
			icon: 'mms',
			isPrivate: false,
		},
	},
	// upload-doc
	{
		attrs: {}, // empty attributes for sources
		id: 'dad-' + 'upload-document',
		stepCategory: STEP_CATEGORIES['advanced-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					required: true,
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',
					default: false,
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] upload image
				{
					name: 'documentid',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'document',
					label: 'Upload a document',
					section: 'guest',
					required: '@creator#required',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'upload-document',
			menuHint: 'Ask your guest for a document',
			menuText: 'Document request',
			icon: 'file_present',
			isPrivate: false,
		},
	},
	// recording-instructions
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-' + 'recording-instructions',
		stepCategory: STEP_CATEGORIES['simple-messages'],
		stepDetail: {
			attributes: [
				// [creator] display title
				{
					name: 'displayTitle',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'display-title',
					label: 'Instructions for the guest(s)',
				},
				// [creator] display description
				{
					name: 'displayDescription',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'display-paragraph',
					label: "This step will give a list of instructions for the guest(s) to record in the best conditions. You can't customise this step. If you prefer you can use a message step instead.",
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-title',
					label: 'Checklist for smooth recording',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-paragraph',
					label: "<ul><li>Go to a quiet place</li>\
<li>Close the windows and switch off the fans, speakers, ...</li>\
<br><li>Prevent interruption:</li>\
<ul><li>Turn off your phone</li>\
<li>Tell people you'll be recording</li></ul>\
<br><li>Record:</li>\
<ul><li>Use an external microphone if possible</li>\
<li>Keep a constant distance from the microphone</li>\
<li>Avoid moving or touching objects</li></ul></ul>",
					section: 'host',
				},

				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 3,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'recording-instructions',
			menuHint: 'Add recording advice to help your guest record in the best conditions.',
			menuText: 'Recording advice',
			icon: 'list_alt',
			isPrivate: false,
		},
	},
	// unknown
	{
		attrs: {}, // empty attributes for sources
		id: 'system-' + 'unknown-step',
		stepCategory: STEP_CATEGORIES['system-steps'],
		stepDetail: {
			attributes: [
				// [creator] not available
				{
					name: 'Error',
					providerId: 'creator',
					requestOrder: -100,
					kind: 'message',
					label: 'Step unknown',
					hint: 'This step is not available right now, we are working on it ;)',
				},
				// [default-participant] not available
				{
					name: 'Error',
					providerId: 'default-participant',
					requestOrder: -100,
					kind: 'message',
					label: 'Step unknown',
					hint: 'This step is not available right now, we are working on it ;)',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 3,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: UNKNOWN_STEP_INSTANCE_NAME,
			menuHint: '',
			menuText: '',
			icon: 'list_alt',
			isPrivate: true,
		},
	},
	// guest-info
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-' + 'guest-info',
		stepCategory: STEP_CATEGORIES['advanced-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					default: 'Your information',
					required: true,
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'checkbox',
					hidden: true,
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',

					default: false,
				},

				// [creator] checkbox "required 'firstname'"
				{
					name: 'requiredFirstname',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Firstname field required*',
					default: '@creator#required',
					requestOrder: 1,
				},
				// [creator] checkbox "required 'lastname'
				{
					name: 'requiredLastname',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Lastname field required*',
					default: '@creator#required',
					requestOrder: 1.1,
				},

				// [creator] checkbox "Hide 'image'"
				{
					name: 'hideAvatar',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Hide profile picture field.',
					default: false,
					requestOrder: 2,
				},
				// [creator] checkbox "required 'image'"
				{
					name: 'requiredAvatar',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Profile picture field required*',
					hidden: '@creator#hideAvatar',
					default: '@creator#required',
					requestOrder: 2.1,
				},
				// [creator] checkbox "Hide 'twitter'"
				{
					name: 'hideTwitterInput',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Hide Twitter profile field.',
					default: false,
					hidden: false,
					requestOrder: 4,
				},
				// [creator] checkbox "required 'twitter'"
				{
					name: 'requiredTwitter',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Twitter field required*',
					hidden: '@creator#hideTwitterInput',
					default: '@creator#required',
					requestOrder: 4.1,
				},
				// [creator] checkbox "Hide 'linkedin'"
				{
					name: 'hideLinkedinInput',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Hide Linkedin profile field.',
					default: false,
					requestOrder: 3,
				},
				// [creator] checkbox "required 'linkedin'"
				{
					name: 'requiredLinkedin',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Linkedin field required*',
					hidden: '@creator#hideLinkedinInput',
					default: '@creator#required',
					requestOrder: 3.1,
				},
				// [creator] checkbox "Hide 'website'"
				{
					name: 'hideWebsiteInput',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Hide website field.',
					default: false,
					requestOrder: 5,
				},
				// [creator] checkbox "required 'company website'"
				{
					name: 'requiredWebsite',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Website field required*',
					hidden: '@creator#hideWebsiteInput',
					default: '@creator#required',
					requestOrder: 5.1,
				},

				// [creator] checkbox "Hide 'bio'"
				{
					name: 'hideBioInput',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Hide biography field.',
					default: false,
					requestOrder: 6,
				},
				// [creator] checkbox "required 'bio'"
				{
					name: 'requiredBio',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Biography field required*',
					hidden: '@creator#hideBioInput',
					default: '@creator#required',
					requestOrder: 6.1,
				},

				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] firstname
				{
					name: 'firstname',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'shortText',
					label: 'Firstname',
					section: 'guest',
					required: '@creator#requiredFirstname',
				},
				// [default-participant] lastname
				{
					name: 'lastname',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'shortText',
					label: 'Lastname',
					section: 'guest',
					required: '@creator#requiredLastname',
				},
				// [default-participant] display text 'Profile picure'
				{
					name: 'displayProfilePictureText',
					providerId: 'default-participant',
					requestOrder: 2.4,
					kind: 'display-paragraph',
					section: 'guest',
					label: 'Profile picture',
					hidden: '@creator#hideAvatar',
				},
				// [default-participant] upload image
				{
					name: 'imageid',
					providerId: 'default-participant',
					requestOrder: 2.5,
					kind: 'image',
					label: 'Upload an image',
					section: 'guest',
					required: '@creator#requiredAvatar',
					hidden: '@creator#hideAvatar',
				},
				// [default-participant] linkedInLink
				{
					name: 'linkedInLink',
					providerId: 'default-participant',
					requestOrder: 3,
					kind: 'url',
					label: 'Your linkedin profile URL',
					section: 'guest',
					required: '@creator#requiredLinkedin',
					hidden: '@creator#hideLinkedinInput',
				},
				// [default-participant] twitterLink
				{
					name: 'twitterLink',
					providerId: 'default-participant',
					requestOrder: 4,
					kind: 'url',
					label: 'Your twitter profile URL',
					section: 'guest',
					required: '@creator#requiredTwitter',
					hidden: '@creator#hideTwitterInput',
				},
				// [default-participant] companyLink
				{
					name: 'companyLink',
					providerId: 'default-participant',
					requestOrder: 5,
					kind: 'url',
					label: 'Your website URL',
					section: 'guest',
					required: '@creator#requiredWebsite',
					hidden: '@creator#hideWebsiteInput',
				},

				// [default-participant] autoBiography
				{
					name: 'autoBiography',
					providerId: 'default-participant',
					requestOrder: 6,
					kind: 'paragraph',
					label: 'Tell us a little bit about yourself',
					section: 'guest',
					required: '@creator#requiredBio',
					hidden: '@creator#hideBioInput',
				},

				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 7,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'guest-info',
			menuHint: 'Get info like firstname, lastname and social links from your guest.',
			menuText: 'Guest info',
			icon: '3p',
			isPrivate: false,
		},
	},
	// share-this-form
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-' + 'share-this-form',
		stepCategory: STEP_CATEGORIES['advanced-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					required: true,
					useForPreview: true,
					default: 'Share this interview',
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
					default: 'Do you know someone else who would enjoy participating in this interview? Invite them now!',
				},
				// [creator] playlist id
				{
					name: 'playlistid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'audio',
					label: 'Audio message',
					hint: 'Add an audio message to the step for the participant.',

					allowVideoRecording: true,
					allowAudioRecording: true,
					allowUploadRecording: true,
				},
				// [creator] image id
				{
					name: 'imageid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'image',
					label: 'Image decoration',
					hint: 'Add an image to decorate your step.',
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] display audio
				{
					name: 'displayAudio',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-audio',
					label: '@creator#playlistid',
					section: 'host',
				},
				// [default-participant] display image
				{
					name: 'displayImage',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'display-image',
					label: '@creator#imageid',
					section: 'host',
				},
				// [default-participant] display-email-list
				{
					name: 'displayEmailList',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'display-email-list',
					label: '@default-participant#emails',
					section: 'guest',
				},
				// [default-participant] text field input
				{
					name: 'emails', // retro compatibility
					providerId: 'default-participant',
					requestOrder: 3,
					kind: 'email',
					label: 'Email',
					section: 'guest',
					preventEmitting: true,
					dontRefill: true,
				},
				// [default-participant] button OK
				{
					name: 'Sharebtn',
					providerId: 'default-participant',
					requestOrder: 4,
					kind: 'button',
					label: 'Share this interview',
					section: 'guest',
					buttonTarget: 'share',
					buttonIcon: 'share',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 5,
					kind: 'button',
					label: 'Done',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'share-this-form',
			menuHint: 'Insert a sharing step to allow your guest to invite others.',
			menuText: 'Guest referral',
			icon: 'share',
			isPrivate: false,
		},
	},
	// message-step
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-' + 'message-step',
		stepCategory: STEP_CATEGORIES['simple-messages'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					required: true,
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] playlist id
				{
					name: 'playlistid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'audio',
					label: 'Audio message',
					hint: 'Add an audio message to the step for the participant.',

					allowVideoRecording: true,
					allowAudioRecording: true,
					allowUploadRecording: true,
				},
				// [creator] image id
				{
					name: 'imageid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'image',
					label: 'Image decoration',
					hint: 'Add an image to decorate your step.',
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] display audio
				{
					name: 'displayAudio',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-audio',
					label: '@creator#playlistid',
					section: 'host',
				},
				// [default-participant] display image
				{
					name: 'displayImage',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'display-image',
					label: '@creator#imageid',
					section: 'host',
				},

				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'message-step',
			menuHint: 'Add a customised message for your guests.',
			menuText: 'Message step',
			icon: 'message',
			isPrivate: false,
		},
	},
	// video-step
	{
		attrs: {}, // empty attributes for sources
		id: 'prosemirror-' + 'video-step',
		stepCategory: STEP_CATEGORIES['classic-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					required: true,
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] playlist id
				{
					name: 'playlistid',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'audio',
					label: 'Audio message',
					hint: 'Add an audio message to the step for the participant.',

					allowVideoRecording: true,
					allowAudioRecording: true,
					allowUploadRecording: true,
				},

				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',

					default: false,
				},

				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] display audio
				{
					name: 'displayAudio',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-audio',
					label: '@creator#playlistid',
					section: 'host',
				},
				// [default-participant] video request
				{
					name: 'videoid', // retro compatibility
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'video',
					label: 'Upload a video',
					required: '@creator#required',
					section: 'guest',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'video-step',
			menuHint: 'Request a video from your participant.',
			menuText: 'Video file',
			icon: 'videocam',
			isPrivate: false,
		},
	},
	// slider-step
	{
		attrs: {}, // empty attributes for sources
		id: 'dad-' + 'slider',
		stepCategory: STEP_CATEGORIES['classic-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					requestOrder: -2,
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step.',
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					requestOrder: -1,
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title.',
				},
				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',
					default: false,
				},
				// [creator] min value
				{
					name: 'sliderMin',
					providerId: 'creator',
					requestOrder: 1,
					kind: 'number',
					label: 'Minimum value',
					required: true,
					hint: 'Define the minimum value (inclusive)',
					default: 0,
				},
				// [creator] max value
				{
					name: 'sliderMax',
					providerId: 'creator',
					requestOrder: 2,
					kind: 'number',
					label: 'Maximum value',
					required: true,
					hint: 'Define the maximum value (inclusive)',
					default: 10,
				},
				// [creator] step size
				{
					name: 'sliderStepSize',
					providerId: 'creator',
					requestOrder: 3,
					kind: 'number',
					label: 'Step size',
					required: true,
					hint: 'Define the step of the value selector',
					default: 1,
				},
				// [creator] vertical
				{
					name: 'sliderVertical',
					providerId: 'creator',
					requestOrder: 4,
					kind: 'checkbox',
					label: 'Display the slider vertically',
					default: false,
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] slider
				{
					name: 'slidervalue',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'slider',
					label: 'Pick a value',
					required: '@creator#required',
					section: 'guest',
					minimumValue: '@creator#sliderMin',
					maximumValue: '@creator#sliderMax',
					stepSize: '@creator#sliderStepSize',
					vertical: '@creator#sliderVertical',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'slider-step',
			menuHint: 'Insert a slider to request a value',
			menuText: 'Slider request',
			icon: 'linear_scale',
			isPrivate: false,
		},
	},
	// number step
	{
		attrs: {}, // empty attributes for sources
		id: 'dad-' + 'number-request',
		stepCategory: STEP_CATEGORIES['classic-requests'],
		stepDetail: {
			attributes: [
				// [creator] step title
				{
					name: 'steptitle',
					providerId: 'creator',
					kind: 'text',
					label: 'Step title',
					hint: 'Add a title at the top of the step',
					required: true,
					requestOrder: -2,
					useForPreview: true,
				},
				// [creator] step description
				{
					name: 'stepdescription',
					providerId: 'creator',
					kind: 'paragraph',
					label: 'Step description',
					hint: 'Add a description below the step title',
					requestOrder: -1,
				},
				// [creator] text field
				{
					name: 'numberField',
					providerId: 'creator',
					requestOrder: 0,
					kind: 'shortText',
					label: 'Field name (optional)',
					hint: 'How is the number field called (age, price, ...)?',
				},
				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',
					default: false,
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#steptitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepdescription',
					section: 'host',
				},
				// [default-participant] number field input
				{
					name: 'numberanswer', // retro compatibility
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'number',
					label: '@creator#numberField',
					required: '@creator#required',
					section: 'guest',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'number-request',
			menuHint: 'Ask your guest a number',
			menuText: 'Number request',
			icon: 'dialpad',
			isPrivate: false,
		},
	},
	// termination step
	{
		attrs: {}, // empty attributes for sources
		id: 'dad-' + 'termination',
		stepCategory: STEP_CATEGORIES['simple-messages'],
		stepDetail: {
			attributes: [
				// [creator] title
				{
					name: 'stepTitle',
					providerId: 'creator',
					kind: 'text',
					label: 'Closing message header',
					hint: 'Customize the header of the last interview step.',
					required: true,
					default: 'Thank you',
					requestOrder: 1,
					useForPreview: true,
				},
				// [creator] description
				{
					name: 'stepDescription',
					providerId: 'creator',
					kind: 'paragraph',
					label: 'Closing message',
					hint: 'Add a thank note to the last interview step.',

					default: 'Thank you for taking the time to complete this form.',
					requestOrder: 2,
				},

				// [creator] add audio
				{
					name: 'playlistid',
					providerId: 'creator',
					kind: 'audio',
					label: 'Audio message',

					requestOrder: 2.5,

					allowVideoRecording: true,
					allowAudioRecording: true,
					allowUploadRecording: true,
				},
				// [creator] button text
				{
					name: 'buttontext',
					providerId: 'creator',
					requestOrder: 3,
					kind: 'shortText',
					label: 'Optional call to action text',
					hint: 'Text for your optional call to action.',
					placeholder: 'Click me',
				},
				// [creator] cta url
				{
					name: 'url',
					providerId: 'creator',
					requestOrder: 4,
					kind: 'url',
					label: 'Website link (starts with https://)',
					hint: 'Link to be opened when your custom button is clicked on by the participant.',
				},

				// [creator] checkbox "Hide 'Try Rumble'"
				{
					name: 'hideTryRumbleButton',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Hide "Try Rumble Studio" button.',

					default: false,
					requestOrder: 5,
					permissionsNeeded: ['whitelabelling'],
				},
				// [creator] checkbox "Hide 'Celebrate again'"
				{
					name: 'hideCelebrateAgainButton',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Hide "Celebrate again" button.',

					default: false,
					requestOrder: 6,
				},

				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#stepTitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepDescription',
					section: 'host',
				},
				// [default-participant] display audio
				{
					name: 'displayAudio',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'display-audio',
					label: '@creator#playlistid',
					section: 'host',
				},
				// [default-participant] display image
				{
					name: 'displayImage',
					providerId: 'default-participant',
					requestOrder: 1,
					kind: 'display-image',
					label: '@creator#imageid',
					section: 'host',
				},
				// [default-participant] button
				{
					name: 'ctaButton',
					providerId: 'default-participant',
					requestOrder: 1.5,
					kind: 'buttonUrl',
					label: '@creator#buttontext',
					// hint: '@creator#url',
					section: 'host',
					buttonTarget: '@creator#url',
				},

				// [default-participant] button OK
				{
					name: 'GoBackbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'Go back',
					section: 'guest',
					buttonTarget: 'previous',
					buttonIcon: 'arrow_back',
				},
				// [default-participant] button Celebrate again
				{
					name: 'CelebrateAgainBtn',
					providerId: 'default-participant',
					requestOrder: 3,
					kind: 'button',
					label: 'Celebrate again',
					section: 'guest',
					buttonTarget: 'celebrate',
					buttonIcon: 'sentiment_very_satisfied',
					hidden: '@creator#hideCelebrateAgainButton',
				},
				// [default-participant] button Use Rumble Studio
				{
					name: 'TryRumbleBtn',
					providerId: 'default-participant',
					requestOrder: 4,
					kind: 'button',
					label: 'Try Rumble Studio',
					section: 'guest',
					buttonTarget: 'openRumbleApp',
					buttonIcon: 'science',
					hidden: '@creator#hideTryRumbleButton',
				},
			],
			version: '3.0.0',
			name: 'termination',
			menuHint: 'Customize the last step of your interview.',
			menuText: 'Closing message',
			icon: 'waving_hand',
			isPrivate: false,
		},
		hideInRecordingSessionList: true,
	},
	// qcm
	{
		attrs: {}, // empty attributes for sources
		id: 'dad-' + 'qcm',
		stepCategory: STEP_CATEGORIES['advanced-requests'],
		stepDetail: {
			attributes: [
				// [creator] Question (= title)
				{
					name: 'stepQuestion',
					providerId: 'creator',
					kind: 'text',
					label: 'Question',
					hint: 'Enter the question for your participant.',
					required: true,
					requestOrder: -2,
					useForPreview: true,
				},
				// [creator] description
				{
					name: 'stepDescription',
					providerId: 'creator',
					kind: 'paragraph',
					label: 'Hint',
					hint: 'Give more details if needed.',
					default: '',
					requestOrder: -1,
				},
				// [creator] required (checkbox)
				{
					name: 'multipleChoicesAllowed',
					providerId: 'creator',
					kind: 'checkbox',
					label: 'Participant can select multiple choice?',
					hint: '',

					default: true,
					requestOrder: 0,
				},
				// [creator] MCQ options
				{
					name: 'stepOptions',
					providerId: 'creator',
					kind: 'textList',
					label: 'Options',
					hint: '',

					requestOrder: 1,
				},
				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#stepQuestion',
					section: 'host',
					default: 'Select your answers',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepDescription',
					section: 'host',
				},
				// [default-participant] mcq
				{
					name: 'stepanswer',
					providerId: 'default-participant',
					requestOrder: 0,
					kind: 'mcq',
					label: '@creator#stepOptions',
					section: 'guest',
					multiple: '@creator#multipleChoicesAllowed',
				},
				// [default-participant] button OK
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 7,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'qcm',
			menuHint: 'Add a question with predefined options.',
			menuText: 'Multiple choice question',
			icon: 'ballot',
			isPrivate: false,
		},
	},
	// checkbox step
	{
		attrs: {}, // empty attributes for sources
		id: 'dad-' + 'checkbox',
		stepCategory: STEP_CATEGORIES['simple-messages'],
		stepDetail: {
			attributes: [
				// [creator] title
				{
					name: 'stepTitle',
					providerId: 'creator',
					kind: 'text',
					label: 'Checkbox request header',
					hint: 'Customize the header of the checkbox step.',
					required: true,
					default: '',
					requestOrder: 1,
					useForPreview: true,
				},
				// [creator] description
				{
					name: 'stepDescription',
					providerId: 'creator',
					kind: 'paragraph',
					label: 'Checkbox request description',
					hint: 'Add a description for the checkbox step.',
					placeholder: 'By checking this box, you agree to ...',
					requestOrder: 2,
				},
				// [creator] checkbox text
				{
					name: 'checkboxText',
					providerId: 'creator',
					kind: 'text',
					label: 'Checkbox text',
					placeholder: 'I agree to the above terms and conditions',
					requestOrder: 3,
				},
				// [creator] answer required
				{
					name: 'required',
					providerId: 'creator',
					requestOrder: 10,
					kind: 'checkbox',
					label: 'Answer required',
					hint: 'If you check this box, the guest will have to answer this step to proceed to the next step.',
					default: false,
				},

				// [default-participant] display title
				{
					name: 'displayTitle',
					providerId: 'default-participant',
					requestOrder: -2,
					kind: 'display-title',
					label: '@creator#stepTitle',
					section: 'host',
				},
				// [default-participant] display description
				{
					name: 'displayDescription',
					providerId: 'default-participant',
					requestOrder: -1,
					kind: 'display-paragraph',
					label: '@creator#stepDescription',
					section: 'host',
				},

				// [participant] checkbox
				{
					name: 'checked',
					providerId: 'default-participant',
					kind: 'checkbox',
					label: '@creator#checkboxText',
					default: false,
					requestOrder: 0,
					required: '@creator#required',
					section: 'guest',
				},
				{
					name: 'OKbtn',
					providerId: 'default-participant',
					requestOrder: 2,
					kind: 'button',
					label: 'OK',
					section: 'guest',
					buttonTarget: 'next',
					buttonIcon: 'done',
				},
			],
			version: '3.0.0',
			name: 'checkbox',
			menuHint: 'Ask your guest to check a box.',
			menuText: 'Check a box',
			icon: 'check_box',
			isPrivate: false,
		},
		hideInRecordingSessionList: true,
	},
];

export const ALL_STEP_INSTANCES: StepInstance[] = _ALL_STEP_INSTANCES.map((stepInstance) => {
	const orderedAttributeStep: StepInstance = {
		...stepInstance,
	};
	orderedAttributeStep.stepDetail.attributes = sortBy(orderedAttributeStep.stepDetail.attributes, 'requestOrder');
	return orderedAttributeStep;
});

export function generateStepFromDetails(
	stepDetail: StepDetail,
	attrs: {
		[key: string]: AttrElement;
	},
	formId: string,
	rank: number,
	stepId?: string,
	// collapsed?: boolean,
	state?: 'default' | 'deleted' | 'archived'
) {
	const defaultAttrsValues = stepDetail.attributes
		.map((stepAttribute: StepAttribute) => {
			return {
				[stepAttribute.name]: stepAttribute.default,
			};
		})
		.reduce((acc, cur) => {
			return { ...acc, ...cur };
		}, {});

	const step: Step = {
		id: stepId ?? uuidv4(),
		rank,
		formId: formId,
		attrs: JSON.stringify({
			scriptId: formId, // historical reason
			...defaultAttrsValues,
			...attrs,
		}),
		kind: stepDetail.name,
		// collapsed: collapsed ?? true,
		state: state ?? 'default',
	};
	return step;
}

export function convertStepInstanceToStep(stepInstance: StepInstance, formId: string, rank: number) {
	const defaultAttrsValues = stepInstance.stepDetail.attributes
		.map((stepAttribute: StepAttribute) => {
			return {
				[stepAttribute.name]: stepAttribute.default,
			};
		})
		.reduce((acc, cur) => {
			return { ...acc, ...cur };
		}, {});

	const step: Step = {
		id: stepInstance.id ?? uuidv4(),
		rank,
		formId: formId,
		attrs: JSON.stringify({
			scriptId: formId, // historical reason
			...defaultAttrsValues,
			...stepInstance.attrs,
		}),
		kind: stepInstance.stepDetail.name,
	};
	return step;
}

export function convertStepToStepInstance(
	step: Step,
	options?: {
		// collapsed?: boolean;
		extraAttrs?: { providerId: string; attrs: { [key: string]: AttrElement } };
	}
) {
	let stepInstance = ALL_STEP_INSTANCES.find((stepInstance: StepInstance) => stepInstance.stepDetail.name === step.kind);
	if (!stepInstance) {
		stepInstance = ALL_STEP_INSTANCES.find(
			(stepInstance: StepInstance) => stepInstance.stepDetail.name === UNKNOWN_STEP_INSTANCE_NAME
		);
	}

	if (!stepInstance) {
		throw new Error('Step not found');
	}

	const creatorAttrs = JSON.parse(step.attrs);
	// add "creator." to each key
	const creatorAttrsWithPrefix = Object.keys(creatorAttrs).reduce((acc, cur) => {
		return {
			...acc,
			['@creator#' + cur]: creatorAttrs[cur],
		};
	}, {});
	let extraAttrs: {
		[key: string]: AttrElement;
	} = {};
	let extraAttrsWithPrefix: {
		[key: string]: AttrElement;
	} = {};
	if (options?.extraAttrs) {
		extraAttrs = options.extraAttrs.attrs;
		extraAttrsWithPrefix = Object.keys(extraAttrs).reduce((acc, cur) => {
			return {
				...acc,
				['@' + options?.extraAttrs?.providerId + '#' + cur]: extraAttrs[cur],
			};
		}, {});
	}

	const stepInstanceWithAttr: StepInstance = {
		...stepInstance,
		// attrs: merge(JSON.parse(step.attrs), options?.extraAttrs?.attrs ?? {}),
		attrs: merge(creatorAttrsWithPrefix, extraAttrsWithPrefix),
		id: step.id,
		// collapsed: options?.collapsed,
	};

	// if (options?.extraAttrs) {
	//   console.log('convertStepToStepInstance: extraAttrs', stepInstanceWithAttr);
	// }

	return stepInstanceWithAttr;
}

export function convertStepToStepDetail(step: Step) {
	let stepInstance = ALL_STEP_INSTANCES.find((stepInstance: StepInstance) => stepInstance.stepDetail.name === step.kind);
	if (!stepInstance) {
		stepInstance = ALL_STEP_INSTANCES.find(
			(stepInstance: StepInstance) => stepInstance.stepDetail.name === UNKNOWN_STEP_INSTANCE_NAME
		);
	}

	if (!stepInstance) {
		throw new Error('Step not found');
	}

	return stepInstance.stepDetail;
}

export function setStepAttribute(step: Step, stepAttribute: StepAttribute, newValue: AttrElement) {
	const attrs: Attr = JSON.parse(step.attrs);
	attrs[stepAttribute.name] = newValue;
	step.attrs = JSON.stringify(attrs);
	return step;
}

export function alreadyHasStep(steps: Step[], stepName: string) {
	return steps.filter((step) => step.kind === stepName).length > 0;
}

export function convertKeyToAttrValue(
	attribute: StepAttribute,
	formStepInstance: StepInstance,
	key: keyof StepAttribute = 'label'
) {
	const valueToConvert = attribute[key];
	let finalValue = valueToConvert;

	function evalProxy(valueToEval: string, initialValue: AttrElement) {
		let temporaryValue = initialValue;
		// string = @xxxx#yyyy
		// extract xxxx and yyyy
		const regex = /@([^#]*)#([^#]*)/;
		const match = regex.exec(valueToEval);
		if (match) {
			// this attribute is a proxy: either we use the available value, or the default value or the placeholder of the targeted attr

			const providerId = match[1];
			const attrName = match[2];
			// check if valueToEval is a key in formStepInstance.attrs
			if (formStepInstance.attrs && Object.hasOwnProperty.call(formStepInstance.attrs, valueToEval)) {
				temporaryValue = formStepInstance.attrs[valueToEval];
			} else {
				// console.log(
				//   '%cattribute not found in formStepInstance.attrs',
				//   'color:blue',
				//   valueToEval,
				//   providerId,
				//   attrName
				// );
				const proxiedAttribute = formStepInstance.stepDetail.attributes.find(
					(attr) => attr.providerId === providerId && attr.name === attrName
				);
				if (proxiedAttribute && proxiedAttribute.default) {
					// console.log(
					//   '%cattribute not found in formStepInstance.attrs RETURNING DEFAULT OF PROXIED ATTRIBUTE',
					//   'color:green',
					//   valueToEval,
					//   providerId,
					//   attrName
					// );
					temporaryValue = proxiedAttribute.default;
					// finalValue = convertKeyToAttrValue(proxiedAttribute, formStepInstance, 'default');
				} else if (proxiedAttribute && proxiedAttribute.placeholder) {
					// console.log(
					//   '%cattribute not found in formStepInstance.attrs RETURNING PLACEHOLDER OF PROXIED ATTRIBUTE',
					//   'color:green',
					//   valueToEval,
					//   providerId,
					//   attrName
					// );
					temporaryValue = proxiedAttribute.placeholder;
				} else {
					// console.log(
					//   '%cattribute not found in formStepInstance.attrs AND NO DEFAULT VALUE IN PROXIED ATTRIBUTE, RETURNING UNDEFINED',
					//   'color:orange',
					//   valueToConvert,
					//   providerId,
					//   attrName
					// );
					temporaryValue = undefined;
				}
			}
		}
		return temporaryValue;
	}

	if (typeof valueToConvert === 'string') {
		const regexOperator = /^&(.*)::(.*)/;
		const matchOperator = regexOperator.exec(valueToConvert);

		if (matchOperator) {
			const operator = matchOperator[1];
			const proxiedValues = matchOperator[2]
				.split('|')
				.map((subValueToConvert) => evalProxy(subValueToConvert, finalValue));
			if (operator == 'OR') {
				finalValue = proxiedValues.some((pv) => !!pv);
			} else if (operator == 'AND') {
				finalValue = proxiedValues.every((pv) => !!pv);
			} else if (operator == 'NOT') {
				finalValue = !evalProxy(matchOperator[2], finalValue);
			}
		} else {
			finalValue = evalProxy(valueToConvert, finalValue);
		}
	}

	if (key === 'hidden') {
		finalValue = finalValue ?? false;
	} else if (key === 'required') {
		finalValue = finalValue ?? false;
	} else {
		// Value to convert is not a string, if it's undefined or null we use default value or placeholder of the current attr
		finalValue = finalValue ?? attribute.default ?? '';
	}

	return finalValue;
}

export function prefixAttrWithProvider(attribute: StepAttribute) {
	return `@${attribute.providerId}#${attribute.name}`;
}

export function stepMergeCustomizer(value: any, srcValue: any, key: string, object: any, source: any) {
	if (key === 'stepanswer') {
		return srcValue;
	}
}

export function getPreviewText(stepInstance: StepInstance) {
	// convert a stepInstance to text for preview (default to menuText if no content to use)
	const sentence = stepInstance.stepDetail.attributes
		.map((attribute) => {
			if (attribute.useForPreview) {
				return stepInstance.attrs[prefixAttrWithProvider(attribute)];
			}
			return '';
		})
		.join(' ')
		.trim();
	if (sentence.length === 0) {
		return stepInstance.stepDetail.menuText;
	}
	return sentence.length > 40 ? sentence.substring(0, 37).trim() + '...' : sentence;
}

export function getPreviewTextFromStep(step: Step) {
	const stepInstance = convertStepToStepInstance(step);
	return getPreviewText(stepInstance);
}

export function getStepIconFromStepKind(stepKind?: string) {
	if (!stepKind) return;
	let stepInstance = ALL_STEP_INSTANCES.find((stepInstance: StepInstance) => stepInstance.stepDetail.name === stepKind);
	if (!stepInstance) {
		stepInstance = ALL_STEP_INSTANCES.find(
			(stepInstance: StepInstance) => stepInstance.stepDetail.name === UNKNOWN_STEP_INSTANCE_NAME
		);
	}
	if (!stepInstance) {
		throw new Error('Step not found');
	}
	return stepInstance.stepDetail.icon;
}

export function getStepMenuTextFromStepKind(stepKind: string) {
	let stepInstance = ALL_STEP_INSTANCES.find((stepInstance: StepInstance) => stepInstance.stepDetail.name === stepKind);
	if (!stepInstance) {
		stepInstance = ALL_STEP_INSTANCES.find(
			(stepInstance: StepInstance) => stepInstance.stepDetail.name === UNKNOWN_STEP_INSTANCE_NAME
		);
	}
	if (!stepInstance) {
		throw new Error('Step not found');
	}
	return stepInstance.stepDetail.menuText;
}

export function convertKindToStepDetail(kind: string) {
	let stepInstance = ALL_STEP_INSTANCES.find((stepInstance: StepInstance) => stepInstance.stepDetail.name === kind);
	if (!stepInstance) {
		stepInstance = ALL_STEP_INSTANCES.find(
			(stepInstance: StepInstance) => stepInstance.stepDetail.name === UNKNOWN_STEP_INSTANCE_NAME
		);
	}
	if (!stepInstance) {
		throw new Error('Step not found');
	}
	return stepInstance.stepDetail;
}
