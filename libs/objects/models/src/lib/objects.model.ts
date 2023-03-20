export interface ObjectThumbnail<T> {
	/**imageUrl must be a real URL (it can not be a rs:://<id> string) */
	imageUrl?: string;
	object?: T;
	selected?: boolean;
	displaySelectButton?: boolean;
	innerHTML?: string;
}
