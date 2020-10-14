/**
 * A meta namespace containing structural contracts of anonymous objects.
 *
 * @namespace Schema
 */

/**
 * An object containing information about the remote service.
 *
 * @typedef Service
 * @type Object
 * @memberOf Schema
 * @property {String} semver - The remote service's software version.
 * @property {String} environment - The remote service's environment name (e.g. production, test, staging, etc).
 */

/**
 * An object describing a user.
 *
 * @typedef User
 * @type Object
 * @memberOf Schema
 * @property {String} user - The user's identifier.
 * @property {String} context - The user's context.
 */

/**
 * An object describing a permission (which can be assigned to a role).
 *
 * @typedef UserEntitlements
 * @type Object
 * @memberOf Schema
 * @property {Schema.User} user
 * @property {Schema.Role[]} roles
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
 * Grants access to an operation (which can be assigned to a role).
 *
 * @typedef Permission
 * @type Object
 * @memberOf Schema
 * @param {Operation} operation
 * @param {Number} quantity
 * @param {String=} frame
 * @param {String=} group
 */

/**
 * An action which can be regulated.
 *
 * @typedef Operation
 * @type Object
 * @memberOf Schema
 * @param {String} operation - The operation's identifier.
 * @param {String} product - The operation's product identifier.
 * @param {String} type - The mechanism for regulating the action.
 */

/**
 * @typedef Authorization
 * @type Object
 * @memberOf Schema
 * @property {Schema.User} user - Always present.
 * @property {String[]} roles - Always present.
 * @property {Operation=} operation - Omitted only when operation cannot be resolved.
 * @property {Object} grant - Only present if the operation was authorized.
 * @property {String} grant.role - The name of the role
 * @property {Permission} grant.permission
 * @property {Object=} usage - If the operation type requires counting, this object will be present.
 * @property {Number=} usage.count - The current count.
 */
