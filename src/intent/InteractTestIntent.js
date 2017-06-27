/**
 * Created by Sam Taha.
 */

"use strict";

const util = require('util');

const INTENT_ACTION_NAME="test_action_name";
const CALLBACK_ID="welcome_action";

export default class InteractTestIntent {

	constructor() {
	}

	static getIntentActionName() {
		return INTENT_ACTION_NAME;
	}
	static getCallbackID() {
		return CALLBACK_ID;
	}

	static buildSendResponse(slack, msgChannelId, apiaiResponse) {

		let msgText = "Would you like to play a game?";

		let opts = {};

		let attachments1 = [
			{
				text: "Choose a game to play",
				fallback: "You are unable to choose a game",
				callback_id: CALLBACK_ID,
				color: "#3AA3E3",
				attachment_type: "default",
				actions: [
					{
						name: "game",
						text: "Quick Reply no/update", //send new msg only
						type: "button",
						value: "quick_reply"
					},
					{
						name: "game",
						text: "Quick Reply w/update", //send new msg and update current msg
						type: "button",
						value: "quick_reply_update"
					},
					{
						name: "game",
						text: "Update Only", //update msg only
						style: "danger",
						type: "button",
						value: "update_only",
						confirm: {
							title: "Only update msg",
							text: "Are you sure?",
							ok_text: "Yes",
							dismiss_text: "No"
						},
					},
					{
						name: "game",
						text: "Fetch Email",
						type: "button",
						value: "fetch_email"
					},
				]
			}];

		let attachments2 = [
			{
				pretext: "some attach pretext",
				text: "some attachment text"

			}];

		//console.log(attachments2);

		opts.attachments=attachments1;

		slack.chat.postMessage(msgChannelId, msgText, opts).catch(console.error);
	}
}