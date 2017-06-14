/**
 * Created by tahas on 6/7/17.
 */
"use strict";

import HelpIntent from './intent/HelpIntent.js';
import InteractTestIntent from './intent/InteractTestIntent.js';

export default function handleConversation(appai, slack, msgText, msgChannelId, msgUser) {

	console.log("handleConversation");
	console.log('Got a msgText: ' + msgText);
	console.log('Got a msgChannelId: ' + msgChannelId);
	console.log('Got a msg from user: ' + msgUser + '. Will respond now...');

	if(msgText === "_test action")
	{ // bypass using apiai for this chat exchange between user/bot - for testing
		InteractTestIntent.buildSendResponse(slack, msgChannelId);
	}
	else {
		handle_NLP_response_message(appai, slack, msgText, msgChannelId, msgUser);
		//slack.chat.postMessage(message.channel, 'Hello <@' + `${message.user}` + '>! :tada:').catch(console.error);
	}
}

function handle_NLP_response_message(appai, slack, msgText, msgChannelId, msgUser) {

	console.log('user utterance: ' + msgText);

	// the combination of user and channel create a unique session
	let appaiRequest = appai.textRequest(msgText, {sessionId: msgUser + '---' + msgChannelId});

	console.log("utterance 2");

	appaiRequest.on('response', function (response)
	{
		let messageData = {};

		console.log(response);

		if (response.result.score < .70) {
			console.log('score too low: ' + response.result.score);
			console.log('closest matching intent action: ' + response.result.action);
			slack.chat.postMessage(msgChannelId, 'Yikes <@' + `${msgUser}` + '>! I am not following you - say again. :confounded:').catch(console.error);
		}
		else { //handle the cases with a matching INTENT
			console.log('score: ' + response.result.score);
			console.log('intent_action: ' + response.result.action);
			switch(response.result.action) {

				case 'input.unknown': ///////////////////////
					slack.chat.postMessage(msgChannelId, 'Sorry <@' + `${msgUser}` + '>! I did not get that. :confounded:').catch(console.error);
					break;

				case 'pi.welcome_resp': ///////////////////////
					slack.chat.postMessage(msgChannelId, "Howdy").catch(console.error);
					break;

				case PaycheckWrongIntent.getIntentActionName(): ///////////////////////
					PaycheckWrongIntent.buildSendResponse(slack, msgChannelId, response);
					break;

				case HelpIntent.getIntentActionName(): ///////////////////////
					HelpIntent.buildSendResponse(slack, msgChannelId, response);
					break;

				default: //////////////////DEFAULT
					console.log('intent_action: ' + response.result.action);
					slack.chat.postMessage(msgChannelId, 'Oops <@' + `${msgUser}` + '>! Say what? :grin:').catch(console.error);
			}
		}
	});

	appaiRequest.on('error', function(error) {
		console.log(error);
	});

	appaiRequest.end();
}

console.log("route_nlp logging");