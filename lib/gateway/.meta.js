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
 * @property {String} semver - The remote service's software version.
 * @property {String} environment - The remote service's environment name (e.g. production, test, staging, etc).
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
 * @property {Permission[]} permissions
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