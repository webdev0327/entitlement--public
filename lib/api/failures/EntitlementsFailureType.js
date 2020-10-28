const FailureType = require('@barchart/common-js/api/failures/FailureType');

module.exports = (() => {
	'use strict';

	class EntitlementsFailureType {
		constructor() {

		}

		static get ENTITLEMENTS_FAILED() {
			return entitlementsFailed;
		}

		toString() {
			return '[EntitlementsFailureType]';
		}
	}

	const entitlementsFailed = new FailureType('ENTITLEMENTS_FAILED', 'An attempt to make request failed because you don\'t have enough permissions to perform this action.');

	return EntitlementsFailureType;
})();
