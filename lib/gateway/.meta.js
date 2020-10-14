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
 * @property {Object} user
 * @property {String} user.user
 * @property {String} user.context
 * @property {String[]} user.roles
 * @property {Object=} permission
 * @property {String} permission.role
 * @property {String} permission.context
 * @property {String} permission.product
 * @property {String} permission.operation
 * @property {String} permission.type
 * @property {Object=} usage
 * @property {Number=} usage.count
 */