/**
 * Created by Sam Taha
 */

"use strict";

const util = require('util');
import handleConversation from '../route_nlp.js';
const quick_reply = require('../quick_reply.js');
import InteractTestIntent from './InteractTestIntent.js';

export default class InteractTestIntentCB {

	constructor() {
	}

	static registerInteractiveMsgHandler(slackInteractiveMessages, getClientByTeamId, apiai) {
		console.log("Test register Int Msg Handler");
		// Attach action handlers by `callback_id`
		slackInteractiveMessages.action(InteractTestIntent.getCallbackID(), (payload, respond) => {
			console.log("Pay Wrong action Int Msg Handler");

			// `payload` is JSON that describes an interaction with a message.
			console.log("interact payload:::::: " + util.inspect(payload, {showHidden: false, depth: null}));

			const slackClient = getClientByTeamId(payload.team.id);

			// The `actions` array contains details about the particular action (button press, menu selection, etc.)
			const action = payload.actions[0];

			// You should return a value which describes a message to replace the original.
			// Note that the payload contains a copy of the original message (`payload.original_message`).
			const replacement = payload.original_message;
			// Typically, you want to acknowledge the action and remove the interactive elements from the message
			delete replacement.attachments[0].actions;

			if (action.value === 'quick_reply_no_update') { //Do NOT update the interactive message

				quick_reply.send_with_nlp(apiai, slackClient, "Hi there", payload.channel.id, payload.user.id,
					payload.user.name, "Hi there");

				//clear the quick reply buttons
				replacement.attachments[0].text="";

				//returning null does NOT update the interactive message
				return null;
			}
			else if (action.value === 'quick_reply_update') {
				//replacement.text = "";
				replacement.attachments[0].text="";

				//handleConversation(apiai, slackClient, "Hello, removed suggested buttons", payload.channel.id, payload.user.id);
				quick_reply.send_with_nlp(apiai, slackClient, "I said Hi", payload.channel.id, payload.user.id,
					payload.user.name, "Hi, back at you!");

				return replacement;
			}
			else if (action.value === "update_only") {
				replacement.text = "Just updated this msg...";
				replacement.attachments[0].text="";
				return replacement;
			}
			else if (action.value === "fetch_email") { //fetch email address of user and use quick reply
				let opts = {};
				opts.user = payload.user.id;

				slackClient.users.info(payload.user.id, (x, user_info_response) => {
					console.log('user profile2: ' + util.inspect(user_info_response, {showHidden: false, depth: null}));
					let msgText = 'Hey, your email is: ' + user_info_response.user.profile.email;

					quick_reply.send_simple(apiai, slackClient, "Fetching Email", payload.channel.id, payload.user.id,
						payload.user.name, msgText);
				});

				//remove interactivity (optional but recommended)
				replacement.attachments[0].text="";
				return replacement;
			}
			else if (action.value === "promise_update") { //demonstrate message UPDATE using a Promise

				let allIsWell = true;
				const doPromise = () =>
				{
					return new Promise((resolve, reject) => {
						if (allIsWell) {
							let oopts = {
								text: 'The promise is delivered :smile:'
							};
							resolve(oopts); // fulfilled
						} else {
							let reason = new Error('Something not right');
							reject(reason); // reject
						}
					});
				};

				// Call respond() with a JSON object that represents a replacement message
				doPromise()
				//.then(formatMessage)
					.then(respond)
					// Set `replace_original` to `false` if the message is not meant to replace the original.
					.catch((error) => respond({ text: error.message, replace_original: false }));

				// Return null so that no update done here. The update
				// to the message is handled via the Promise above.
				return null;
			}
		});
	}
}