const assert = require('@barchart/common-js/lang/assert'),
	Disposable = require('@barchart/common-js/lang/Disposable'),
	is = require('@barchart/common-js/lang/is'),
	random = require('@barchart/common-js/lang/random'),
	Scheduler = require('@barchart/common-js/timing/Scheduler');

const EndpointBuilder = require('@barchart/common-js/api/http/builders/EndpointBuilder'),
	Gateway = require('@barchart/common-js/api/http/Gateway'),
	ProtocolType = require('@barchart/common-js/api/http/definitions/ProtocolType'),
	ResponseInterceptor = require('@barchart/common-js/api/http/interceptors/ResponseInterceptor'),
	VerbType = require('@barchart/common-js/api/http/definitions/VerbType');

const Configuration = require('../common/Configuration');

module.exports = (() => {
	'use strict';

	const DEFAULT_REFRESH_INTERVAL_MILLISECONDS = 5 * 60 * 1000;

	/**
	 * Generates and caches a signed token (using a delegate). The cached token
	 * is refreshed periodically.
	 *
	 * @public
	 * @exported
	 * @param {Callbacks.JwtTokenGenerator} tokenGenerator - An anonymous function which returns a signed JWT token.
	 * @param {Number=} refreshInterval - The number of milliseconds which must pass before a new JWT token is generated. A zero value means the token should never be refreshed. A null or undefined value means the token is not cached.
	 */
	class JwtProvider extends Disposable {
		constructor(tokenGenerator, refreshInterval) {
			super();

			assert.argumentIsRequired(tokenGenerator, 'tokenGenerator', Function);
			assert.argumentIsOptional(refreshInterval, 'refreshInterval', Number);

			this._tokenGenerator = tokenGenerator;

			this._tokenPromise = null;

			this._refreshTimestamp = null;
			this._refreshPending = false;

			if (is.number(refreshInterval)) {
				this._refreshInterval = Math.max(refreshInterval || 0, 0);
				this._refreshJitter = random.range(0, Math.floor(this._refreshInterval / 10));
			} else {
				this._refreshInterval = null;
				this._refreshJitter = null;
			}

			this._scheduler = new Scheduler();
		}

		/**
		 * Reads the current token, refreshing if necessary.
		 *
		 * @public
		 * @returns {Promise<String>}
		 */
		getToken() {
			return Promise.resolve()
				.then(() => {
					if (this._refreshPending) {
						return this._tokenPromise;
					}

					if (this._tokenPromise === null || this._refreshInterval === null || (this._refreshInterval > 0 && getTime() > (this._refreshTimestamp + this._refreshInterval + this._refreshJitter))) {
						this._refreshPending = true;

						this._tokenPromise = this._scheduler.backoff(() => this._tokenGenerator(), 100, 'Read JWT token', 3)
							.then((token) => {
								this._refreshTimestamp = getTime();
								this._refreshPending = false;

								return token;
							}).catch((e) => {
								this._tokenPromise = null;

								this._refreshTimestamp = null;
								this._refreshPending = false;

								return Promise.reject(e);
							});
					}

					return this._tokenPromise;
				});
		}

		/**
		 * A factory for {@link JwtProvider} which is an alternative to the constructor.
		 *
		 * @public
		 * @static
		 * @param {Callbacks.JwtTokenGenerator} tokenGenerator - An anonymous function which returns a signed JWT token.
		 * @param {Number=} refreshInterval - The number of milliseconds which must pass before a new JWT token is generated. A zero value means the token should never be refreshed. A null or undefined value means the token is not cached.
		 * @returns {JwtProvider}
		 */
		static fromTokenGenerator(tokenGenerator, refreshInterval) {
			return new JwtProvider(tokenGenerator, refreshInterval);
		}

		/**
		 * Builds a {@link JwtProvider} which will generate tokens impersonating the specified
		 * user. The "development" environment is for Barchart use only and access is restricted
		 * to Barchart's internal network.
		 *
		 * @public
		 * @static
		 * @param {String} userId - The user identifier to impersonate.
		 * @param {String} contextId - The context identifier of the user to impersonate.
		 * @param {String=} permissions - The desired permission level.
		 * @returns {JwtProvider}
		 */
		static forDevelopment(userId, contextId, permissions) {
			return getJwtProviderForImpersonation(Configuration.getJwtImpersonationHost, 'dev', userId, contextId, permissions);
		}

		_onDispose() {
			this._scheduler.dispose();
			this._scheduler = null;
		}

		toString() {
			return '[JwtProvider]';
		}
	}

	function getJwtProviderForImpersonation(host, environment, userId, contextId, permissions) {
		assert.argumentIsRequired(host, 'host', String);
		assert.argumentIsRequired(environment, 'environment', String);
		assert.argumentIsRequired(userId, 'userId', String);
		assert.argumentIsRequired(contextId, 'contextId', String);
		assert.argumentIsOptional(permissions, 'permissions', String);

		const tokenEndpoint = EndpointBuilder.for('generate-impersonation-jwt-for-test', 'generate JWT token for test environment')
			.withVerb(VerbType.POST)
			.withProtocol(ProtocolType.HTTPS)
			.withHost(host)
			.withPathBuilder((pb) =>
				pb.withLiteralParameter('version', 'v1')
					.withLiteralParameter('tokens', 'tokens')
					.withLiteralParameter('impersonate', 'impersonate')
					.withLiteralParameter('service', 'entitlements')
					.withLiteralParameter('environment', environment)
			)
			.withBody()
			.withResponseInterceptor(ResponseInterceptor.DATA)
			.endpoint;

		const payload = { };

		payload.userId = userId;
		payload.contextId = contextId;

		if (permissions) {
			payload.permissions = permissions;
		}

		return new JwtProvider(() => Gateway.invoke(tokenEndpoint, payload), DEFAULT_REFRESH_INTERVAL_MILLISECONDS);
	}

	function getTime() {
		return (new Date()).getTime();
	}

	return JwtProvider;
})();
