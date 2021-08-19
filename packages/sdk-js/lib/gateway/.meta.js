/**
 * A meta namespace containing structural contracts of anonymous objects.
 *
 * @namespace Schema
 */

/**
 * An object containing information about the remote service.
 *
 * @typedef EntitlementServiceInfo
 * @type Object
 * @memberOf Schema
 * @property {Object} service
 * @property {String} service.name - The remote service's name.
 * @property {String} service.environment - The remote service's environment name (e.g. production, test, staging, etc).
 * @property {String} service.version - The remote service's software version.
 * @property {String} service.description - The remote service's description.
 */

/**
 * An object describing a user and his/her assigned roles.
 *
 * @typedef User
 * @type Object
 * @memberOf Schema
 * @property {String} user - The user's identifier.
 * @property {String} context - The user's context.
 * @property {Schema.Role[]} roles - The user's roles.
 */

/**
 * An object describing a role (which can be assigned to a user).
 *
 * @typedef Role
 * @type Object
 * @memberOf Schema
 * @property {String} role - The role's identifier.
 * @property {String} context - The roles's context.
 * @property {Schema.Permission[]} permissions
 */

/**
 * @typedef Permission
 * @type Object
 * @memberOf Schema
 * @property {Schema.Operation} operation
 */

/**
 * @typedef Operation
 * @type Object
 * @memberOf Schema
 * @property {String} operation
 * @property {String} product
 * @property {Schema.Restriction[]} restrictions
 */

/**
 * @typedef Restriction
 * @type Object
 * @memberOf Schema
 * @property {String} type
 */


/**
 * @typedef AuthorizationRequest
 * @type Object
 * @memberOf Schema
 * @property {Object} user
 * @property {String} user.user
 * @property {String} user.context
 * @property {String[]} user.roles
 * @property {Object} operation
 * @property {String} operation.operation
 * @property {String} operation.product
 * @property {String[]} operation.restrictions
 */

/**
 * @typedef AuthorizationResponse
 * @type Object
 * @memberOf Schema
 * @property {Boolean} authorized
 * @property {Schema.RestrictionAdvice[]} advice
 */

/**
 * @typedef RestrictionAdvice
 * @type Object
 * @memberOf Schema
 * @property {Object} restriction
 * @property {String} restriction.type
 * @property {Boolean} restricted
 * @property {Object} additional
 */

/**
 * A meta namespace containing signatures of anonymous functions.
 *
 * @namespace Callbacks
 */

/**
 * A function which observes the authorization of an operation.
 *
 * @public
 * @callback AuthorizationObserver
 * @memberOf Callbacks
 * @param {Schema.AuthorizationRequest} request
 * @param {Schema.AuthorizationResponse} response
 */