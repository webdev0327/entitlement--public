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
 * The role and permission data which caused an operation to be authorized.
 *
 * @typedef Grant
 * @type Object
 * @memberOf Schema
 * @property {Permission} permission - The permission which was used to grant authorization.
 * @property {String} role - The identifier of the role which owns the granting permission.
 */

/**
 * Information regarding how many times the operation has been authorized.
 *
 * @typedef Usage
 * @type Object
 * @memberOf Schema
 * @property {Number} count
 */

/**
 * @typedef Authorization
 * @type Object
 * @memberOf Schema
 * @property {Schema.User} user - Always present.
 * @property {String[]} roles - Always present.
 * @property {Operation=} operation - Present if the operation cannot be resolved.
 * @property {Grant=} grant - Present if the operation was authorized; otherwise absent.
 * @property {Usage=} usage - Present if the operation's type requires counting (may be present even if authorization fails).
 */
