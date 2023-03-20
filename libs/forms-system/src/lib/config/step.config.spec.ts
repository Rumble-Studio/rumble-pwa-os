import { ALL_STEP_INSTANCES } from './steps.config';
describe('ALL_STEP_INSTANCES ', () => {
	const stepsList = [
		'audio-step',
		'welcome-step',
		'call-to-action',
		'text-step',
		'upload-picture',
		'recording-instructions',
		'unknown-step',
		'guest-info',
		'share-this-form',
		'message-step',
		'video-step',
		'slider-step',
		'number-request',
		'termination',
		'qcm',
	];
	it('should be true', () => {
		let steps = [];

		for (const step of ALL_STEP_INSTANCES) {
			steps.push(step.stepDetail.name);
		}
		const stepsCompared = JSON.stringify(stepsList) === JSON.stringify(steps);
		try {
			expect(stepsCompared).toBeTruthy();
		} catch (e) {
			throw new Error("You can't change a node name.");
		}
	});
	it('attributes in each step must have unique name', () => {
		let hasSameName: string[] = [];

		ALL_STEP_INSTANCES.forEach((step) => {
			let attrNames: string[] = [];
			const stepAttrs = step.stepDetail.attributes;
			stepAttrs.forEach((attr) => {
				const attrToCheck = '@' + attr.providerId + '#' + attr.name;
				if (attrNames.includes(attrToCheck)) {
					hasSameName.push(attrToCheck);
				} else {
					attrNames.push(attrToCheck);
				}
			});
		});
		if (hasSameName.length > 0) console.log(hasSameName);
		expect(hasSameName.length).toEqual(0);
	});
});
