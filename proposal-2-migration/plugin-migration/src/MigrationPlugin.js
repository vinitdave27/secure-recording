import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';

const PLUGIN_NAME = 'MigrationPlugin';

export default class MigrationPlugin extends FlexPlugin {
	constructor() {
		super(PLUGIN_NAME);
	}

	async init(flex, manager) {
		// All logic managed in CustomListeners.js

		// Test to make sure the REACT_APP_RECORD_CHANNEL .env variable has been
		// configured correctly. If it has not, throw errors and notifications.
		if (
			process.env.REACT_APP_RECORD_CHANNEL.toLowerCase() != 'worker' &&
			process.env.REACT_APP_RECORD_CHANNEL.toLowerCase() != 'customer'
		) {
			flex.Notifications.registerNotification({
				id: 'brokenVar',
				content:
					'The Dual Channel Recording plugin will not work because the .env file has not been configured correctly.', // string
				type: 'error',
				timeout: 0,
			});

			flex.Notifications.showNotification('brokenVar', null);
			console.error(
				'ERROR: REACT_APP_RECORD_CHANNEL env variable does not have the correct value. Refer to your .env file to fix.'
			);
		}
	}
}
