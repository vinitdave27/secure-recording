const TokenValidator = require('twilio-flex-token-validator').validator;
const lambdaName = 'flex-token-validation';

exports.handler = async (event, context, callback) => {
	try {
		console.log(`${lambdaName}: START`);
		console.time(lambdaName);

		const token = event.authorizationToken.slice(6);

		const validationResult = await TokenValidator(token, process.env.twilioAccountSid, process.env.twilioAuthToken);

		console.log(`${lambdaName} : validationResult : `, validationResult);

		const effect = validationResult && validationResult.valid ? 'Allow' : 'Deny';

		console.log(`${lambdaName} : effect : `, effect);

		const authPolicy = {
			principalId: 'twilio',
			policyDocument: {
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'execute-api:Invoke',
						Resource: [
							`arn:aws:execute-api:${process.env.awsRegion}:${process.env.awsAccountId}:${process.env.awsApiId}/*/*`,
						],
						Effect: effect,
					},
				],
			},
		};
		console.log(`${lambdaName} : authPolicy : `, authPolicy);

		console.timeEnd(lambdaName);
		return authPolicy;
	} catch (error) {
		console.error(`${lambdaName} : ***Error*** : `, error);
		console.timeEnd(lambdaName);
		return {
			principalId: 'twilio',
			policyDocument: {
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'execute-api:Invoke',
						Resource: [
							`arn:aws:execute-api:${process.env.awsRegion}:${process.env.awsAccountId}:${process.env.awsApiId}/*/*`,
						],
						Effect: 'Deny',
					},
				],
			},
		};
	}
};
