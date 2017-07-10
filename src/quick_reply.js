/**
 * Created by Sam Taha
 */
"use strict";

import handleConversation from './route_nlp.js';

/**
 * Simulate quick reply that send the bots response via a NLP utterance
 *
 * @param apiai
 * @param slackClient
 * @param qr_text
 * @param payload_channel_id
 * @param payload_user_id
 * @param payload_user_name
 * @param utteranceMsg The utterance is processed via NLP, and response displayed as bot response.
 */
export function send_with_nlp(apiai, slackClient, qr_text, payload_channel_id,
                              payload_user_id, payload_user_name, utteranceMsg)
{
	send_internal(apiai, slackClient, qr_text, payload_channel_id,
		payload_user_id, payload_user_name, utteranceMsg, null);
}

/**
 * Simulate quick reply. Bot response is the literal utterance.
 *
 * @param apiai
 * @param slackClient
 * @param qr_text
 * @param payload_channel_id
 * @param payload_user_id
 * @param payload_user_name
 * @param utteranceMsg The utterance text is displayed as is, showing it coming from the bot.
 */
export function send_simple(apiai, slackClient, qr_text, payload_channel_id,
                            payload_user_id, payload_user_name, utteranceMsg)
{
	send_internal(apiai, slackClient, qr_text, payload_channel_id,
		payload_user_id, payload_user_name, null, utteranceMsg);
}

function send_internal(apiai, slackClient, qr_text, payload_channel_id,
                       payload_user_id, payload_user_name, spokenMsg, exactMsg) {
	//send out the quick reply msg (making it look like the user sent this)
	let opts = {};
	opts.as_user = false; //using "true" does not seme to work with permission scopes when using a bot. Come on Slack!!!
	opts.username = "(You said)"; //payload_user_name;
	opts.icon_emoji = ":loudspeaker:"; //":white_check_mark:"; //":loudspeaker:";
	opts.attachments = [{}];
	opts.attachments[0].text = '\"' + qr_text + '\"';
	opts.attachments[0].callback_id = "this_is_noop";
	opts.attachments[0].color = "#36a64f";

	let sendQR =  () => {
		slackClient.chat.postMessage(payload_channel_id, "", opts).catch(console.error);
	};

	//Send the actual reply (from the bot)
	if (spokenMsg !== null) {
		//Mimics showing quick reply (using load speaker icon) that came from the user
		sendQR();

		//route the utterance to NLP and show response as the bot message/response.
		handleConversation(apiai, slackClient, spokenMsg, payload_channel_id, payload_user_id);
	}
	else {

		sendQR();

		let sendBotResponse =  () => {
			slackClient.chat.postMessage(payload_channel_id, exactMsg).catch(console.error);
		};

		//This delay is a hack and is needed so that Slack does not batch
		//the bot messages together (batch the QR with and official bot response)
		setTimeout(sendBotResponse, 250);

		/*
		 const doPromise = () =>
		 {
		 return new Promise((resolve, reject) => {
		 sendQR();
		 resolve(); // fulfilled
		 });
		 };

		 doPromise()
		 .then(sendBotResponse())
		 .catch(console.error);
		 */
	}
}