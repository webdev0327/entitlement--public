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
 * @param {String} operation
 * @param {Boolean} authorized
 * @param {AuthorizationDetail} details
 */

/**
 * A meta namespace containing structural contracts of anonymous objects.
 *
 * @namespace Schema
 */

/**
 * @typedef AuthorizationDetail
 * @type Object
 * @memberOf Schema
 * @property {Object} user - Information about the user, always present.
 * @property {String} user.user - The user's identifier.
 * @property {String} user.context - The user's context.
 * @property {String[]} user.roles - The user's roles.
 * @property {Object=} operation - Information about the operation, omitted when the operation cannot be found.
 * @property {String} operation.product - The operation's product.
 * @property {String} operation.operation - The operation's code.
 * @property {String} operation.type - The operation's type.
 * @property {Object=} permission - The permission which granted access to the operation, omitted if no operation can be found or the authorization fails.
 * @property {String} permission.role - The role which owns the permission.
 * @property {String} permission.context - The role's context.
 * @property {Object=} usage - If the operation type requires counting, this object will be present.
 * @property {Number=} usage.count - The current count.
 */