/**
 * A meta namespace containing structural contracts of anonymous objects.
 *
 * @namespace Schema
 */

/**
 * An object describing the connection to the remote service.
 *
 * @typedef EntitlementsServiceMetadata
 * @type Object
 * @memberOf Schema
 * @property {String} server.semver - The remote service's software version number.
 * @property {String} server.environment - The remote service's environment name (e.g. production, test, staging, etc).
 * @property {String} user.id - The current user's identifier.
 * @property {String} user.permissions - The current user's permission level.
 * @property {String} context.id - The current user's context (i.e. Barchart customer identifier).
 */