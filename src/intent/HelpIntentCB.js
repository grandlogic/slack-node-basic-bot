/**
 * Created by tahas on 6/9/17.
 */

"use strict";

const util = require('util');
import handleConversation from '../route_nlp.js';
import HelpIntent from './HelpIntent.js';

export default class HelpIntentCB {

	constructor() {
	}

	static registerInteractiveMsgHandler(slackInteractiveMessages, getClientByTeamId, apiai) {
		console.log("Register Int Help Handler");
		// Attach action handlers by `callback_id`
		slackInteractiveMessages.action(HelpIntent.getCallbackID(), (payload) => {

			// `payload` is JSON that describes an interaction with a message.
			console.log("interact payload: " + util.inspect(payload, {showHidden: false, depth: null}));

			const slackClient = getClientByTeamId(payload.team.id);

			// The `actions` array contains details about the particular action (button press, menu selection, etc.)
			const action = payload.actions[0];

			// You should return a value which describes a message to replace the original.
			// Note that the payload contains a copy of the original message (`payload.original_message`).
			const replacement = payload.original_message;
			// Typically, you want to acknowledge the action and remove the interactive elements from the message
			delete replacement.attachments[0].actions;

			if (action.value === 'current_date') {

				replacement.text = "Assuming NLP is hooked up, the current date is:";
				replacement.attachments[0].text="";

				// Route the user's interaction as a simulated conversational response
				handleConversation(apiai, slackClient, "What time is it?", payload.channel.id, payload.user.id);

				return replacement;
			}
			else if (action.value === 'past_date') {
				replacement.text = "";
				replacement.attachments[0].text="The yesterday's date was...well never mind. I don't feel like answering you.";

				return replacement;
			}
			else if (action.value === 'compare_date') {
				replacement.text = "Yikes, that is an odd question. Ask me something else.";
				replacement.attachments[0].text="";

				return replacement;
			}
			else { // Need special help
				replacement.text = "No sure I can help you with that. Find a doctor perhaps.";
				replacement.attachments[0].text="";

				return replacement;
			}
		});
	}
}