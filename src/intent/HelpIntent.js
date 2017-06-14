/**
 * Created by tahas on 6/9/17.
 */

"use strict";

const util = require('util');

const INTENT_ACTION_NAME="pi.help";
const CALLBACK_ID="pi.help_cb";

export default class HelpIntent {

	constructor() {
	}

	static getIntentActionName() {
		return INTENT_ACTION_NAME;
	}
	static getCallbackID() {
		return CALLBACK_ID;
	}

	static buildSendResponse(slack, msgChannelId, apiaiResponse) {

		let msgText = "I can answer questions about anything and also help you " +
			"become a rock star. Just ask.";

		let opts = {};

		let attachments1 = [
			{
				text: "Try one of these questions:",
				fallback: "You are unable to choose a game",
				callback_id: CALLBACK_ID,
				color: "#3AA3E3",
				attachment_type: "default",
				actions: [
					{
						name: "help",
						text: "Current Date", //send new msg only
						type: "button",
						value: "current_date"
					},
					{
						name: "help",
						text: "Yesterdays Date", //send new msg and update current msg
						type: "button",
						value: "past_date"
					},
					{
						name: "help",
						text: "Compare Dates", //send new msg and update current msg
						type: "button",
						value: "compare_date"
					},
					{
						name: "help",
						text: "I Need Special Help", //update msg only
						style: "danger",
						type: "button",
						value: "special_help"
					}
				]
			}];

		opts.attachments=attachments1;

		slack.chat.postMessage(msgChannelId, msgText, opts).catch(console.error);
	}
}