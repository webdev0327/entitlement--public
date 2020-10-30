const assert = require('@barchart/common-js/lang/assert'),
	Disposable = require('@barchart/common-js/lang/Disposable'),
	Enum = require('@barchart/common-js/lang/Enum'),
	is = require('@barchart/common-js/lang/is');

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

	const REFRESH_INTERVAL_MILLISECONDS = 10 * 60 * 1000;

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

			this._environment = environment;

			this._jwtProvider = null;
			this._authorizationObserver = null;

			this._started = false;
			this._startPromise = null;

			this._authorizerCachePromise = null;
			this._authorizerCacheTimestamp = null;

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

			this._authorizeEndpoint = EndpointBuilder.for('authorize-operation', 'authorize operation for user')
				.withVerb(VerbType.POST)
				.withProtocol(protocolType)
				.withHost(host)
				.withPort(port)
				.withPathBuilder((pb) => {
					pb.withLiteralParameter('version', 'v1')
						.withLiteralParameter('authorizations', 'authorizations');
				})
				.withBody()
				.withRequestInterceptor(requestInterceptor)
				.withResponseInterceptor(ResponseInterceptor.DATA)
				.withErrorInterceptor(ErrorInterceptor.GENERAL)
				.endpoint;

			this._operationsReadEndpoint = EndpointBuilder.for('read-operations', 'get list of operations for a product')
				.withVerb(VerbType.GET)
				.withProtocol(protocolType)
				.withHost(host)
				.withPort(port)
				.withPathBuilder((pb) => {
					pb.withLiteralParameter('version', 'v1')
						.withLiteralParameter('operations', 'operations')
						.withVariableParameter('product', 'product', 'product', false);
				})
				.withResponseInterceptor(ResponseInterceptor.DATA)
				.withErrorInterceptor(ErrorInterceptor.GENERAL)
				.endpoint;

			this._metadataReadEndpoint = EndpointBuilder.for('read-service-metadata', 'check version of entitlements service')
				.withVerb(VerbType.GET)
				.withProtocol(protocolType)
				.withHost(host)
				.withPort(port)
				.withPathBuilder((pb) =>
					pb.withLiteralParameter('version', 'v1')
						.withLiteralParameter('service', 'service')
				)
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
		 * @param {Boolean=} eager
		 * @returns {Promise<EntitlementsGateway>}
		 */
		connect(jwtProvider, eager) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(jwtProvider, 'jwtProvider', JwtProvider, 'JwtProvider');
					assert.argumentIsOptional(eager, 'eager', Boolean);

					if (this._startPromise === null) {
						this._startPromise = Promise.resolve()
							.then(() => {
								this._started = true;

								this._jwtProvider = jwtProvider;

								let cachePromise;

								if (eager) {
									cachePromise = getAuthorizer.call(this);
								} else {
									cachePromise = Promise.resolve();
								}

								return cachePromise.then(() => {
									return this;
								});
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
		 * @param {Object=} data
		 * @returns {Promise<Boolean>}
		 */
		authorize(operation, data) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsRequired(operation, 'operation', String);
					assert.argumentIsOptional(data, 'data', Object);

					checkStart.call(this);

					return getAuthorizer.call(this)
						.then((authorizer) => {
							const response = authorizer.authorize(operation, data || { });

							if (response !== null) {
								return Promise.resolve(response);
							} else {
								const payload = { operation };

								if (data) {
									payload.data = data;
								}

								return Gateway.invoke(this._authorizeEndpoint, payload);
							}
						}).then((result) => {
							if (this._authorizationObserver !== null) {
								this._authorizationObserver(result.request, result.response);
							}

							return result.response.authorized || false;
						});
				});
		}

		/**
		 * Assigns the authorization observer.
		 *
		 * @public
		 * @param {Callbacks.AuthorizationObserver} authorizationObserver
		 */
		registerAuthorizationObserver(authorizationObserver) {
			assert.argumentIsRequired(authorizationObserver, 'authorizationObserver', Function);

			if (this._authorizationObserver) {
				throw new Error('An authorization observer has already been bound');
			}

			this._authorizationObserver = authorizationObserver;
		}

		/**
		 * Retrieves user data, including roles and permissions.
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
		 * Retrieves all possible operation for a given product.
		 *
		 * @public
		 * @param {String=} product
		 * @returns {Promise<Schema.Operation>}
		 */
		readOperations(product) {
			return Promise.resolve()
				.then(() => {
					assert.argumentIsOptional(product, 'product', String);

					checkStart.call(this);

					const payload = { };

					payload.product = product || '*';

					return Gateway.invoke(this._operationsReadEndpoint, payload);
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
		 * Creates and starts a new {@link EntitlementsGateway} for use in the private development environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @param {Callbacks.AuthorizationObserver=} authorizationObserver
		 * @param {Boolean=} eager
		 * @returns {Promise<EntitlementsGateway>}
		 */
		static forDevelopment(jwtProvider, authorizationObserver, eager) {
			return Promise.resolve()
				.then(() => {
					return start(new EntitlementsGateway(REST_API_SECURE_PROTOCOL, Configuration.developmentHost, REST_API_SECURE_PORT, 'development'), jwtProvider, authorizationObserver, eager);
				});
		}

		/**
		 * Creates and starts a new {@link EntitlementsGateway} for use in the private staging environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @param {Callbacks.AuthorizationObserver=} authorizationObserver
		 * @param {Boolean=} eager
		 * @returns {Promise<EntitlementsGateway>}
		 */
		static forStaging(jwtProvider, authorizationObserver, eager) {
			return Promise.resolve()
				.then(() => {
					return start(new EntitlementsGateway(REST_API_SECURE_PROTOCOL, Configuration.stagingHost, REST_API_SECURE_PORT, 'staging'), jwtProvider, authorizationObserver, eager);
				});
		}

		/**
		 * Creates and starts a new {@link EntitlementsGateway} for use in the public production environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @param {Callbacks.AuthorizationObserver=} authorizationObserver
		 * @param {Boolean=} eager
		 * @returns {Promise<EntitlementsGateway>}
		 */
		static forProduction(jwtProvider, authorizationObserver, eager) {
			return Promise.resolve()
				.then(() => {
					return start(new EntitlementsGateway(REST_API_SECURE_PROTOCOL, Configuration.productionHost, REST_API_SECURE_PORT, 'production'), jwtProvider, authorizationObserver, eager);
				});
		}

		/**
		 * Creates and starts a new {@link EntitlementsGateway} for use in the private admin environment.
		 *
		 * @public
		 * @static
		 * @param {JwtProvider} jwtProvider
		 * @param {Callbacks.AuthorizationObserver=} authorizationObserver
		 * @param {Boolean=} eager
		 * @returns {Promise<EntitlementsGateway>}
		 */
		static forAdmin(jwtProvider, authorizationObserver, eager) {
			return Promise.resolve()
				.then(() => {
					return start(new EntitlementsGateway(REST_API_SECURE_PROTOCOL, Configuration.adminHost, REST_API_SECURE_PORT, 'admin'), jwtProvider, authorizationObserver, eager);
				});
		}

		_onDispose() {
			return;
		}

		toString() {
			return '[EntitlementsGateway]';
		}
	}

	function start(gateway, jwtProvider, authorizationObserver, eager) {
		return gateway.connect(jwtProvider, eager)
			.then(() => {
				gateway.registerAuthorizationObserver(authorizationObserver);

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

	function getTimestamp() {
		const now = new Date();

		return now.getTime();
	}

	function getAuthorizer() {
		return Promise.resolve()
			.then(() => {
				if (this._authorizerCachePromise === null || this._authorizerCacheTimestamp === null || getTimestamp() > this._authorizerCacheTimestamp + REFRESH_INTERVAL_MILLISECONDS) {
					this._authorizerCachePromise = Promise.all([
						this.readUser(),
						this.readOperations()
					]).then((results) => {
						this._authorizerCacheTimestamp = getTimestamp();

						return new Authorizer(results[0], results[1]);
					});
				}

				return this._authorizerCachePromise;
			});
	}

	class Authorizer {
		constructor(user, operations) {
			this._user = user;
			this._operations = operations;
		}

		authorize(operation, data) {
			const request = { };

			request.user = { };
			request.user.user = this._user.user;
			request.user.context = this._user.context;
			request.user.roles = this._user.roles.map(r => r.role);

			const o = this._operations.find(o => o.operation === operation);

			if (!o) {
				return null;
			}

			request.operation = { };
			request.operation.operation = o.operation;
			request.operation.product = o.product;
			request.operation.restrictions = o.restrictions;

			request.data = data;

			const result = { };

			result.request = request;
			result.response = { };

			const permissions = this._user.roles.reduce((accumulator, role) => {
				role.permissions.forEach((permission) => {
					if (permission.operation.operation === operation) {
						accumulator.push(permission);
					}
				});

				return accumulator;
			}, [ ]);

			if (permissions.length === 0) {
				result.response.authorized = false;
				result.response.advice = [ ];

				return result;
			}

			const permissionsForRate = permissions.filter(p => p.restrictions.some(r => r.type === 'RATE_LIMITED'));

			if (permissions.length === permissionsForRate.length) {
				return null;
			}

			const permissionsForCount = permissions.filter(p => p.restrictions.some(r => r.type === 'COUNT_LIMITED'));

			if (permissions.length === permissionsForCount.length) {
				const restrictions = permissionsForCount.reduce((accumulator, permission) => {
					return accumulator.concat(permission.restrictions.filter(r => r.type === 'COUNT_LIMITED'));
				}, [ ]);

				restrictions.sort((a, b) => {
					return b.count - a.count;
				});

				const restriction = restrictions[0];

				let additional;

				if (is.number(data.count)) {
					additional = { actual: data.count };
				} else {
					additional = null;
				}

				result.response.authorized = is.number(data.count) && restriction.count >= data.count;

				const advice = { };

				advice.restriction = restriction;
				advice.restricted = !result.response.authorized;

				if (additional !== null) {
					advice.additional = additional;
				}

				result.response.advice = [ advice ];

				return result;
			} else {
				result.response.authorized = true;
				result.response.advice = [ ];

				return result;
			}
		}
	}

	return EntitlementsGateway;
})();
