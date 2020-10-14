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
 * @property {String} type
 * @property {Number=} count
 * @property {String[]=} roles
 */

/*
function widgetAuthorizationObserver(operation, authorized, details) {
	if (authorized && details.type === 'LIMIT' && details.count) {
		showToast();
	}

	if (!authorized) {
		if (details.roles.some(r => r === 'registered') {
			showRegisteredModal();
		} else if (details.roles.some(r => r === 'subscriber') {
			showSubscriberModal();
		}
	}
}
*/