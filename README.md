# @barchart/entitlements-client-js

[![AWS CodeBuild](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiaVhBREZzRXlaOFZldzZFY1J5OGV3NzBteWRvU3F5bEdLT1o5dVJEOE1MQnNpRU9Fc3F6bWt3aWxuNWNXOUhPeHhoS2c0dDlGdG9HdHRBcWl3ZmFvVWJJPSIsIml2UGFyYW1ldGVyU3BlYyI6IlE0bnhKSUd6dDA3ZlloR0siLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)](https://github.com/barchart/entitlements-client-js)

### Overview

This **JavaScript SDK** connects your application to the _Barchart User Entitlement Service_.

### Integration

#### Authentication

Authentication is handled with [JWT](https://en.wikipedia.org/wiki/JSON_Web_Token). Construct a [```JwtProvider```](./lib/security/JwtProvider) instance which generates tokens for the current user.

#### Extensions

You can supply an "observer" function which will be notified each time ```EntitlementsGateway.authorize``` is called. This could be used to trigger common UI components. Here is an example:

```js
let myAuthorizationObserver = (request, response) => {
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

Each time a restricted operation is attempted, invoke the ```EntitlementsGateway.authorize``` function. This asynchronous invocation will return a ```Boolean``` value indicating if the operation should be permitted.

```js
myEntitlementsGateway.authorize('some.operation')
	.then((authorized) => {
		if (authorized) {
			doSomeOperation();
		}
	});
```