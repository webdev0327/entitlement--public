# @barchart/entitlements-client-js

[![AWS CodeBuild](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiaVhBREZzRXlaOFZldzZFY1J5OGV3NzBteWRvU3F5bEdLT1o5dVJEOE1MQnNpRU9Fc3F6bWt3aWxuNWNXOUhPeHhoS2c0dDlGdG9HdHRBcWl3ZmFvVWJJPSIsIml2UGFyYW1ldGVyU3BlYyI6IlE0bnhKSUd6dDA3ZlloR0siLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)](https://github.com/barchart/entitlements-client-js)

### Overview

This **JavaScript SDK** connects your applications to the _Barchart User Entitlement Service_.

### SDK Instructions

#### Required Libraries

First, your application will require three libraries:

* @barchart/tgam-common-ui-js
* @barchart/tgam-jwt-js
* @barchart/entitlements-client-js

#### Setup Authorization UI

Next, let's setup the TGAM-specific UI components which will react to authorization attempts (successes or failures):

```js
import EntitlementCompositeController from '@barchart/tgam-common-ui-js/lib/web/components/entitlement/CompositeController';
import EntitlementModalController from '@barchart/tgam-common-ui-js/lib/web/components/entitlement/Modal/ModalController';
import EntitlementToastController from '@barchart/tgam-common-ui-js/lib/web/components/entitlement/Toast/ToastController';

const entitlementsController = new EntitlementCompositeController([
	new EntitlementModalController(this.$refs.mainApp),
	new EntitlementToastController(this.$refs.mainApp)
]);
```

#### Setup EntitlementsGateway

Now, let's initialize an ```EntitlementsGateway``` along with TGAM-specific JWT handling:

```js
import JwtGateway from '@barchart/tgam-jwt-js/lib/JwtGateway';

import EntitlementsGateway from '@barchart/entitlements-client-js/lib/gateway/EntitlementsGateway';
import EntitlementsJwtProvider from '@barchart/entitlements-client-js/lib/security/JwtProvider';

JwtGateway.forStaging()
	.then(() => {
		const jwtProvider = new EntitlementsJwtProvider(jwtGateway.toTokenGenerator('entitlements'), null, true, 'TGAM');

		EntitlementsGateway.forStaging(jwtProvider, entitlementsController.toAuthorizationObserver())
			.then((entitlementsGateway) => {
				// ready to use ...
			});
	});
```

#### Check Authorizations

Finally, let's attempt to authorize and action:

```js
entitlementsGateway.authorize('some.product.feature.action')
	.then((authorized) => {
		if (authorized) {
			doSomeAction();
		}
	});
```