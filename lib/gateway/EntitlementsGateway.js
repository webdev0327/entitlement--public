const uuid = require('uuid');

const assert = require('@barchart/common-js/lang/assert'),
	attributes = require('@barchart/common-js/lang/attributes'),
	Disposable = require('@barchart/common-js/lang/Disposable'),
	Enum = require('@barchart/common-js/lang/Enum');

const EndpointBuilder = require('@barchart/common-js/api/http/builders/EndpointBuilder'),
	Gateway = require('@barchart/common-js/api/http/Gateway'),
	ProtocolType = require('@barchart/common-js/api/http/definitions/ProtocolType'),
	ErrorInterceptor = require('@barchart/common-js/api/http/interceptors/ErrorInterceptor'),
	FailureReason = require('@barchart/common-js/api/failures/FailureReason'),
	FailureType = require('@barchart/common-js/api/failures/FailureType'),
	RequestInterceptor = require('@barchart/common-js/api/http/interceptors/RequestInterceptor'),
	ResponseInterceptor = require('@barchart/common-js/api/http/interceptors/ResponseInterceptor'),
	VerbType = require('@barchart/common-js/api/http/definitions/VerbType');

const Configuration = require('./../common/Configuration'),
	JwtProvider = require('../security/JwtProvider');

module.exports = (() => {
	'use strict';

	const REST_API_SECURE_PROTOCOL = 'https';
	const REST_API_SECURE_PORT = 443;

	/**
	 * The **central component of the SDK**. It is responsible for connecting to Barchart's
	 * Entitlements Service. It can be used to query, edit, and delete entitlements.
	 *
	 * @public
	 * @exported
	 * @param {String} protocol - The protocol of the of the Entitlement web service (either http or https).
	 * @param {String} host - The hostname of the Entitlements web service.
	 * @param {Number} port - The TCP port number of the Entitlements web service.
	 * @param {String} environment - A description of the environment we're connecting to.
	 * @extends {Disposable}
	 */
	class EntitlementsGateway extends Disposable {
		constructor(protocol, host, port, environment) {
			super();

			this._clientId = uuid.v4();
			this._environment = environment;

			this._jwtProvider = null;
			this._authorizationObserver = null;

			this._started = false;
			this._startPromise = null;

			this._entitlements = null;

			const requestInterceptor = RequestInterceptor.fromDelegate((options, endpoint) => {
				return Promise.resolve()
					.then(() => {
						return this._jwtProvider.getToken()
							.then((token) => {
								options.headers = options.headers || {};
								options.headers.Authorization = `Bearer ${token}`;

								return options;
							});
					}).catch((e) => {
						const failure = FailureReason.forRequest({ endpoint: endpoint })
							.addItem(FailureType.REQUEST_IDENTITY_FAILURE)
							.format();

						return Promise.reject(failure);
					});
			});

			const protocolType = Enum.fromCode(ProtocolType, protocol.toUpperCase());

			this._metadataReadEndpoint = EndpointBuilder.for('read-service-metadata', 'check version of entitlements service')
				.withVerb(VerbType.GET)
				.withProtocol(protocolType)
				.withHost(host)
				.withPort(port)
				.withPathBuilder((pb) =>
					pb.withLiteralParameter('version', 'v1')
						.withLiteralParameter('service', 'service')
				)
				.withRequestInterceptor(requestInterceptor)
				.withResponseInterceptor(ResponseInterceptor.DATA)
				.withErrorInterceptor(ErrorInterceptor.GENERAL)
				.endpoint;

			this._userReadEndpoint = EndpointBuilder.for('read-user', 'read user data')
				.withVerb(VerbType.GET)
				.withProtocol(protocolType)
				.withHost(host)
				.withPort(port)
				.withPathBuilder((pb) => {
					pb.withLiteralParameter('version', 'v1')
						.withLiteralParameter('users', 'users');
				})
				.withRequestInterceptor(requestInterceptor)
				.withResponseInterceptor(ResponseInterceptor.DATA)
				.withErrorInterceptor(ErrorInterceptor.GENERAL)
				.endpoint;

			this._operationAuthorizeEndpoint = EndpointBuilder.for('authorize-operation', 'authorize operation for user')
				.withVerb(VerbType.POST)
				.withProtocol(protocolType)
				.withHost(host)
				.withPort(port)
				.withPathBuilder((pb) => {
					pb.withLiteralParameter('version', 'v1')
						.withLiteralParameter('operations', 'operations')
						.withLiteralParameter('authorize', 'authorize');
				})
				.withBody()
				.withRequestInterceptor(requestInterceptor)
				.withResponseInterceptor(ResponseInterceptor.DATA)
				.withErrorInterceptor(ErrorInterceptor.GENERAL)
				.endpoint;
		}

		/**
		 * A description of the environment (e.g. development, production, etc).
		 *
		 * @public
		 * @return {String}
		 */
		get environment() {
			return this._environment;
		}

		/**
		 * Attempts to establish a connection to the backend. This function should be invoked
		 * immediately following instantiation. Once the resulting promise resolves, a
		 * connection has been established and other instance methods can be used.
		 *
		 * @public
		 * @param {JwtProvider} jwtProvider
		 * @param {Callbacks.AuthorizationObserver=} authorizationObserver
		 * @returns {Promise<EntitlementsGateway>}
		 */
		connect(jwtProvider, authorizationObserver) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(jwtProvider, 'jwtProvider', JwtProvider, 'JwtProvider');
					assert.argumentIsOptional(authorizationObserver, 'authorizationObserver', Function);

					if (this._startPromise === null) {
						this._startPromise = Promise.resolve()
							.then(() => {
								this._started = true;

								this._jwtProvider = jwtProvider;

								let resultPromise;

								if (authorizationObserver) {
									this._authorizationObserver = authorizationObserver;

									resultPromise = this.readUser()
										.then((entitlements) => {
											this._entitlements = entitlements;

											return this;
										});
								} else {
									resultPromise = Promise.resolve(this);
								}

								return resultPromise;
							}).catch((e) => {
								this._started = false;
								this._startPromise = null;

								this._jwtProvider = null;

								throw e;
							});
					}

					return this._startPromise;
				});
		}

		/**
		 * Returns an authorization to perform on operation for a specific product.
		 *
		 * @public
		 * @param {String} operation
		 * @returns {Promise<Boolean>}
		 */
		authorize(operation) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(operation, 'operation', String);

					checkStart.call(this);

					let authorizePromise;

					if (this._authorizationObserver !== null) {
						authorizePromise = Gateway.invoke(this._operationAuthorizeEndpoint, { operation: operation })
							.then((details) => {
								const authorized = attributes.has(details, 'grant');

								this._authorizationObserver(operation, authorized, details);

								return authorized;
							});
					} else {
						authorizePromise = Promise.resolve(true);
					}

					return authorizePromise;
				});
		}

		/**
		 * Retrieves information regarding the remote service (e.g. version number, current user identifier, etc).
		 *
		 * @public
		 * @returns {Promise<Schema.EntitlementServiceInfo>}
		 */
		readServiceMetadata() {
			return Promise.resolve()
				.then(() => {
					checkStart.call(this);

					return Gateway.invoke(this._metadataReadEndpoint);
				});
		}

		/**
		 * Retrieves user data, permissions, roles.
		 *
		 * @public
		 * @returns {Promise<Schema.User>}
		 */
		readUser() {
			return Promise.resolve()
				.then(() => {
					checkStart.call(this);

					return Gateway.invoke(this._userReadEndpoint);
				});
		}

		/**
		 * Creates and starts a new {@link EntitlementsGateway} for use in the private development environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @param {Callbacks.AuthorizationObserver=} authorizationObserver
		 * @returns {Promise<EntitlementsGateway>}
		 */
		static forDevelopment(jwtProvider, authorizationObserver) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(jwtProvider, 'jwtProvider', JwtProvider, 'JwtProvider');

					return start(new EntitlementsGateway(REST_API_SECURE_PROTOCOL, Configuration.developmentHost, REST_API_SECURE_PORT, 'development'), jwtProvider, authorizationObserver);
				});
		}

		/**
		 * Creates and starts a new {@link EntitlementsGateway} for use in the private staging environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @param {Callbacks.AuthorizationObserver=} authorizationObserver
		 * @returns {Promise<EntitlementsGateway>}
		 */
		static forStaging(jwtProvider, authorizationObserver) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(jwtProvider, 'jwtProvider', JwtProvider, 'JwtProvider');

					return start(new EntitlementsGateway(REST_API_SECURE_PROTOCOL, Configuration.stagingHost, REST_API_SECURE_PORT, 'staging'), jwtProvider, authorizationObserver);
				});
		}

		/**
		 * Creates and starts a new {@link EntitlementsGateway} for use in the public production environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @param {Callbacks.AuthorizationObserver=} authorizationObserver
		 * @returns {Promise<EntitlementsGateway>}
		 */
		static forProduction(jwtProvider, authorizationObserver) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(jwtProvider, 'jwtProvider', JwtProvider, 'JwtProvider');

					return start(new EntitlementsGateway(REST_API_SECURE_PROTOCOL, Configuration.productionHost, REST_API_SECURE_PORT, 'production'), jwtProvider, authorizationObserver);
				});
		}

		_onDispose() {
			return;
		}

		toString() {
			return '[EntitlementsGateway]';
		}
	}

	const responseInterceptorForDeserialization = ResponseInterceptor.fromDelegate((response, ignored) => {
		return response.data;
	});

	function start(gateway, jwtProvider, authorizationObserver) {
		return gateway.connect(jwtProvider, authorizationObserver)
			.then(() => {
				return gateway;
			});
	}

	function checkStart() {
		if (this.getIsDisposed()) {
			throw new Error('Unable to use gateway, the gateway has been disposed.');
		}

		if (!this._started) {
			throw new Error('Unable to use gateway, the gateway has not started.');
		}
	}

	return EntitlementsGateway;
})();
