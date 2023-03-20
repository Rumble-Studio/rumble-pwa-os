import { isEqual } from 'lodash';
import { Syncable } from './types';

export function ToSync<T extends Syncable>() {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function (constructor: Function) {
		constructor.prototype.akitaPreAddEntity = (newEntity: T) => {
			if (newEntity.operation === 'refresh') {
				return { ...newEntity, toSync: false, operation: null };
			}

			const now = Math.round(Date.now() / 1000);
			const newSyncableEntity = {
				timeCreation: now,
				...newEntity,
				timeUpdate: now,
				toSync: true,
				operation: 'creation',
			} as T;

			return newSyncableEntity;
		};
		constructor.prototype.akitaPreUpdateEntity = (prevEntity: T, newEntity: T) => {
			// if (newEntity.operation === 'markAsSynced') {
			//   return { ...prevEntity, toSync: false, operation: null };
			// }

			// console.log('akitaPreUpdateEntity', prevEntity, newEntity);
			const operation = newEntity.operation;

			// if (
			//   isEqual(
			//     { ...newEntity, timeUpdate: null, operation: null },
			//     { ...prevEntity, timeUpdate: null, operation: null }
			//   )
			// ) {
			//   // ignoring the operation to compare the object
			//   console.log('[akita] equal', prevEntity);
			//   return prevEntity;
			// }

			if (operation === 'refresh') {
				if ((newEntity?.timeUpdate || Infinity) == (prevEntity?.timeUpdate || 0)) {
					// console.log('%cNew entity is the same', 'color:lightblue', {
					//   newEntity,
					//   prevEntity,
					// });
					return { ...newEntity, toSync: false, operation: null };
				} else if ((newEntity?.timeUpdate || Infinity) > (prevEntity?.timeUpdate || 0)) {
					// console.log('%cNew entity is fresher', 'color:lightblue', {
					//   newEntity,
					//   prevEntity,
					// });
					return { ...newEntity, toSync: false, operation: null };
				} else {
					// console.log('%cLocal ahead of server', 'color:lightblue', {
					//   newEntity,
					//   prevEntity,
					// });
					return { ...prevEntity, toSync: true, operation: 'update' };
				}

				// return { ...newEntity, toSync: false, operation: null };
			}

			let timeUpdate = Math.round(Date.now() / 1000);
			let toSync = true;
			if (
				isEqual(
					{ ...newEntity, timeUpdate: null, operation: null },
					{ ...prevEntity, timeUpdate: null, operation: null }
				)
			) {
				// console.log('[akita] equal', newEntity);

				timeUpdate = prevEntity.timeUpdate || timeUpdate;
				toSync = newEntity.toSync || false;
			}

			const newSyncableEntity = {
				...newEntity,
				timeUpdate,
				toSync,
				operation: prevEntity.operation == 'creation' && !!prevEntity.toSync ? 'creation' : 'update',
			} as T;

			return newSyncableEntity;
		};
	};
}
