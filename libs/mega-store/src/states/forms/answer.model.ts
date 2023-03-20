import { Syncable } from '../../others/types';

export interface Answer extends Syncable {
	id: string;
	ownerId: string;

	// sessionId: string; // old model
	userId: string;
	formId: string;
	stepId: string;
	attrs: string;

	recordingSessionId: string;
}

export function createAnswer(params?: Partial<Answer>) {
	return {
		...params,
	} as Answer;
}
