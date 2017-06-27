/**
 * Created by Sam Taha.
 */
"use strict";

import handleConversation from './route_nlp.js';

export function send_with_nlp(apiai, slackClient, qr_text, payload_channel_id,
                             payload_user_id, payload_user_name, spokenMsg)
{
	send_internal(apiai, slackClient, qr_text, payload_channel_id,
		payload_user_id, payload_user_name, spokenMsg, null);
}

export function send_simple(apiai, slackClient, qr_text, payload_channel_id,
                                      payload_user_id, payload_user_name, exactMsg)
{
	send_internal(apiai, slackClient, qr_text, payload_channel_id,
		payload_user_id, payload_user_name, null, exactMsg);
}

function send_internal(apiai, slackClient, qr_text, payload_channel_id,
                                      payload_user_id, payload_user_name, spokenMsg, exactMsg) {
	//send out the quick reply msg (making it look like the user sent this)
	let opts = {};
	opts.as_user = false; //using "true" does not seme to work with permission scopes when using a bot. Come on Slack!!!
	opts.username = "(You said)"; //payload_user_name;
	opts.icon_emoji = ":loudspeaker:" //":white_check_mark:"; //":loudspeaker:";
	opts.attachments = [{}];
	opts.attachments[0].text = "";
	opts.attachments[0].callback_id = "this_is_noop";
	opts.attachments[0].color = "#36a64f";
	/*
	 opts.attachments[0].actions = [{
	 name: "game3",
	 text: qr_text,
	 type: "button",
	 style: "primary",
	 value: "quick_reply"
	 }];*/
	opts.attachments[0].fields = [{
		title: '\"' + qr_text + '\"',
		value: "",
		short: "false"
	}];
	slackClient.chat.postMessage(payload_channel_id, "", opts).catch(console.error);

	//Send the actual reply (from the bot)
	if (spokenMsg !== null)
		handleConversation(apiai, slackClient, spokenMsg, payload_channel_id, payload_user_id);
	else
		slackClient.chat.postMessage(payload_channel_id, exactMsg).catch(console.error);
}