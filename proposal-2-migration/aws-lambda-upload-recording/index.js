const S3 = require('aws-sdk/clients/s3');
const axios = require('axios');
const lambdaName = 'uploadRecording';

exports.handler = async (event, context, callback) => {
	try {
		console.log(`${lambdaName}: START`);
		console.time(lambdaName);

		const { RecordingSid, RecordingUrl } = event.queryStringParameters;
		console.log(`${lambdaName}: RecordingSid: ${RecordingSid} : RecordingUrl: ${RecordingUrl}`);
		const { awsRegion, awsBucketName } = process.env;
		console.log(`${lambdaName}: awsRegion: ${awsRegion} : awsBucketName: ${awsBucketName}`);

		const { status, data } = await axios({ url: `${RecordingUrl}.mp3`, method: 'GET', responseType: 'stream' });

		if (status != 200) {
			console.log(
				`${lambdaName} : ***ERROR*** : Could not locate the recording for the RecordingSid: ${RecordingSid} and RecordingUrl: ${RecordingUrl}`
			);
			callback({
				error: `${lambdaName} : ***ERROR*** : Could not locate the recording for the RecordingSid: ${RecordingSid} and RecordingUrl: ${RecordingUrl}`,
			});
		}
		console.log(`${lambdaName}: status: ${status}`);
		if (!data) {
			console.log(
				`${lambdaName} : ***ERROR*** : No data stream for RecordingSid: ${RecordingSid} and RecordingUrl: ${RecordingUrl}`
			);
			callback({
				error: `${lambdaName} : ***ERROR*** : No data stream for RecordingSid: ${RecordingSid} and RecordingUrl: ${RecordingUrl}`,
			});
		}
		console.log(`${lambdaName}: retrieved the call recording successfully.`);

		const target = { Bucket: awsBucketName, Key: `${RecordingSid}.mp3`, Body: data };

		console.log(`${lambdaName}: Starting Upload Process to S3`);

		const managedUploadToS3 = new S3.ManagedUpload({ params: target });

		managedUploadToS3.on('httpUploadProgress', (progress) => {
			console.log(`${lambdaName} : ${progress.loaded} bytes of ${progress.total} bytes`);
		});
		await managedUploadToS3.promise();
		console.log(`${lambdaName} :  Upload Completed for ${RecordingSid} and ${RecordingUrl}`);
		console.timeEnd(lambdaName);
		callback(null, formatResponse({ success: true }));
	} catch (error) {
		console.error(`${lambdaName} : ***Error*** : `, error);
		console.timeEnd(lambdaName);
		callback(formatError(error));
	}
};

var formatResponse = function (body) {
	var response = {
		statusCode: 200,
		body: JSON.stringify(body),
	};
	return response;
};

var formatError = function (error) {
	console.log(error);
	var response = {
		statusCode: 500,
		body: JSON.stringify(error),
	};
	return response;
};
