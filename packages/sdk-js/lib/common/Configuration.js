module.exports = (() => {
	'use strict';

	/**
	 * Static configuration data.
	 *
	 * @public
	 * @ignore
	 */
	class Configuration {
		constructor() {

		}

		/**
		 * The hostname of the REST API for the development environment (intended for Barchart use only).
		 *
		 * @public
		 * @static
		 * @returns {String}
		 */
		static get developmentHost() {
			return 'entitlements-dev.aws.barchart.com';
		}

		/**
		 * The hostname of the REST API for the staging environment (public use allowed).
		 *
		 * @public
		 * @static
		 * @returns {String}
		 */
		static get stagingHost() {
			return 'entitlements-stage.aws.barchart.com';
		}

		/**
		 * The hostname of the REST API for the production environment (public use allowed).
		 *
		 * @public
		 * @static
		 * @returns {String}
		 */
		static get productionHost() {
			return 'entitlements.aws.barchart.com';
		}

		/**
		 * The hostname of the REST API for the admin environment (intended for Barchart use only).
		 *
		 * @public
		 * @static
		 * @returns {String}
		 */
		static get adminHost() {
			return 'entitlements-admin.aws.barchart.com';
		}

		/**
		 * The hostname of REST API which generates impersonation tokens for non-secure
		 * test and demo environments.
		 *
		 * @public
		 * @static
		 * @returns {string}
		 */
		static get getJwtImpersonationHost() {
			return 'jwt-public-prod.aws.barchart.com';
		}

		toString() {
			return '[Configuration]';
		}
	}

	return Configuration;
})();
