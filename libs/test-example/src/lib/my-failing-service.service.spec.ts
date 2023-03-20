import { MyFailingServiceService } from './my-failing-service.service';

describe('MyFailingServiceService', () => {
	let service: MyFailingServiceService;

	it('should fail', () => {
		let failure;
		try {
			service = new MyFailingServiceService();
			failure = false;
		} catch (err) {
			failure = true;
		}
		expect(failure).toBeTruthy();
	});
});
