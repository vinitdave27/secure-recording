const AWS = require('aws-sdk');
const Signer = require('./helpers/signer.js');
const secretsManager = new AWS.SecretsManager({ region: process.env.awsRegion });
const lambdaName = 'get-recording';

const getKeyFromSecretsManager = () => {
	return new Promise((resolve, reject) => {
		secretsManager.getSecretValue({ SecretId: process.env.awsSecretsManagerSecretName }, (err, data) => {
			if (err) {
				console.log('Get Secret Error', err);
				return reject(err);
			}
			console.log('Private Key retrieved');
			return resolve(data.SecretString);
		});
	});
};

exports.handler = async (event, context, callback) => {
	try {
		console.log(`${lambdaName}: START`);
		console.time(lambdaName);

		let RecordingSid = event.queryStringParameters.RecordingSid || 'jlbrock44_-_Apologize_Guitar_Deep_Fried';
		let sourceIp = event.requestContext.identity.sourceIp || '0.0.0.0/0';
		console.log(`${lambdaName} : RecordingSid : ${RecordingSid} : sourceIp : ${sourceIp}`);

		let resourceLocation = `${process.env.awsCloudFrontBaseUrl}/${RecordingSid}.mp3`;

		console.log(`${lambdaName} : Signing for Resource : ${resourceLocation}`);

		const policy = JSON.stringify({
			Statement: [
				{
					Resource: resourceLocation,
					Condition: {
						DateLessThan: {
							'AWS:EpochTime': Math.floor(new Date().getTime() / 1000) + 60 * 15,
						},
						IpAddress: {
							'AWS:SourceIp': sourceIp,
						},
					},
				},
			],
		});

		console.log(`${lambdaName} : Policy : ${policy}`);

		const signer = new Signer(process.env.awsCloudFrontKeyPairId, await getKeyFromSecretsManager());

		const signedCloudFrontUrl = signer.getSignedUrl({ policy, url: resourceLocation });

		console.log(`${lambdaName} : CloudFront Signed URL Generated Successfully!`);
		console.log(`${lambdaName} : `, signedCloudFrontUrl);

		console.timeEnd(lambdaName);
		callback(null, formatResponse({ media_url: signedCloudFrontUrl }));
	} catch (e) {
		console.error(`${lambdaName} : ***Error*** : `, e);
		console.timeEnd(lambdaName);
		callback(formatError(e));
	}
};

var formatResponse = function (body) {
	var response = {
		statusCode: 200,
		headers: {
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS,GET',
		},
		body: JSON.stringify(body),
	};
	return response;
};

var formatError = function (error) {
	console.log(error);
	var response = {
		statusCode: 500,
		headers: {
			'Content-Type': 'text/plain',
		},
		body: error,
	};
	return response;
};
