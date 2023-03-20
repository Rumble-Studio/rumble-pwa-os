import { Syncable } from '../../others/types';
import { Form } from './form.model';

export interface RecordingSession extends Syncable {
	ownerId: string;
	formId: string;
}

// used to add information in object list
export interface RecordingSessionListItem {
	id: string;
	recordingSession: RecordingSession;
	user: any; // TODO replace by users once the recording session is a repository outside of mega-store
	form: Form;
	imageId?: string;
	duration?: number;
}
