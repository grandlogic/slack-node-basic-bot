/**
 * Created by Sam Taha
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
		opts.attachments = [];

		let attachments0 =
			{
				text: "Suggested quick reply actions:",
				fallback: "You are unable to choose a game",
				callback_id: CALLBACK_ID,
				color: "#3AA3E3",
				attachment_type: "default",
				actions: [
					{
						name: "game",
						text: "Quick Reply no/update", //send new msg only
						type: "button",
						value: "quick_reply_no_update"
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
					{
						name: "game",
						text: "Promise Update",
						type: "button",
						value: "promise_update"
					}
				]
			};

		let attachments1 =
			{
				pretext: "some attach pretext",
				text: "some attachment text"

			};

		let attachments2 =
			{
				text: "Choose a game to play",
				fallback: "You are unable to choose a game",
				callback_id: CALLBACK_ID + "2",
				color: "#3AA3E3",
				attachment_type: "default",
				actions: [
					{
						name: "game2",
						text: "Quick Reply no/update", //send new msg only
						type: "button",
						value: "quick_reply"
					},
					{
						name: "game2",
						text: "Quick Reply w/update", //send new msg and update current msg
						type: "button",
						value: "quick_reply_update"
					},
					{
						name: "game2",
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
						name: "game2",
						text: "Fetch Email",
						type: "button",
						value: "fetch_email"
					},
					{
						name: "game2",
						text: "Test Promise",
						type: "button",
						value: "test_promise"
					}
				]
			};

		let attachments3 =
			{
				text: "Choose a game to play",
				fallback: "You are unable to choose a game",
				callback_id: CALLBACK_ID + '3',
				color: "#3AA3E3",
				attachment_type: "default",
				actions: [
					{
						name: "game3",
						text: "Quick Reply no/update", //send new msg only
						type: "button",
						value: "quick_reply"
					},
					{
						name: "game3",
						text: "Quick Reply w/update", //send new msg and update current msg
						type: "button",
						value: "quick_reply_update"
					},
					{
						name: "game3",
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
						name: "game3",
						text: "Fetch Email",
						type: "button",
						value: "fetch_email"
					},
					{
						name: "game3",
						text: "Test Promise",
						type: "button",
						value: "test_promise"
					}
				]
			};

		//console.log(attachments2);

		opts.attachments[0]=attachments0;
		//opts.attachments[1]=attachments2;
		//opts.attachments[2]=attachments3;

		slack.chat.postMessage(msgChannelId, msgText, opts).catch(console.error);
	}
}