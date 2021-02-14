# @barchart/entitlements-client-js

### Overview

This **JavaScript SDK** connects your application to the Barchart Entitlement Service.

### Integration

#### Authentication

Authentication is handled with [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token). Construct a [```JwtProvider```](packages/sdk-js/lib/security/JwtProvider) instance which generates tokens for the current user.

#### Extensions

You can supply an "observer" function which will be notified each time ```EntitlementsGateway.authorize``` is called. This could be used to trigger common UI components. Here is an example:

```js
const myAuthorizationObserver = (request, response) => {
	console.log(JSON.stringify(request, null, 2));
	console.log(JSON.stringify(response, null, 2));
};
```

#### Setup

Build an instance of the ```EntitlementsGateway``` as follows:

```js
let myJwtProvider = JwtProvider.forDevelopment('00000000', 'BARCHART');
let myEntitlementsGateway;

EntitlementsGateway.forDevelopment(myJwtProvider, myAuthorizationObserver)
	.then((gateway) => {
		myEntitlementsGateway = gateway;
	});
```

#### Authorization

Each time a restricted operation is attempted, invoke the ```EntitlementsGateway.authorize``` function. This will asynchronously return a ```Boolean``` value, indicating if the referenced operation should be permitted.

```js
myEntitlementsGateway.authorize('some.operation')
	.then((authorized) => {
		if (authorized) {
			doSomeOperation();
		}
	});
```

### Examples

A simple Node.js script can be found in the `examples/node` directory. Review and execute as follows:

```shell
> node ./examples/node/example.js
```