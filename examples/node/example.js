const process = require('process');

const EntitlementsGateway = require('./../../lib/gateway/EntitlementsGateway'),
	EntitlementsJwtProvider = require('./../../lib/security/JwtProvider');

const startup = (() => {
	'use strict';

	let entitlementsJwtProvider = null;
	let entitlementsGateway = null;

	process.on('SIGINT', () => {
		console.log('Example: Processing SIGINT');

		if (entitlementsJwtProvider !== null) {
			entitlementsJwtProvider.dispose();
		}

		if (entitlementsGateway !== null) {
			entitlementsGateway.dispose();
		}

		console.log('Example: Node.js example script ending');

		process.exit();
	});

	process.on('unhandledRejection', (error) => {
		console.error('Unhandled Promise Rejection', error);
		console.trace();
	});

	process.on('uncaughtException', (error) => {
		console.error('Unhandled Error', error);
		console.trace();
	});

	const user = '00000000';
	const context = 'TGAM';
	const permissions = 'globe-unlimited';

	console.log(`Example: Configuring EntitlementsGateway to impersonate user [ ${user}/${context} ]`);

	const authorizationObserver = (request, response) => {
		console.log(`Example: Authorization observer notified.`);

		console.log(JSON.stringify(request, null, 2));
		console.log(JSON.stringify(response, null, 2));
	};

	return EntitlementsGateway.forDevelopment(entitlementsJwtProvider = EntitlementsJwtProvider.forDevelopment(user, context, permissions), authorizationObserver)
		.then((gateway) => {
			entitlementsGateway = gateway;

			const operation = 'watchlist.exports.csv';
			const data = null;

			console.log(`Example: Requesting authorization for operation [ ${operation} ]`);

			return entitlementsGateway.authorize(operation, data)
				.then((authorized) => {
					if (authorized) {
						console.log(`Example: Authorization granted for operation [ ${operation} ]`);
					} else {
						console.log(`Example: Authorization denied for operation [ ${operation} ]`);
					}
				});
		});
})();
